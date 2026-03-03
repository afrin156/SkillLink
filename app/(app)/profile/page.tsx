"use client"

import { useSession } from "next-auth/react"
import { User, Mail, Calendar, BadgeCheck, ShieldCheck, Shield, Briefcase, FileText, Map, MessageSquare, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const profileLinks = [
  { href: "/resume-builder", label: "Resume Builder", icon: FileText, description: "Build and manage your ATS-ready resume", gradient: "from-blue-500 to-blue-700", border: "hover:border-blue-500/30", glow: "hover:shadow-blue-500/20" },
  { href: "/roadmap", label: "Career Roadmap", icon: Map, description: "View your personalized learning plan", gradient: "from-violet-500 to-violet-700", border: "hover:border-violet-500/30", glow: "hover:shadow-violet-500/20" },
  { href: "/applications", label: "My Applications", icon: Briefcase, description: "Track your job application statuses", gradient: "from-cyan-500 to-cyan-700", border: "hover:border-cyan-500/30", glow: "hover:shadow-cyan-500/20" },
  { href: "/messages", label: "Messages", icon: MessageSquare, description: "View your conversations", gradient: "from-emerald-500 to-emerald-700", border: "hover:border-emerald-500/30", glow: "hover:shadow-emerald-500/20" },
]

export default function ProfilePage() {
  const { data: session } = useSession()
  const user = session?.user as any

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-violet-600/10 via-blue-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-violet-400" />
          <span className="text-xs text-violet-400 font-medium">My Account</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-sm text-white/40 mt-1">Your account information and verification status</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-2xl font-bold text-white border-2 border-white/10">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-2 border-[#05080f] flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">✓</span>
              </div>
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">{user?.name || "User"}</h2>
            <p className="text-sm text-white/40">{user?.email || ""}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Badge className="capitalize bg-white/8 text-white/50 border-white/10">{user?.role || "student"}</Badge>
              {user?.isVerifiedHR && <Badge className="gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20"><BadgeCheck className="h-3 w-3" /> Verified HR</Badge>}
              {user?.isVerifiedStudent && <Badge className="gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><ShieldCheck className="h-3 w-3" /> Verified Student</Badge>}
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          {/* Account details */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="text-base font-semibold text-white mb-4">Account Details</h2>
            <div className="space-y-3">
              {[
                { icon: User, label: "Full Name", value: user?.name || "N/A" },
                { icon: Mail, label: "Email", value: user?.email || "N/A" },
                { icon: Shield, label: "Role", value: user?.role || "student" },
                { icon: Calendar, label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl bg-white/3 border border-white/5 p-3">
                  <item.icon className="h-5 w-5 text-white/30 shrink-0" />
                  <div>
                    <p className="text-xs text-white/30">{item.label}</p>
                    <p className="font-medium text-white/80 capitalize">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Status */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="text-base font-semibold text-white mb-1">Verification Status</h2>
            <p className="text-xs text-white/30 mb-4">Your trust status on the SkillLink platform</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {user?.role === "student" && (
                <div className={`flex items-center gap-3 rounded-xl border p-4 ${user?.isVerifiedStudent ? "border-emerald-500/20 bg-emerald-500/8" : "border-amber-500/20 bg-amber-500/8"}`}>
                  <ShieldCheck className={`h-6 w-6 ${user?.isVerifiedStudent ? "text-emerald-400" : "text-amber-400"}`} />
                  <div>
                    <p className={`font-medium text-sm ${user?.isVerifiedStudent ? "text-emerald-300" : "text-amber-300"}`}>Student Verification</p>
                    <p className={`text-xs mt-0.5 ${user?.isVerifiedStudent ? "text-emerald-400/60" : "text-amber-400/60"}`}>{user?.isVerifiedStudent ? "✓ Verified by admin" : "⏳ Pending admin review"}</p>
                  </div>
                </div>
              )}
              {user?.role === "hr" && (
                <div className={`flex items-center gap-3 rounded-xl border p-4 ${user?.isVerifiedHR ? "border-blue-500/20 bg-blue-500/8" : "border-amber-500/20 bg-amber-500/8"}`}>
                  <BadgeCheck className={`h-6 w-6 ${user?.isVerifiedHR ? "text-blue-400" : "text-amber-400"}`} />
                  <div>
                    <p className={`font-medium text-sm ${user?.isVerifiedHR ? "text-blue-300" : "text-amber-300"}`}>HR Verification</p>
                    <p className={`text-xs mt-0.5 ${user?.isVerifiedHR ? "text-blue-400/60" : "text-amber-400/60"}`}>{user?.isVerifiedHR ? "✓ Verified by admin" : "⏳ Pending admin review"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="text-base font-semibold text-white mb-4">Quick Links</h2>
            <div className="space-y-2">
              {profileLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div className={`group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.01] p-3 transition-all cursor-pointer hover:bg-white/[0.04] hover:shadow-lg ${link.glow} ${link.border}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${link.gradient} shadow-md`}>
                      <link.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{link.label}</p>
                      <p className="text-xs text-white/30">{link.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/20 transition-all group-hover:text-white/60 group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}