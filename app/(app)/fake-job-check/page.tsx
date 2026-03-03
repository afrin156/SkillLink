"use client"

import { useState } from "react"
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, CheckCircle, XCircle, Scan, ChevronDown, ChevronUp, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ScanDetail { category: string; triggered: boolean; reason: string }
interface ScanResult { riskScore: number; level: "green" | "yellow" | "red"; passed: boolean; flags: string[]; details: ScanDetail[] }

const LEVEL_CONFIG = {
  green: { label: "Safe Job", icon: ShieldCheck, color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/8", badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", desc: "This job posting appears legitimate. No major red flags detected." },
  yellow: { label: "Suspicious", icon: ShieldAlert, color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/8", badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20", desc: "Some suspicious patterns found. Verify the company before applying." },
  red: { label: "High Risk", icon: ShieldX, color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/8", badge: "bg-red-500/10 text-red-400 border border-red-500/20", desc: "Multiple scam indicators detected. Do NOT share personal info or pay any fees." },
}

const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 focus:bg-white/8 resize-none"
const labelClass = "text-xs font-medium text-white/40 mb-1 block"

export default function FakeJobCheckPage() {
  const [form, setForm] = useState({ title: "", company: "", salary: "", description: "" })
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const scan = async () => {
    if (!form.title.trim() || !form.description.trim()) { toast.error("Job title and description are required"); return }
    setScanning(true); setResult(null)
    try {
      const res = await fetch("/api/fake-job-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (res.ok) { const data = await res.json(); setResult(data); setShowDetails(false) } else { toast.error("Scan failed") }
    } catch { toast.error("Scan failed") } finally { setScanning(false) }
  }

  const config = result ? LEVEL_CONFIG[result.level] : null

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-red-600/10 via-amber-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex items-center gap-2 mb-1"><ShieldCheck className="h-4 w-4 text-red-400" /><span className="text-xs text-red-400 font-medium">Scam Protection</span></div>
        <h1 className="text-2xl font-bold text-white">Fake Job Detector</h1>
        <p className="text-sm text-white/40 mt-1">Paste a job posting to instantly detect scam patterns and get a risk score</p>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/8 p-4">
        <p className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> How it works</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {["Scam keyword scan", "Salary realism check", "Pressure language detection", "Legitimacy signal analysis"].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-xs text-white/40"><CheckCircle className="h-3 w-3 text-blue-400 shrink-0" />{item}</div>
          ))}
        </div>
      </div>

      {/* Input form */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2"><Scan className="h-4 w-4 text-blue-400" /> Enter Job Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className={labelClass}>Job Title *</label><Input className={inputClass} placeholder="e.g. Frontend Developer" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
          <div><label className={labelClass}>Company Name</label><Input className={inputClass} placeholder="e.g. Acme Corp" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></div>
        </div>
        <div><label className={labelClass}>Salary / Compensation</label><Input className={inputClass} placeholder="e.g. ₹5-8 LPA or 'unlimited earnings'" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} /></div>
        <div>
          <label className={labelClass}>Job Description *</label>
          <Textarea className={inputClass} placeholder="Paste the full job description here..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={6} />
          <p className="text-[10px] text-white/20 mt-1">{form.description.length} chars — more text = more accurate scan</p>
        </div>
        <Button className="w-full gap-2 bg-gradient-to-r from-blue-600 to-violet-600 border-0 shadow-lg shadow-blue-500/20" onClick={scan} disabled={scanning}>
          {scanning ? <><span className="animate-spin text-lg">⟳</span> Scanning...</> : <><Scan className="h-4 w-4" /> Scan for Fake Job</>}
        </Button>
      </div>

      {/* Result */}
      {result && config && (
        <div className="space-y-4">
          {/* Score card */}
          <div className={cn("rounded-2xl border-2 p-6", config.border, config.bg)}>
            <div className="flex items-start gap-4">
              <config.icon className={cn("h-12 w-12 shrink-0 mt-1", config.color)} />
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className={cn("text-2xl font-bold", config.color)}>{config.label}</h2>
                  <Badge className={cn("text-sm px-3 py-1", config.badge)}>Risk Score: {result.riskScore}/100</Badge>
                </div>
                <p className="text-sm text-white/40 mt-1">{config.desc}</p>
                {/* Score bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-white/25"><span>Safe</span><span>Suspicious</span><span>Dangerous</span></div>
                  <div className="relative h-3 bg-gradient-to-r from-emerald-500/40 via-amber-500/40 to-red-500/40 rounded-full border border-white/5">
                    <div className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-white/20 shadow-lg transition-all", result.level === "green" ? "bg-emerald-500" : result.level === "yellow" ? "bg-amber-500" : "bg-red-500")} style={{ left: `calc(${result.riskScore}% - 10px)` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-white/20"><span>0</span><span>30</span><span>60</span><span>100</span></div>
                </div>
              </div>
            </div>
            {result.flags.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wide">Red Flags Detected</p>
                <div className="space-y-1">
                  {result.flags.map((flag, i) => <div key={i} className="flex items-start gap-2 text-sm text-red-400/80"><XCircle className="h-4 w-4 shrink-0 mt-0.5" /><span>{flag}</span></div>)}
                </div>
              </div>
            )}
            {result.flags.length === 0 && <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm"><CheckCircle className="h-4 w-4" />No red flags detected</div>}
          </div>

          {/* Detailed breakdown */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <button className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/3 transition-colors" onClick={() => setShowDetails(!showDetails)}>
              <span className="text-sm font-semibold text-white/70">Detailed Scan Breakdown ({result.details.length} checks)</span>
              {showDetails ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
            </button>
            {showDetails && (
              <div className="px-5 pb-5 space-y-2 border-t border-white/5 pt-4">
                {result.details.map((detail, i) => (
                  <div key={i} className={cn("flex items-start gap-3 p-3 rounded-xl", detail.triggered ? "bg-red-500/8 border border-red-500/20" : "bg-emerald-500/5 border border-emerald-500/15")}>
                    <div className="shrink-0 mt-0.5">{detail.triggered ? <AlertTriangle className="h-4 w-4 text-red-400" /> : <CheckCircle className="h-4 w-4 text-emerald-400" />}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white/70">{detail.category}</span>
                        <Badge className={cn("text-xs", detail.triggered ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20")}>{detail.triggered ? "⚠ Triggered" : "✓ Clear"}</Badge>
                      </div>
                      <p className="text-xs text-white/30 mt-0.5">{detail.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety tips */}
          {result.level !== "green" && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-5">
              <p className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Safety Tips</p>
              <ul className="space-y-1.5 text-sm text-amber-300/60">
                {["Never pay any fee or deposit to apply for a job", "Verify company on LinkedIn, MCA website, or Glassdoor", "Avoid sharing Aadhaar, PAN, or bank details upfront", "Be cautious of jobs that only contact via WhatsApp/Telegram", "Research the recruiter's email domain (not Gmail/Yahoo)"].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="text-amber-400 font-bold shrink-0">•</span>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <Button className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 border" onClick={() => { setResult(null); setForm({ title: "", company: "", salary: "", description: "" }) }}>Scan Another Job</Button>
        </div>
      )}
    </div>
  )
}