"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, Building2, GraduationCap, BadgeCheck, Mail, Loader2, ShieldCheck } from "lucide-react"
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
    if (FREE_DOMAINS.includes(domain))
      return { type: "error", text: `❌ HR must use company email, not ${domain}` }
    return { type: "success", text: `✅ Company email — you'll get Verified HR badge` }
  }

  if (role === "student") {
    const isCollege = STUDENT_DOMAINS.some(d => domain.endsWith(d))
    if (isCollege) return { type: "success", text: `✅ College email — you'll get Verified Student badge` }
    if (FREE_DOMAINS.includes(domain)) return { type: "warning", text: `⚠ Use college email (.ac.in / .edu) to get Verified badge` }
    return { type: "warning", text: `⚠ Use college email (.ac.in / .edu) to get Verified badge` }
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
      if (!res.ok) { toast.error(data.error || "Registration failed"); return }

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
        toast.error(otpData.error || "Failed to send OTP.")
        router.push("/auth")
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
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Invalid OTP"); return }

      toast.success("Email verified! Logging you in...")
      const loginResult = await signIn("credentials", { email, password, redirect: false })

      if (loginResult?.ok) {
        toast.success("Welcome to SkillLink! 🎉")
        router.push(role === "hr" ? "/hr" : "/dashboard")
        router.refresh()
      } else {
        toast.success("Email verified! Please login.")
        router.push("/auth")
      }
    } catch { toast.error("Verification failed") }
    finally { setLoading(false) }
  }

  const resendOTP = async () => {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (res.ok) toast.success("OTP resent!")
    else toast.error("Failed to resend OTP")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-5">

        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <BadgeCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">SkillLink</span>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            {step === "form" ? "Create your account" : "Verify your email"}
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-6 space-y-4">

            {step === "form" ? (
              <>
                {/* Role selector */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">I am a...</p>
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
                            ? "border-primary bg-primary/8 dark:bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-muted/40"
                        )}>
                        <r.icon className={cn("h-6 w-6", role === r.value ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-sm font-semibold", role === r.value ? "text-primary" : "text-foreground")}>{r.label}</span>
                        <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fields */}
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
                        emailHint?.type === "error" && "border-red-500 focus-visible:ring-red-400",
                        emailHint?.type === "success" && "border-green-500 focus-visible:ring-green-400",
                      )}
                    />
                    {emailHint && (
                      <p className={cn("text-xs px-1",
                        emailHint.type === "error" ? "text-red-500" :
                        emailHint.type === "success" ? "text-green-500" : "text-yellow-500"
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

                {/* Info box — dark mode compatible */}
                <div className={cn(
                  "rounded-xl p-3 text-xs space-y-1 border",
                  role === "hr"
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    : "bg-green-500/10 border-green-500/20 text-green-400"
                )}>
                  {role === "hr" ? (
                    <>
                      <p className="font-semibold">🏢 HR Verification</p>
                      <p>Use your company email to get the <strong>Verified HR ✅</strong> badge.</p>
                      <p className="opacity-70">Gmail / Yahoo / Hotmail not accepted for HR accounts.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">🎓 Student Verification</p>
                      <p>Use college email (.ac.in or .edu) to get the <strong>Verified Student ✅</strong> badge.</p>
                      <p className="opacity-70">Gmail is accepted but won't get the verified badge.</p>
                    </>
                  )}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleRegister}
                  disabled={loading || emailHint?.type === "error"}>
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account...</>
                    : "Create Account & Send OTP"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth" className="text-primary font-medium hover:underline">
                    Sign In
                  </Link>
                </p>
              </>
            ) : (
              /* OTP Step */
              <div className="space-y-4">
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
                  autoComplete="off"
                />

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length < 4}>
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Verifying & Logging in...</>
                    : "Verify & Login"}
                </Button>

                <div className="text-center space-y-2 pt-1">
                  <button type="button" onClick={resendOTP}
                    className="text-sm text-primary hover:underline block w-full">
                    Didn't receive? Resend OTP
                  </button>
                  <button type="button" onClick={() => setStep("form")}
                    className="text-xs text-muted-foreground hover:underline block w-full">
                    ← Change email
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}