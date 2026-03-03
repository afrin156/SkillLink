"use client"

import Image from "next/image"
import React, { Suspense } from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard, Rss, Briefcase, Bookmark, FileCheck,
  FileText, Map, Video, MessageSquare, GraduationCap,
  AlertTriangle, User, LogOut, Menu, X, BadgeCheck,
  ShieldCheck, Bell, Search, ChevronDown, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { useIdleTimeout } from "@/hooks/useIdleTimeout"

const studentNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/saved", label: "Saved Jobs", icon: Bookmark },
  { href: "/applications", label: "Applications", icon: FileCheck },
  { href: "/resume-builder", label: "Resume Builder", icon: FileText },
  { href: "/roadmap", label: "Career Roadmap", icon: Map },
  { href: "/webinars", label: "Webinars", icon: Video },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/interview-prep", label: "Interview Prep", icon: GraduationCap },
  { href: "/career-ai", label: "Career AI ✨", icon: Sparkles },
  { href: "/fake-job-check", label: "Fake Job Detection", icon: AlertTriangle },
  { href: "/profile", label: "Profile", icon: User },
]

const hrNavItems = [
  { href: "/hr", label: "Dashboard", icon: LayoutDashboard },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/hr/jobs", label: "Posted Jobs", icon: Briefcase },
  { href: "/hr/applicants", label: "Applicants", icon: FileCheck },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/career-ai", label: "Career AI ✨", icon: Sparkles },
  { href: "/hr/webinars", label: "My Webinars", icon: Video },
  { href: "/profile", label: "Profile", icon: User },
]

function IdleWarningBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get("reason") !== "idle") return null
  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-sm text-amber-400">
      ⚠️ You were logged out due to 30 minutes of inactivity.
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useIdleTimeout(30)

  const user = session?.user as any
  const role = user?.role
  const allNavItems = role === "hr" ? hrNavItems : studentNavItems

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#05080f] text-white">Loading...</div>}>
      <div className="flex h-screen bg-[#05080f] text-white overflow-hidden">

        {/* Ambient glows */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-0 left-64 w-[500px] h-[400px] bg-blue-600/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-[120px]" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.02]"
            style={{ backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-[#080c15]/95 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
            <Link href="/dashboard" className="flex items-center gap-2.5">

              {/* ===== YOUR LOGO HERE ===== */}
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="SkillLink"
                  width={36}
                  height={36}
                  className="rounded-xl"
                />
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border-2 border-[#080c15] animate-pulse" />
              </div>
              {/* ===== END LOGO ===== */}

              <span className="text-lg font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                SkillLink
              </span>
            </Link>
            <button className="text-white/40 hover:text-white lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-0.5">
              {allNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                      isActive
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                        : "text-white/40 hover:bg-white/5 hover:text-white/80"
                    )}>
                    <item.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive && "text-blue-400")} />
                    {item.label}
                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          <div className="border-t border-white/5 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/3 p-2.5 border border-white/5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-sm font-bold text-white border border-white/10">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-white/80">{user?.name || "User"}</span>
                  {user?.isVerifiedHR && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-400" />}
                  {user?.isVerifiedStudent && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                </div>
                <span className="text-xs capitalize text-white/30">{role || "student"}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <IdleWarningBanner />

          <header className="flex h-16 items-center gap-4 border-b border-white/5 bg-[#05080f]/80 backdrop-blur-xl px-4 lg:px-6">
            <button className="text-white/40 hover:text-white lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex flex-1 items-center gap-4">
              <div className="relative hidden max-w-sm flex-1 md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                <Input placeholder="Search..."
                  className="pl-9 bg-white/5 border-white/8 text-white placeholder:text-white/20 focus:border-blue-500/40" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/5 rounded-xl">
                <Bell className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 hover:bg-white/5 rounded-xl">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-sm font-bold text-white border border-white/10">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="hidden text-sm font-medium text-white/60 md:inline">{user?.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-white/30" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#0d1117] border-white/10 text-white">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-white/40">{user?.email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Badge className="text-xs capitalize bg-white/8 text-white/50 border-0">{role}</Badge>
                      {user?.isVerifiedHR && <Badge className="gap-1 text-xs bg-blue-500/10 text-blue-400 border-0"><BadgeCheck className="h-3 w-3" /> Verified HR</Badge>}
                      {user?.isVerifiedStudent && <Badge className="gap-1 text-xs bg-emerald-500/10 text-emerald-400 border-0"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem asChild className="text-white/60 hover:text-white focus:bg-white/5 cursor-pointer">
                    <Link href="/profile"><User className="mr-2 h-4 w-4" /> Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:bg-red-500/10 cursor-pointer"
                    onClick={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6">{children}</div>
          </main>
        </div>
      </div>
    </Suspense>
  )
}