import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { createHash } from "crypto"
import { getDb } from "./mongodb"

// ✅ Same hash function as register route
function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex")
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const db = await getDb()
        const user = await db.collection("users").findOne({
          email: credentials.email.toLowerCase(),
        })

        if (!user) return null

        // ✅ Check email verification for students
        if (user.role === "student" && !user.isVerifiedStudent) {
          throw new Error("Please verify your email first")
        }

        // 🔒 Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
          const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000)
          throw new Error(`Account locked. Try again in ${minutesLeft} minute(s).`)
        }

        // ✅ Compare using SHA256 (same as register)
        const hashedInput = hashPassword(credentials.password)
        const isValid = hashedInput === user.passwordHash

        if (!isValid) {
          // ❌ Wrong password — increment attempts
          const attempts = (user.loginAttempts || 0) + 1
          const update: Record<string, unknown> = { loginAttempts: attempts }

          if (attempts >= 5) {
            update.lockUntil = Date.now() + 15 * 60 * 1000 // lock 15 mins
            update.loginAttempts = 0
          }

          await db.collection("users").updateOne(
            { email: credentials.email.toLowerCase() },
            { $set: update }
          )

          const remaining = 5 - attempts
          if (remaining <= 0) {
            throw new Error("Too many attempts. Account locked for 15 minutes.")
          }
          throw new Error(`Invalid password. ${remaining} attempt(s) left.`)
        }

        // ✅ Success — reset lockout
        await db.collection("users").updateOne(
          { email: credentials.email.toLowerCase() },
          { $set: { loginAttempts: 0, lockUntil: null } }
        )

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isVerifiedStudent: user.isVerifiedStudent,
          isVerifiedHR: user.isVerifiedHR,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.isVerifiedStudent = (user as any).isVerifiedStudent
        token.isVerifiedHR = (user as any).isVerifiedHR
        token.id = (user as any).id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).isVerifiedStudent = token.isVerifiedStudent
        ;(session.user as any).isVerifiedHR = token.isVerifiedHR
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: "/auth",
  },
  secret: process.env.NEXTAUTH_SECRET,
}