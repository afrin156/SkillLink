"use client"

import React, { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Briefcase, ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) { toast.error("Enter email and password"); return }
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        toast.error("Invalid email or password")
      } else {
        toast.success("Welcome back!")
        router.push("/dashboard")
        router.refresh()
      }
    } catch { toast.error("Something went wrong") }
    finally { setLoading(false) }
  }

  async function handleForgotPassword() {
    if (!forgotEmail.trim()) { toast.error("Enter your email"); return }
    setForgotLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      })
      if (res.ok) {
        setForgotSent(true)
        toast.success("Reset link sent! Check your email.")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to send reset email")
      }
    } catch { toast.error("Something went wrong") }
    finally { setForgotLoading(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Briefcase className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">SkillLink</h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Verified Career Platform
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold">Welcome Back</h2>
              <p className="text-sm text-muted-foreground">Sign in to your SkillLink account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Signing in...</>
                  : "Sign In"}
              </Button>
            </form>

            {/* ── FORGOT PASSWORD ── */}
            {!showForgot ? (
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary hover:underline transition-colors">
                Forgot your password?
              </button>
            ) : forgotSent ? (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center space-y-2">
                <div className="text-2xl">📬</div>
                <p className="text-sm font-semibold text-green-700">Reset link sent!</p>
                <p className="text-xs text-green-600">
                  Check your inbox at <strong>{forgotEmail}</strong><br />
                  (also check spam folder). Link expires in 30 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail("") }}
                  className="text-xs text-green-700 underline">
                  ← Back to login
                </button>
              </div>
            ) : (
              <div className="space-y-2 p-4 bg-muted/40 rounded-xl border">
                <p className="text-sm font-semibold">Reset Password</p>
                <p className="text-xs text-muted-foreground">Enter your email and we'll send a reset link</p>
                <Input
                  type="email"
                  placeholder="Enter your registered email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleForgotPassword()}
                />
                <div className="flex gap-2">
                  <Button size="sm" type="button" onClick={handleForgotPassword}
                    disabled={forgotLoading} className="flex-1">
                    {forgotLoading
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Sending...</>
                      : "Send Reset Link"}
                  </Button>
                  <Button size="sm" type="button" variant="ghost" onClick={() => setShowForgot(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Register link */}
            <p className="text-center text-sm text-muted-foreground pt-2 border-t">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Create Account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}