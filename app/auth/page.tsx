"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, Building2, GraduationCap, BadgeCheck, Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const FREE_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "rediffmail.com", "icloud.com", "live.com"]
const STUDENT_DOMAINS = [".edu", ".ac.in", ".edu.in", ".ac.uk"]

function getEmailHint(email: string, role: string) {
  const domain = email.split("@")[1]?.toLowerCase()
  if (!domain || !email.includes("@")) return null

  if (role === "hr") {
    if (FREE_DOMAINS.includes(domain)) {
      return { type: "error", text: `❌ HR must use company email, not ${domain}` }
    }
    return { type: "success", text: `✅ Company email — you'll get Verified HR badge` }
  }

  if (role === "student") {
    const isCollege = STUDENT_DOMAINS.some(d => domain.endsWith(d))
    if (isCollege) return { type: "success", text: `✅ College email — you'll get Verified Student badge` }
    return { type: "warning", text: `⚠ Use college email (.ac.in/.edu) to get Verified badge` }
  }
  return null
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<"form" | "otp">("form")
  const [role, setRole] = useState("student")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const emailHint = getEmailHint(email, role)

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      toast.error("All fields are required")
      return
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (emailHint?.type === "error") {
      toast.error("Please use a valid company email for HR accounts")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }

      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (otpRes.ok) {
        toast.success("OTP sent to your email!")
        setStep("otp")
      } else {
        const otpData = await otpRes.json()
        toast.error(otpData.error || "Failed to send OTP. Try logging in.")
        router.push("/auth/login")
      }
    } catch { toast.error("Registration failed") }
    finally { setLoading(false) }
  }

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length < 4) {
      toast.error("Enter the OTP sent to your email")
      return
    }
    setLoading(true)
    try {
      // Step 1: Verify the OTP
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Invalid OTP")
        return
      }

      // ✅ Step 2: Auto login after OTP verified
      toast.success("Email verified! Logging you in...")

      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (loginResult?.ok) {
        // ✅ Step 3: Redirect to dashboard based on role
        toast.success("Welcome to SkillLink! 🎉")
        if (role === "hr") {
          router.push("/hr")
        } else {
          router.push("/dashboard")
        }
      } else {
        // If auto-login fails for any reason, send to login page
        toast.success("Email verified! Please login.")
        router.push("/auth/login")
      }

    } catch {
      toast.error("Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const resendOTP = async () => {
    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    toast.success("OTP resent!")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <BadgeCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">SkillLink</span>
          </div>
          <p className="text-muted-foreground text-sm">
            {step === "form" ? "Create your account" : "Verify your email"}
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {step === "form" ? (
              <>
                {/* Role selector */}
                <div>
                  <p className="text-sm font-medium mb-2">I am a...</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "student", label: "Student", icon: GraduationCap, desc: "Looking for jobs" },
                      { value: "hr", label: "HR / Recruiter", icon: Building2, desc: "Hiring talent" },
                    ].map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center cursor-pointer",
                          role === r.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        )}>
                        <r.icon className={cn("h-6 w-6", role === r.value ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-sm font-semibold", role === r.value ? "text-primary" : "")}>{r.label}</span>
                        <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  <Input
                    placeholder="Full Name"
                    value={name}
                    autoComplete="off"
                    onChange={e => setName(e.target.value)}
                  />

                  <div className="space-y-1">
                    <Input
                      type="email"
                      autoComplete="off"
                      placeholder={role === "hr" ? "name@yourcompany.com" : "name@college.ac.in"}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={cn(
                        emailHint?.type === "error" && "border-red-400 focus-visible:ring-red-400",
                        emailHint?.type === "success" && "border-green-400 focus-visible:ring-green-400",
                      )}
                    />
                    {emailHint && (
                      <p className={cn("text-xs px-1",
                        emailHint.type === "error" ? "text-red-500" :
                        emailHint.type === "success" ? "text-green-600" : "text-yellow-600"
                      )}>
                        {emailHint.text}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Password (min 6 characters)"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleRegister()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Info box */}
                <div className={cn("rounded-xl p-3 text-xs space-y-1",
                  role === "hr" ? "bg-blue-50 border border-blue-200" : "bg-green-50 border border-green-200"
                )}>
                  {role === "hr" ? (
                    <>
                      <p className="font-semibold text-blue-700">🏢 HR Verification</p>
                      <p className="text-blue-600">Use your company email to get the <strong>Verified HR ✅</strong> badge.</p>
                      <p className="text-blue-500">Gmail/Yahoo/Hotmail not accepted for HR accounts.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-green-700">🎓 Student Verification</p>
                      <p className="text-green-600">Use your college email (.ac.in or .edu) to get the <strong>Verified Student ✅</strong> badge.</p>
                      <p className="text-green-500">Gmail is accepted but won't get the verified badge.</p>
                    </>
                  )}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleRegister}
                  disabled={loading || emailHint?.type === "error"}>
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating account...</>
                    : "Create Account & Send OTP"}
                </Button>

                {/* ✅ Fixed: Login link now correctly points to /auth (login page) */}
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-primary font-medium hover:underline">
  Login
</Link>
                </p>
              </>
            ) : (
              /* OTP Step */
              <>
                <div className="text-center space-y-2">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="font-bold text-lg">Check your email</h2>
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit OTP to<br />
                    <span className="font-semibold text-foreground">{email}</span>
                  </p>
                </div>

                <Input
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={e => e.key === "Enter" && handleVerifyOTP()}
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length < 4}>
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying & Logging in...</>
                    : "Verify & Login"}
                </Button>

                <div className="text-center space-y-2">
                  <button type="button" onClick={resendOTP} className="text-sm text-primary hover:underline">
                    Didn't receive? Resend OTP
                  </button>
                  <br />
                  <button type="button" onClick={() => setStep("form")} className="text-xs text-muted-foreground hover:underline">
                    ← Change email
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}