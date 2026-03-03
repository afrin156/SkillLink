"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  Briefcase, FileCheck, Bookmark, FileText, Map,
  MessageSquare, BadgeCheck, ShieldCheck, ArrowRight,
  AlertCircle, Sparkles, TrendingUp, Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const quickLinks = [
  { href: "/jobs", label: "Browse Jobs", icon: Briefcase, description: "Find verified opportunities", gradient: "from-blue-500 to-blue-700", glow: "hover:shadow-blue-500/20", border: "hover:border-blue-500/30" },
  { href: "/applications", label: "Applications", icon: FileCheck, description: "Track your applications", gradient: "from-violet-500 to-violet-700", glow: "hover:shadow-violet-500/20", border: "hover:border-violet-500/30" },
  { href: "/saved", label: "Saved Jobs", icon: Bookmark, description: "Your bookmarked jobs", gradient: "from-cyan-500 to-cyan-700", glow: "hover:shadow-cyan-500/20", border: "hover:border-cyan-500/30" },
  { href: "/resume-builder", label: "Resume Builder", icon: FileText, description: "Build ATS-ready resume", gradient: "from-emerald-500 to-emerald-700", glow: "hover:shadow-emerald-500/20", border: "hover:border-emerald-500/30" },
  { href: "/roadmap", label: "Career Roadmap", icon: Map, description: "Personalized learning path", gradient: "from-amber-500 to-amber-700", glow: "hover:shadow-amber-500/20", border: "hover:border-amber-500/30" },
  { href: "/messages", label: "Messages", icon: MessageSquare, description: "Connect with recruiters", gradient: "from-rose-500 to-rose-700", glow: "hover:shadow-rose-500/20", border: "hover:border-rose-500/30" },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const user = session?.user as any

  return (
    <div className="space-y-6">

      {/* Welcome header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-blue-600/10 via-violet-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs text-emerald-400 font-medium">Online</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{user?.name?.split(" ")[0] || "User"}</span> 👋
            </h1>
            <p className="mt-1 text-white/40 text-sm">Here is your career dashboard overview.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {user?.role === "hr" && user?.isVerifiedHR && (
              <Badge className="gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified HR
              </Badge>
            )}
            {user?.role === "student" && user?.isVerifiedStudent && (
              <Badge className="gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified Student
              </Badge>
            )}
            <Badge className="capitalize bg-white/8 text-white/50 border border-white/10">{user?.role || "student"}</Badge>
          </div>
        </div>
      </div>

      {/* Verification notice */}
      {user?.role === "student" && !user?.isVerifiedStudent && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-300">Verification Pending</p>
            <p className="text-xs text-amber-400/70">Your student profile is pending verification. An admin will review your account shortly.</p>
          </div>
        </div>
      )}

      {user?.role === "hr" && !user?.isVerifiedHR && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-300">HR Verification Pending</p>
            <p className="text-xs text-amber-400/70">Your HR account is pending verification. You cannot post jobs until verified by an admin.</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-blue-400" />
          <h2 className="text-base font-semibold text-white">Quick Actions</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className={`group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 cursor-pointer hover:shadow-xl ${link.glow} ${link.border} hover:-translate-y-0.5`}>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${link.gradient} shadow-lg`}>
                  <link.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white/80 group-hover:text-white transition-colors">{link.label}</p>
                  <p className="text-xs text-white/30">{link.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/20 transition-all group-hover:text-white/60 group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Platform Trust */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">Platform Trust</h2>
          <span className="text-xs text-white/30 ml-1">Every listing is manually verified</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: BadgeCheck, label: "Verified HR Only", sub: "All recruiters are admin-verified", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { icon: ShieldCheck, label: "Verified Jobs", sub: "Every job listing is reviewed", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { icon: Briefcase, label: "Official Links", sub: "Direct company career pages", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border ${item.border} ${item.bg} p-4 text-center`}>
              <item.icon className={`mx-auto h-8 w-8 ${item.color} mb-2`} />
              <p className="text-sm font-medium text-white/80">{item.label}</p>
              <p className="text-xs text-white/30 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-4 w-4 text-violet-400" />
          <h2 className="text-base font-semibold text-white">Getting Started</h2>
        </div>
        <div className="space-y-2">
          {[
            { label: "Complete your profile", href: "/profile", gradient: "from-blue-500 to-blue-600" },
            { label: "Build your ATS-ready resume", href: "/resume-builder", gradient: "from-violet-500 to-violet-600" },
            { label: "Generate a career roadmap", href: "/roadmap", gradient: "from-cyan-500 to-cyan-600" },
            { label: "Browse verified job listings", href: "/jobs", gradient: "from-emerald-500 to-emerald-600" },
          ].map((step, i) => (
            <Link key={step.href} href={step.href}>
              <div className="flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/5 group">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} text-xs font-bold text-white shadow-lg`}>
                  {i + 1}
                </div>
                <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors">{step.label}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}