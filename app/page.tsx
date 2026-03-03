"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  ShieldCheck, BadgeCheck, Briefcase, FileText, Map,
  MessageSquare, Users, ExternalLink, ArrowRight,
  CheckCircle2, Lock, Sparkles, Zap, Brain, Cpu, Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

/* ── Animated particle canvas ── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number; y: number; vx: number; vy: number
      size: number; opacity: number; color: string
    }[] = []

    const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981"]

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    let animId: number
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(99,179,237,${0.08 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, "0")
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    const resize = () => {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

const features = [
  { icon: ShieldCheck, title: "Verified Jobs Only", description: "Every job posting is verified by our admin team. No scams, no fake listings.", gradient: "from-blue-500 to-blue-700", glow: "group-hover:shadow-blue-500/20", border: "group-hover:border-blue-500/30" },
  { icon: BadgeCheck, title: "Verified HR Profiles", description: "Recruiters must be verified before posting. Blue check = trusted employer.", gradient: "from-violet-500 to-violet-700", glow: "group-hover:shadow-violet-500/20", border: "group-hover:border-violet-500/30" },
  { icon: ExternalLink, title: "Official Career Links", description: "Every job includes a direct link to the company's official career page.", gradient: "from-cyan-500 to-cyan-700", glow: "group-hover:shadow-cyan-500/20", border: "group-hover:border-cyan-500/30" },
  { icon: FileText, title: "ATS Resume Builder", description: "Build an ATS-optimized resume with real scoring and PDF download.", gradient: "from-emerald-500 to-emerald-700", glow: "group-hover:shadow-emerald-500/20", border: "group-hover:border-emerald-500/30" },
  { icon: Map, title: "Career Roadmaps", description: "Personalized learning paths with free resources for every career track.", gradient: "from-amber-500 to-amber-700", glow: "group-hover:shadow-amber-500/20", border: "group-hover:border-amber-500/30" },
  { icon: MessageSquare, title: "Direct Messaging", description: "Connect directly with verified recruiters and fellow students.", gradient: "from-rose-500 to-rose-700", glow: "group-hover:shadow-rose-500/20", border: "group-hover:border-rose-500/30" },
]

const trustStats = [
  { value: "100%", label: "Verified Listings", icon: "🛡️" },
  { value: "0", label: "Fake Jobs Allowed", icon: "🚫" },
  { value: "Free", label: "For Students", icon: "🎓" },
  { value: "24/7", label: "Admin Monitoring", icon: "👁️" },
]

const testimonials = [
  { name: "Priya Sharma", role: "Computer Science, 3rd Year", text: "Finally a platform where I don't have to worry about fake job postings. The verification badges gave me confidence to apply.", avatar: "PS", gradient: "from-blue-500 to-violet-500" },
  { name: "Rahul Mehta", role: "HR Manager, TechCorp", text: "SkillLink's verification process is thorough. It helps us connect with genuine, talented students.", avatar: "RM", gradient: "from-emerald-500 to-cyan-500" },
  { name: "Ananya Patel", role: "Data Science, Final Year", text: "The roadmap generator and resume builder helped me land my first internship. All resources are free!", avatar: "AP", gradient: "from-rose-500 to-amber-500" },
]

export default function LandingPage() {
  const { data: session } = useSession()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#05080f] text-white overflow-x-hidden">

      <ParticleCanvas />

      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }} />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[150px]"
          style={{ transform: `translateY(${-scrollY * 0.05}px)` }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/8 rounded-full blur-[120px]" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: `linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05080f]/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/30">
              <Briefcase className="h-4 w-4 text-white" />
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#05080f] animate-pulse" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              SkillLink
            </span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            {["Features", "Trust", "Testimonials"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-sm text-white/40 transition-all hover:text-white">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 border-0 shadow-lg shadow-blue-500/25">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5">Sign In</Button>
                </Link>
                <Link href="/auth">
                  <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 border-0 shadow-lg shadow-blue-500/30">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 py-32 lg:py-44">
        <div className="mx-auto max-w-5xl text-center">

          {/* Floating badges */}
          <div className="hidden lg:block">
            <div className="absolute top-32 left-8 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2.5 text-xs text-white/60 animate-bounce" style={{ animationDuration: "3s" }}>
              🤖 AI-Powered Matching
            </div>
            <div className="absolute top-48 right-8 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2.5 text-xs text-white/60 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
              ✅ Verified Recruiters
            </div>
            <div className="absolute bottom-32 left-16 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2.5 text-xs text-white/60 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}>
              🛡️ Zero Fake Jobs
            </div>
            <div className="absolute bottom-48 right-16 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2.5 text-xs text-white/60 animate-bounce" style={{ animationDuration: "4.5s", animationDelay: "1.5s" }}>
              🎓 10K+ Students
            </div>
          </div>

          {/* Live badge */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-blue-500/20 bg-blue-500/8 px-5 py-2 text-sm text-blue-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
            </span>
            Live · Trusted by 10,000+ students across India
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl leading-none mb-6">
            <span className="block text-white/90">Your Career,</span>
            <span className="block bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Verified
            </span>
            <span className="block text-white/90">and{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Safe</span>
            </span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-white/40 max-w-2xl mx-auto">
            The only career platform where every job, every recruiter, and every event is verified.
            No scams. No fake listings. Just real opportunities for real students.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth">
              <Button size="lg" className="gap-2 px-10 h-14 text-base bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 border-0 shadow-2xl shadow-blue-500/40">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg"
              className="gap-2 h-14 px-8 text-base border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm"
              onClick={() => setShowLoginModal(true)}>
              <Briefcase className="h-4 w-4" /> Browse Verified Jobs
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-white/30">
            {["No Credit Card Required", "100% Free for Students", "Admin Verified Daily"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
              </div>
            ))}
          </div>
        </div>

        {/* Tech icons row */}
        <div className="relative z-10 mt-20 flex items-center justify-center gap-6 flex-wrap">
          {[
            { icon: Brain, label: "AI Matching", color: "text-violet-400" },
            { icon: Cpu, label: "Smart Verify", color: "text-blue-400" },
            { icon: Globe, label: "Pan India", color: "text-cyan-400" },
            { icon: ShieldCheck, label: "Zero Scam", color: "text-emerald-400" },
            { icon: Zap, label: "Instant Apply", color: "text-amber-400" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-2 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm group-hover:border-white/20 group-hover:bg-white/8 transition-all">
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <span className="text-xs text-white/30">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Stats */}
      <section id="trust" className="relative z-10 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-10">
            <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
              {trustStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{stat.value}</div>
                  <div className="mt-2 text-sm text-white/40">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs text-violet-300">
              <Sparkles className="h-3 w-3" /> Platform Features
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Everything You Need for a{" "}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Safe Career Start</span>
            </h2>
            <p className="mt-4 text-white/40">Built from the ground up with student safety and career growth in mind.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}
                className={`group cursor-pointer border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-all duration-300 ${feature.border} hover:shadow-2xl ${feature.glow} hover:-translate-y-2`}
                onClick={() => !session && setShowLoginModal(true)}>
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-white/40">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">How Verification Works</h2>
            <p className="mt-4 text-white/40">A rigorous 4-step process ensuring every listing is 100% legitimate</p>
          </div>
          <div className="space-y-5">
            {[
              { step: "01", title: "HR Registers", desc: "Recruiters sign up and submit their company details for review.", gradient: "from-blue-500 to-blue-700" },
              { step: "02", title: "Admin Verifies", desc: "Our admin team manually reviews and verifies each HR profile.", gradient: "from-violet-500 to-violet-700" },
              { step: "03", title: "Job Posted", desc: "Verified HR posts jobs with mandatory official career page URLs.", gradient: "from-cyan-500 to-cyan-700" },
              { step: "04", title: "Job Verified", desc: "Admin approves each job listing before it appears publicly.", gradient: "from-emerald-500 to-emerald-700" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-5 group">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg text-sm font-bold text-white`}>
                  {item.step}
                </div>
                <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] p-4 group-hover:border-white/10 group-hover:bg-white/[0.04] transition-all">
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-white/40 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-white sm:text-4xl">What Our Users Say</h2>
          <p className="text-center text-white/40 mb-16">Real feedback from real students and recruiters</p>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-white/10 hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="mb-4 flex gap-1">{[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}</div>
                  <p className="mb-6 text-sm leading-relaxed text-white/50">{`"${t.text}"`}</p>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-xs font-bold text-white`}>{t.avatar}</div>
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                        {t.name} <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <div className="text-xs text-white/40">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 via-violet-600/15 to-cyan-600/15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-2 text-sm text-blue-300">
            <Sparkles className="h-3.5 w-3.5" /> Join 10,000+ Students
          </div>
          <h2 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Start Your{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Verified Career</span>{" "}
            Journey
          </h2>
          <p className="mt-6 text-lg text-white/40">
            Join thousands of students who trust SkillLink for safe, verified career opportunities.
          </p>
          <Link href="/auth">
            <Button size="lg" className="mt-10 gap-2 px-12 h-14 text-base bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 border-0 shadow-2xl shadow-blue-500/40">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
              <Briefcase className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-white">SkillLink</span>
          </div>
          <p className="text-sm text-white/25">© 2025 SkillLink · Verified Career Networking Platform for Students</p>
        </div>
      </footer>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="border-white/10 bg-[#0d1117] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Lock className="h-5 w-5 text-blue-400" /> Login Required
            </DialogTitle>
            <DialogDescription className="text-white/50">
              You need to be logged in to use this feature. Create a free account to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Link href="/auth" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 border-0">Sign In / Register</Button>
            </Link>
            <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setShowLoginModal(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}