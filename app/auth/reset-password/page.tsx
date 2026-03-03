"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Briefcase, Eye, EyeOff, CheckCircle, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const isValid = token && email
  const passwordMatch = password === confirm
  const passwordStrong = password.length >= 6

  const handleReset = async () => {
    if (!passwordStrong) { toast.error("Password must be at least 6 characters"); return }
    if (!passwordMatch) { toast.error("Passwords don't match"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setDone(true)
        toast.success("Password reset successfully!")
        setTimeout(() => router.push("/auth"), 3000)
      } else {
        toast.error(data.error || "Reset failed")
      }
    } catch { toast.error("Something went wrong") }
    finally { setLoading(false) }
  }

  if (!isValid) {
    return (
      <div className="text-center space-y-3">
        <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="font-bold text-lg">Invalid Link</h2>
        <p className="text-sm text-muted-foreground">This reset link is invalid or has expired.</p>
        <Button onClick={() => router.push("/auth")} variant="outline" className="w-full">
          Back to Login
        </Button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center space-y-3">
        <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="font-bold text-lg">Password Reset!</h2>
        <p className="text-sm text-muted-foreground">Your password has been updated. Redirecting to login...</p>
        <Button onClick={() => router.push("/auth")} className="w-full">Go to Login</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-lg">Set New Password</h2>
        <p className="text-sm text-muted-foreground">For <span className="font-medium text-foreground">{email}</span></p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">New Password</label>
        <div className="relative">
          <Input type={showPassword ? "text" : "password"}
            placeholder="Min 6 characters"
            value={password} onChange={e => setPassword(e.target.value)}
            className={cn(password && (passwordStrong ? "border-green-400" : "border-red-400"))} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {password && !passwordStrong && <p className="text-xs text-red-500">At least 6 characters required</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Confirm Password</label>
        <Input type="password" placeholder="Repeat your password"
          value={confirm} onChange={e => setConfirm(e.target.value)}
          className={cn(confirm && (passwordMatch ? "border-green-400" : "border-red-400"))} />
        {confirm && !passwordMatch && <p className="text-xs text-red-500">Passwords don't match</p>}
        {confirm && passwordMatch && passwordStrong && <p className="text-xs text-green-600">✓ Passwords match</p>}
      </div>

      <Button className="w-full" onClick={handleReset}
        disabled={loading || !passwordStrong || !passwordMatch}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Resetting...</> : "Reset Password"}
      </Button>

      <button onClick={() => router.push("/auth")}
        className="w-full text-xs text-muted-foreground hover:underline text-center block">
        ← Back to Login
      </button>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Briefcase className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">SkillLink</h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified Career Platform
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}