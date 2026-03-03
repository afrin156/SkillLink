"use client"

import { useState, useEffect } from "react"
import { Trophy, Upload, CheckCircle, ChevronDown, ChevronUp, BookOpen, Award, Target, Loader2, TrendingUp, ExternalLink, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const ROADMAP_SKILLS = [
  { id: "html_css", name: "HTML & CSS", category: "Frontend", difficulty: "Beginner" as const, estimatedHours: 20, description: "The foundation of every website — structure and styling.", steps: ["Learn HTML tags: headings, paragraphs, links, images, forms", "Understand CSS selectors, colors, fonts, spacing", "Master the Box Model (margin, padding, border)", "Learn Flexbox for horizontal/vertical layouts", "Learn CSS Grid for complex page layouts", "Build responsive designs with media queries"], resources: [{ label: "freeCodeCamp — Full HTML & CSS Course", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/", type: "course" }, { label: "MDN Web Docs — HTML Reference", url: "https://developer.mozilla.org/en-US/docs/Web/HTML", type: "docs" }, { label: "CSS Tricks — Flexbox Guide", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/", type: "article" }] },
  { id: "javascript", name: "JavaScript", category: "Frontend", difficulty: "Intermediate" as const, estimatedHours: 40, description: "Make websites interactive and dynamic with JavaScript.", steps: ["Variables, data types, operators", "Functions, scope, closures", "Arrays and Objects — methods and manipulation", "DOM manipulation — select, change, add elements", "Events — click, input, form submission", "Async JS — Promises, async/await, fetch API", "ES6+ features — arrow functions, destructuring, spread"], resources: [{ label: "JavaScript.info — Complete Free Course", url: "https://javascript.info/", type: "course" }, { label: "freeCodeCamp — JavaScript Algorithms", url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", type: "course" }] },
  { id: "react", name: "React", category: "Frontend", difficulty: "Intermediate" as const, estimatedHours: 50, description: "Build modern web apps with the most popular UI library.", steps: ["Understand components and JSX syntax", "Props — passing data between components", "useState — manage component state", "useEffect — side effects and API calls", "React Router — navigation between pages", "Forms and controlled inputs"], resources: [{ label: "React Official Docs (react.dev)", url: "https://react.dev/learn", type: "docs" }, { label: "Scrimba — Free React Course", url: "https://scrimba.com/learn/learnreact", type: "course" }] },
  { id: "nodejs", name: "Node.js & Express", category: "Backend", difficulty: "Intermediate" as const, estimatedHours: 35, description: "Build server-side applications and REST APIs with JavaScript.", steps: ["Node.js basics — modules, fs, path, http", "npm — installing and managing packages", "Express.js — creating routes and middleware", "REST API design — GET, POST, PUT, DELETE", "Authentication with JWT tokens", "Connect to MongoDB or PostgreSQL"], resources: [{ label: "Node.js Official Docs", url: "https://nodejs.org/en/docs/", type: "docs" }, { label: "The Odin Project — NodeJS", url: "https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs", type: "course" }] },
  { id: "python", name: "Python", category: "Backend", difficulty: "Beginner" as const, estimatedHours: 30, description: "Versatile language for backend, data science, and automation.", steps: ["Syntax, variables, data types", "Control flow — if/else, loops", "Functions and modules", "Lists, tuples, dictionaries, sets", "OOP — classes, inheritance"], resources: [{ label: "Python.org Official Tutorial", url: "https://docs.python.org/3/tutorial/", type: "docs" }, { label: "CS50P — Harvard Python Course (Free)", url: "https://cs50.harvard.edu/python/2022/", type: "course" }] },
  { id: "sql", name: "SQL & Databases", category: "Backend", difficulty: "Beginner" as const, estimatedHours: 25, description: "Store and query data using relational databases.", steps: ["SELECT, WHERE, ORDER BY, LIMIT", "INSERT, UPDATE, DELETE", "JOINs — INNER, LEFT, RIGHT, FULL", "GROUP BY and aggregate functions", "Indexes for performance"], resources: [{ label: "SQLZoo — Interactive SQL Practice", url: "https://sqlzoo.net/", type: "tutorial" }, { label: "Mode SQL Tutorial", url: "https://mode.com/sql-tutorial/", type: "tutorial" }] },
  { id: "dsa", name: "Data Structures & Algorithms", category: "Core CS", difficulty: "Advanced" as const, estimatedHours: 80, description: "Essential for cracking technical interviews at top companies.", steps: ["Arrays & Strings — two pointers, sliding window", "Linked Lists — singly, doubly, reversal", "Stacks and Queues", "Hash Maps and Sets", "Trees — BST, traversals, height", "Graphs — BFS, DFS, shortest path", "Dynamic Programming — memoization, tabulation"], resources: [{ label: "NeetCode — Free DSA Roadmap & Videos", url: "https://neetcode.io/roadmap", type: "course" }, { label: "LeetCode — Practice Problems (Free)", url: "https://leetcode.com/problemset/", type: "practice" }] },
  { id: "git", name: "Git & GitHub", category: "Tools", difficulty: "Beginner" as const, estimatedHours: 10, description: "Version control — essential for every developer job.", steps: ["git init, add, commit — basic workflow", "Branches — create, switch, merge", "Push and pull from GitHub", "Pull Requests and code review", "Resolving merge conflicts"], resources: [{ label: "GitHub Skills — Interactive Courses", url: "https://skills.github.com/", type: "course" }, { label: "Learn Git Branching (Visual)", url: "https://learngitbranching.js.org/", type: "tutorial" }] },
  { id: "typescript", name: "TypeScript", category: "Frontend", difficulty: "Intermediate" as const, estimatedHours: 20, description: "Typed JavaScript — used in most professional codebases.", steps: ["Types — string, number, boolean, any", "Interfaces and Type aliases", "Generics — reusable typed components", "TypeScript with React"], resources: [{ label: "TypeScript Official Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html", type: "docs" }, { label: "Total TypeScript — Free Tutorials", url: "https://www.totaltypescript.com/tutorials", type: "course" }] },
  { id: "system_design", name: "System Design", category: "Core CS", difficulty: "Advanced" as const, estimatedHours: 60, description: "Design scalable systems — asked in senior developer interviews.", steps: ["Scalability — horizontal vs vertical scaling", "Load balancers and reverse proxies", "Databases — SQL vs NoSQL, sharding", "Caching — Redis, CDN", "Microservices vs monolith"], resources: [{ label: "System Design Primer (Free GitHub)", url: "https://github.com/donnemartin/system-design-primer", type: "docs" }, { label: "ByteByteGo — System Design (YouTube)", url: "https://www.youtube.com/@ByteByteGo", type: "video" }] },
]

const CATEGORIES = [...new Set(ROADMAP_SKILLS.map(s => s.category))]
const DIFFICULTY_COLORS = { Beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20", Advanced: "bg-red-500/10 text-red-400 border-red-500/20" }
const RESOURCE_ICONS: Record<string, string> = { course: "🎓", video: "▶️", docs: "📄", book: "📚", tutorial: "🛠️", practice: "💻", article: "📰" }

function CertUploadDialog({ skill, onUploaded }: { skill: any; onUploaded: () => void }) {
  const [open, setOpen] = useState(false)
  const [certName, setCertName] = useState(""); const [issuer, setIssuer] = useState(""); const [fileUrl, setFileUrl] = useState(""); const [completionDate, setCompletionDate] = useState(""); const [uploading, setUploading] = useState(false)
  const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20"
  const handleUpload = async () => {
    if (!certName.trim() || !fileUrl.trim()) { toast.error("Certificate name and URL are required"); return }
    setUploading(true)
    try {
      const res = await fetch("/api/roadmap/certificates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skillId: skill.id, skillName: skill.name, certName, issuer, fileUrl, completionDate }) })
      if (res.ok) { toast.success("Certificate uploaded! ✅"); setOpen(false); setCertName(""); setIssuer(""); setFileUrl(""); setCompletionDate(""); onUploaded() } else toast.error("Failed to upload")
    } catch { toast.error("Upload failed") } finally { setUploading(false) }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="gap-1.5 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10 border"><Upload className="h-3.5 w-3.5" /> Upload Certificate</Button></DialogTrigger>
      <DialogContent className="max-w-md bg-[#0d1117] border-white/10 text-white">
        <DialogHeader><DialogTitle className="flex items-center gap-2 text-white"><Award className="h-5 w-5 text-amber-400" />Upload Certificate — {skill.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div><label className="text-xs text-white/40 mb-1 block">Certificate Name *</label><Input className={inputClass} placeholder="e.g. React Developer Certificate" value={certName} onChange={e => setCertName(e.target.value)} /></div>
          <div><label className="text-xs text-white/40 mb-1 block">Issued By</label><Input className={inputClass} placeholder="e.g. Coursera, Udemy, freeCodeCamp" value={issuer} onChange={e => setIssuer(e.target.value)} /></div>
          <div><label className="text-xs text-white/40 mb-1 block">Certificate URL *</label><Input className={inputClass} placeholder="https://coursera.org/verify/..." value={fileUrl} onChange={e => setFileUrl(e.target.value)} /></div>
          <div><label className="text-xs text-white/40 mb-1 block">Completion Date</label><Input type="date" className={inputClass} value={completionDate} onChange={e => setCompletionDate(e.target.value)} /></div>
          <p className="text-xs text-white/30 bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">✨ Uploading a certificate will automatically mark this skill as 100% complete!</p>
          <Button className="w-full gap-2 bg-gradient-to-r from-blue-600 to-violet-600 border-0" onClick={handleUpload} disabled={uploading}>
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Upload & Complete Skill</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SkillCard({ skill, progress, onProgressUpdate, onCertUploaded }: { skill: any; progress?: { percent: number }; onProgressUpdate: (skillId: string, percent: number) => void; onCertUploaded: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const percent = progress?.percent ?? 0
  const isCompleted = percent === 100
  const stepsCompleted = Math.floor((percent / 100) * skill.steps.length)
  const updateProgress = async (newPercent: number) => {
    setUpdating(true)
    try {
      const res = await fetch("/api/roadmap/progress", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skillId: skill.id, percent: newPercent }) })
      if (res.ok) { onProgressUpdate(skill.id, newPercent); if (newPercent === 100) toast.success(`🎉 ${skill.name} completed!`) }
    } catch { toast.error("Failed to update") } finally { setUpdating(false) }
  }
  return (
    <div className={cn("rounded-xl border transition-all", isCompleted ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-white/[0.02]")}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", isCompleted ? "bg-emerald-500/20" : "bg-blue-500/15")}>
            {isCompleted ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <BookOpen className="h-5 w-5 text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-white/90">{skill.name}</span>
                <Badge variant="outline" className={cn("text-xs border", DIFFICULTY_COLORS[skill.difficulty as keyof typeof DIFFICULTY_COLORS])}>{skill.difficulty}</Badge>
                {isCompleted && <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ Completed</Badge>}
              </div>
              <span className="text-xs text-white/30 shrink-0">~{skill.estimatedHours}h</span>
            </div>
            <p className="text-xs text-white/35 mt-1">{skill.description}</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/30">{stepsCompleted}/{skill.steps.length} steps done</span>
                <span className={cn("text-xs font-bold", isCompleted ? "text-emerald-400" : "text-blue-400")}>{percent}%</span>
              </div>
              <Progress value={percent} className={cn("h-1.5 bg-white/10", isCompleted ? "[&>div]:bg-emerald-500" : "[&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-violet-500")} />
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {[0, 25, 50, 75, 100].map(p => (
                <button key={p} onClick={() => updateProgress(p)} disabled={updating}
                  className={cn("text-xs px-2.5 py-1 rounded-full border transition-all", percent === p ? "bg-blue-600 text-white border-blue-600" : "border-white/10 text-white/30 hover:border-blue-500/50 hover:text-blue-400")}>
                  {p}%
                </button>
              ))}
              <CertUploadDialog skill={skill} onUploaded={onCertUploaded} />
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="shrink-0 mt-1 p-1.5 rounded-xl hover:bg-white/5 transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-white/5 mx-4 mb-4 pt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wide mb-3 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> What to Learn — Step by Step</p>
            <div className="space-y-2">
              {skill.steps.map((step: string, i: number) => {
                const isDone = i < stepsCompleted
                return (
                  <div key={i} className={cn("flex items-start gap-2.5 p-2.5 rounded-xl", isDone ? "bg-emerald-500/8 border border-emerald-500/15" : "bg-white/3 border border-white/5")}>
                    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold", isDone ? "bg-emerald-500 text-white" : "bg-white/10 text-white/30")}>{isDone ? "✓" : i + 1}</div>
                    <span className={cn("text-sm", isDone ? "text-emerald-300 font-medium" : "text-white/60")}>{step}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wide mb-3 flex items-center gap-1.5"><Play className="h-3.5 w-3.5" /> Free Resources</p>
            <div className="space-y-2">
              {skill.resources.map((r: any, i: number) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
                  <span className="text-lg shrink-0">{RESOURCE_ICONS[r.type] || "🔗"}</span>
                  <span className="text-sm font-medium flex-1 text-white/60 group-hover:text-white transition-colors">{r.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-white/20 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RoadmapPage() {
  const [progressMap, setProgressMap] = useState<Record<string, { percent: number }>>({})
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("All")

  const fetchProgress = async () => {
    try { const res = await fetch("/api/roadmap/progress"); if (res.ok) { const data = await res.json(); const map: Record<string, { percent: number }> = {}; data.progress?.forEach((p: any) => { map[p.skillId] = p }); setProgressMap(map) } } catch {}
  }
  const fetchCertificates = async () => {
    try { const res = await fetch("/api/roadmap/certificates"); if (res.ok) { const data = await res.json(); setCertificates(data.certificates || []) } } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchProgress(); fetchCertificates() }, [])
  const handleProgressUpdate = (skillId: string, percent: number) => {
    setProgressMap(prev => ({ ...prev, [skillId]: { ...prev[skillId], skillId, percent, updatedAt: new Date().toISOString() } as any }))
  }
  const filteredSkills = activeCategory === "All" ? ROADMAP_SKILLS : ROADMAP_SKILLS.filter(s => s.category === activeCategory)
  const totalCompleted = ROADMAP_SKILLS.filter(s => (progressMap[s.id]?.percent ?? 0) === 100).length
  const overallPercent = Math.round(ROADMAP_SKILLS.reduce((acc, s) => acc + (progressMap[s.id]?.percent ?? 0), 0) / ROADMAP_SKILLS.length)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-violet-600/10 via-blue-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex items-center gap-2 mb-1"><Trophy className="h-4 w-4 text-violet-400" /><span className="text-xs text-violet-400 font-medium">Learning Path</span></div>
        <h1 className="text-2xl font-bold text-white">Career Skill Roadmap</h1>
        <p className="text-sm text-white/40 mt-1">Follow each skill step-by-step with free learning resources</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Overall Progress", value: `${overallPercent}%`, icon: TrendingUp, color: "from-blue-500 to-blue-700" },
          { label: "Skills Completed", value: `${totalCompleted}/${ROADMAP_SKILLS.length}`, icon: CheckCircle, color: "from-emerald-500 to-emerald-700" },
          { label: "Certificates", value: certificates.length, icon: Award, color: "from-amber-500 to-amber-700" },
          { label: "Total Skills", value: ROADMAP_SKILLS.length, icon: Target, color: "from-violet-500 to-violet-700" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-md`}>
              <stat.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/30">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overall bar */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/70">Overall Roadmap Progress</span>
          <span className="text-sm font-bold text-blue-400">{overallPercent}%</span>
        </div>
        <Progress value={overallPercent} className="h-2.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-violet-500" />
        <p className="text-xs text-white/25 mt-2">{totalCompleted === ROADMAP_SKILLS.length ? "🎉 You've completed the full roadmap!" : `${ROADMAP_SKILLS.length - totalCompleted} skill(s) remaining — click any skill to see steps and resources`}</p>
      </div>

      {/* Tip */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 p-3 text-sm text-blue-300 flex items-start gap-2">
        <span className="text-lg shrink-0">💡</span>
        <span>Click the <strong className="text-white">▼ arrow</strong> on any skill card to see what to learn step by step and free resources!</span>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {["All", ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={cn("text-xs px-3 py-1.5 rounded-full border transition-all font-medium", activeCategory === cat ? "bg-blue-600 text-white border-blue-600" : "border-white/10 text-white/30 hover:border-blue-500/50 hover:text-blue-400")}>
            {cat}
          </button>
        ))}
      </div>

      {/* Skills */}
      <div className="space-y-3">
        {filteredSkills.map(skill => (
          <SkillCard key={skill.id} skill={skill} progress={progressMap[skill.id]} onProgressUpdate={handleProgressUpdate} onCertUploaded={() => { fetchProgress(); fetchCertificates() }} />
        ))}
      </div>

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4"><Award className="h-4 w-4 text-amber-400" />Your Certificates ({certificates.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {certificates.map((cert: any) => (
              <div key={cert._id} className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <Award className="h-8 w-8 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-white/80">{cert.certName}</p>
                  {cert.issuer && <p className="text-xs text-white/30">{cert.issuer}</p>}
                  {cert.skillName && <Badge className="text-xs mt-1 bg-white/8 text-white/40 border-0">{cert.skillName}</Badge>}
                </div>
                <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline shrink-0">View →</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}