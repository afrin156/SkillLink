"use client"

import { useState, useEffect } from "react"
import useSWR, { mutate } from "swr"
import { FileText, Plus, Trash2, Download, Save, Star, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const emptyResume = {
  fullName: "", email: "", phone: "", summary: "",
  skills: [] as string[],
  experience: [] as { title: string; company: string; startDate: string; endDate: string; bullets: string[] }[],
  projects: [] as { name: string; description: string; technologies: string[]; bullets: string[] }[],
  education: [] as { institution: string; degree: string; year: string; gpa: string }[],
  certifications: [] as string[],
}

const sectionClass = "rounded-2xl border border-white/5 bg-white/[0.02] p-5"
const labelClass = "text-xs font-medium text-white/40 mb-1 block"
const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 focus:bg-white/8"
const itemBoxClass = "space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4"

export default function ResumeBuilderPage() {
  const { data: saved, isLoading } = useSWR("/api/resume", fetcher)
  const [resume, setResume] = useState(emptyResume)
  const [atsScore, setAtsScore] = useState(0)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState("")
  const [certInput, setCertInput] = useState("")

  useEffect(() => {
    if (saved?.resumeJSON) { setResume(saved.resumeJSON); setAtsScore(saved.atsScore || 0); setSuggestions(saved.suggestions || []) }
  }, [saved])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/resume", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resumeJSON: resume }) })
      const data = await res.json()
      if (!res.ok) throw new Error()
      setAtsScore(data.atsScore); setSuggestions(data.suggestions)
      toast.success(`Resume saved! ATS Score: ${data.atsScore}/100`)
      mutate("/api/resume")
    } catch { toast.error("Failed to save resume") }
    finally { setSaving(false) }
  }

  async function handleDownloadPDF() {
    try {
      const { pdf, Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer")
      const styles = StyleSheet.create({
        page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.5 },
        name: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
        contact: { fontSize: 9, color: "#555", marginBottom: 2 },
        section: { marginTop: 12, marginBottom: 4 },
        sectionTitle: { fontSize: 12, fontWeight: "bold", borderBottomWidth: 1, borderBottomColor: "#333", paddingBottom: 2, marginBottom: 6 },
        item: { marginBottom: 6 },
        itemTitle: { fontWeight: "bold", fontSize: 10 },
        itemSub: { fontSize: 9, color: "#555" },
        bullet: { marginLeft: 10, fontSize: 9, marginTop: 1 },
      })
      const MyDoc = (
        <Document>
          <Page size="A4" style={styles.page}>
            <View><Text style={styles.name}>{resume.fullName || "Your Name"}</Text><Text style={styles.contact}>{[resume.email, resume.phone].filter(Boolean).join(" | ")}</Text></View>
            {resume.summary && <View style={styles.section}><Text style={styles.sectionTitle}>Professional Summary</Text><Text>{resume.summary}</Text></View>}
            {resume.skills.length > 0 && <View style={styles.section}><Text style={styles.sectionTitle}>Skills</Text><Text>{resume.skills.join("  |  ")}</Text></View>}
            {resume.experience.length > 0 && <View style={styles.section}><Text style={styles.sectionTitle}>Experience</Text>{resume.experience.map((exp, i) => <View key={i} style={styles.item}><Text style={styles.itemTitle}>{exp.title} - {exp.company}</Text><Text style={styles.itemSub}>{exp.startDate} - {exp.endDate}</Text>{exp.bullets.map((b, j) => <Text key={j} style={styles.bullet}>{"- "}{b}</Text>)}</View>)}</View>}
            {resume.projects.length > 0 && <View style={styles.section}><Text style={styles.sectionTitle}>Projects</Text>{resume.projects.map((proj, i) => <View key={i} style={styles.item}><Text style={styles.itemTitle}>{proj.name}</Text><Text style={styles.itemSub}>{proj.technologies.join(", ")}</Text><Text>{proj.description}</Text>{proj.bullets.map((b, j) => <Text key={j} style={styles.bullet}>{"- "}{b}</Text>)}</View>)}</View>}
            {resume.education.length > 0 && <View style={styles.section}><Text style={styles.sectionTitle}>Education</Text>{resume.education.map((edu, i) => <View key={i} style={styles.item}><Text style={styles.itemTitle}>{edu.degree}</Text><Text style={styles.itemSub}>{edu.institution} - {edu.year}{edu.gpa ? ` | GPA: ${edu.gpa}` : ""}</Text></View>)}</View>}
            {resume.certifications.length > 0 && <View style={styles.section}><Text style={styles.sectionTitle}>Certifications</Text>{resume.certifications.map((cert, i) => <Text key={i} style={styles.bullet}>{"- "}{cert}</Text>)}</View>}
          </Page>
        </Document>
      )
      const blob = await pdf(MyDoc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = `${resume.fullName || "resume"}_resume.pdf`; a.click(); URL.revokeObjectURL(url)
      toast.success("PDF downloaded!")
    } catch { toast.error("Failed to generate PDF") }
  }

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-64 bg-white/5" /><Skeleton className="h-[600px] w-full bg-white/5" /></div>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-blue-600/10 via-violet-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1"><FileText className="h-4 w-4 text-blue-400" /><span className="text-xs text-blue-400 font-medium">ATS Optimized</span></div>
            <h1 className="text-2xl font-bold text-white">Resume Builder</h1>
            <p className="text-sm text-white/40 mt-1">Build an ATS-optimized resume with real scoring</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} className="gap-1.5 border-white/10 bg-white/5 text-white hover:bg-white/10 border">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5 bg-gradient-to-r from-blue-600 to-violet-600 border-0 shadow-lg shadow-blue-500/20">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save & Score"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Editor */}
        <div className="space-y-4 lg:col-span-2">
          {/* Personal Info */}
          <div className={sectionClass}>
            <h2 className="text-base font-semibold text-white mb-4">Personal Information</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className={labelClass}>Full Name</label><Input className={inputClass} value={resume.fullName} onChange={(e) => setResume({ ...resume, fullName: e.target.value })} placeholder="John Doe" /></div>
              <div><label className={labelClass}>Email</label><Input className={inputClass} type="email" value={resume.email} onChange={(e) => setResume({ ...resume, email: e.target.value })} placeholder="john@example.com" /></div>
            </div>
            <div className="mt-3"><label className={labelClass}>Phone</label><Input className={inputClass} value={resume.phone} onChange={(e) => setResume({ ...resume, phone: e.target.value })} placeholder="+91 98765 43210" /></div>
          </div>

          {/* Summary */}
          <div className={sectionClass}>
            <h2 className="text-base font-semibold text-white mb-4">Professional Summary</h2>
            <Textarea className={inputClass} rows={3} value={resume.summary} onChange={(e) => setResume({ ...resume, summary: e.target.value })} placeholder="A motivated software developer with experience in..." />
          </div>

          {/* Skills */}
          <div className={sectionClass}>
            <h2 className="text-base font-semibold text-white mb-4">Skills</h2>
            <div className="flex gap-2">
              <Input className={inputClass} placeholder="Add a skill..." value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && skillInput.trim()) { e.preventDefault(); setResume({ ...resume, skills: [...resume.skills, skillInput.trim()] }); setSkillInput("") } }} />
              <Button className="bg-white/8 border-white/10 text-white hover:bg-white/15 border" onClick={() => { if (skillInput.trim()) { setResume({ ...resume, skills: [...resume.skills, skillInput.trim()] }); setSkillInput("") } }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {resume.skills.map((skill, i) => (
                <Badge key={i} className="gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {skill}<button onClick={() => setResume({ ...resume, skills: resume.skills.filter((_, j) => j !== i) })}><Trash2 className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Experience</h2>
              <Button size="sm" className="gap-1 bg-white/5 border-white/10 text-white hover:bg-white/10 border" onClick={() => setResume({ ...resume, experience: [...resume.experience, { title: "", company: "", startDate: "", endDate: "", bullets: [""] }] })}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-4">
              {resume.experience.map((exp, i) => (
                <div key={i} className={itemBoxClass}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/40">Experience {i + 1}</span>
                    <Button size="sm" variant="ghost" className="text-white/20 hover:text-red-400" onClick={() => setResume({ ...resume, experience: resume.experience.filter((_, j) => j !== i) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input className={inputClass} placeholder="Job Title" value={exp.title} onChange={(e) => { const n = [...resume.experience]; n[i] = { ...n[i], title: e.target.value }; setResume({ ...resume, experience: n }) }} />
                    <Input className={inputClass} placeholder="Company" value={exp.company} onChange={(e) => { const n = [...resume.experience]; n[i] = { ...n[i], company: e.target.value }; setResume({ ...resume, experience: n }) }} />
                    <Input className={inputClass} placeholder="Start Date" value={exp.startDate} onChange={(e) => { const n = [...resume.experience]; n[i] = { ...n[i], startDate: e.target.value }; setResume({ ...resume, experience: n }) }} />
                    <Input className={inputClass} placeholder="End Date" value={exp.endDate} onChange={(e) => { const n = [...resume.experience]; n[i] = { ...n[i], endDate: e.target.value }; setResume({ ...resume, experience: n }) }} />
                  </div>
                  {exp.bullets.map((b, j) => (
                    <div key={j} className="flex gap-2">
                      <Input className={inputClass} placeholder="Bullet point (start with action verb)" value={b} onChange={(e) => { const n = [...resume.experience]; n[i] = { ...n[i], bullets: n[i].bullets.map((bb, jj) => jj === j ? e.target.value : bb) }; setResume({ ...resume, experience: n }) }} />
                      <Button size="sm" variant="ghost" className="text-white/20 hover:text-red-400" onClick={() => { const n = [...resume.experience]; n[i] = { ...n[i], bullets: n[i].bullets.filter((_, jj) => jj !== j) }; setResume({ ...resume, experience: n }) }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <button className="text-xs text-blue-400 hover:text-blue-300" onClick={() => { const n = [...resume.experience]; n[i] = { ...n[i], bullets: [...n[i].bullets, ""] }; setResume({ ...resume, experience: n }) }}>+ Add bullet</button>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Projects</h2>
              <Button size="sm" className="gap-1 bg-white/5 border-white/10 text-white hover:bg-white/10 border" onClick={() => setResume({ ...resume, projects: [...resume.projects, { name: "", description: "", technologies: [], bullets: [""] }] })}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-4">
              {resume.projects.map((proj, i) => (
                <div key={i} className={itemBoxClass}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/40">Project {i + 1}</span>
                    <Button size="sm" variant="ghost" className="text-white/20 hover:text-red-400" onClick={() => setResume({ ...resume, projects: resume.projects.filter((_, j) => j !== i) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <Input className={inputClass} placeholder="Project Name" value={proj.name} onChange={(e) => { const n = [...resume.projects]; n[i] = { ...n[i], name: e.target.value }; setResume({ ...resume, projects: n }) }} />
                  <Textarea className={inputClass} placeholder="Description" rows={2} value={proj.description} onChange={(e) => { const n = [...resume.projects]; n[i] = { ...n[i], description: e.target.value }; setResume({ ...resume, projects: n }) }} />
                  <Input className={inputClass} placeholder="Technologies (comma-separated)" value={proj.technologies.join(", ")} onChange={(e) => { const n = [...resume.projects]; n[i] = { ...n[i], technologies: e.target.value.split(",").map(s => s.trim()) }; setResume({ ...resume, projects: n }) }} />
                  {proj.bullets.map((b, j) => (
                    <Input key={j} className={inputClass} placeholder="Bullet point" value={b} onChange={(e) => { const n = [...resume.projects]; n[i] = { ...n[i], bullets: n[i].bullets.map((bb, jj) => jj === j ? e.target.value : bb) }; setResume({ ...resume, projects: n }) }} />
                  ))}
                  <button className="text-xs text-blue-400 hover:text-blue-300" onClick={() => { const n = [...resume.projects]; n[i] = { ...n[i], bullets: [...n[i].bullets, ""] }; setResume({ ...resume, projects: n }) }}>+ Add bullet</button>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Education</h2>
              <Button size="sm" className="gap-1 bg-white/5 border-white/10 text-white hover:bg-white/10 border" onClick={() => setResume({ ...resume, education: [...resume.education, { institution: "", degree: "", year: "", gpa: "" }] })}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-4">
              {resume.education.map((edu, i) => (
                <div key={i} className={itemBoxClass}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/40">Education {i + 1}</span>
                    <Button size="sm" variant="ghost" className="text-white/20 hover:text-red-400" onClick={() => setResume({ ...resume, education: resume.education.filter((_, j) => j !== i) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input className={inputClass} placeholder="Institution" value={edu.institution} onChange={(e) => { const n = [...resume.education]; n[i] = { ...n[i], institution: e.target.value }; setResume({ ...resume, education: n }) }} />
                    <Input className={inputClass} placeholder="Degree" value={edu.degree} onChange={(e) => { const n = [...resume.education]; n[i] = { ...n[i], degree: e.target.value }; setResume({ ...resume, education: n }) }} />
                    <Input className={inputClass} placeholder="Year" value={edu.year} onChange={(e) => { const n = [...resume.education]; n[i] = { ...n[i], year: e.target.value }; setResume({ ...resume, education: n }) }} />
                    <Input className={inputClass} placeholder="GPA (optional)" value={edu.gpa} onChange={(e) => { const n = [...resume.education]; n[i] = { ...n[i], gpa: e.target.value }; setResume({ ...resume, education: n }) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className={sectionClass}>
            <h2 className="text-base font-semibold text-white mb-4">Certifications</h2>
            <div className="flex gap-2">
              <Input className={inputClass} placeholder="Add a certification..." value={certInput} onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && certInput.trim()) { e.preventDefault(); setResume({ ...resume, certifications: [...resume.certifications, certInput.trim()] }); setCertInput("") } }} />
              <Button className="bg-white/8 border-white/10 text-white hover:bg-white/15 border" onClick={() => { if (certInput.trim()) { setResume({ ...resume, certifications: [...resume.certifications, certInput.trim()] }); setCertInput("") } }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 mt-3">
              {resume.certifications.map((cert, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <span className="text-sm text-white/70">{cert}</span>
                  <Button size="sm" variant="ghost" className="text-white/20 hover:text-red-400" onClick={() => setResume({ ...resume, certifications: resume.certifications.filter((_, j) => j !== i) })}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ATS Score Panel */}
        <div>
          <div className="sticky top-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Star className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">ATS Score</h3>
                <p className="text-xs text-white/30">Resume performance</p>
              </div>
            </div>

            <div className="text-center py-2">
              <span className="text-5xl font-bold text-white">{atsScore}</span>
              <span className="text-2xl text-white/30">/100</span>
            </div>

            <Progress value={atsScore} className="h-2.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-violet-500" />

            <div className="text-center">
              {atsScore >= 80 ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Excellent</Badge>
              ) : atsScore >= 60 ? (
                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">Good</Badge>
              ) : (
                <Badge className="bg-red-500/10 text-red-400 border border-red-500/20">Needs Improvement</Badge>
              )}
            </div>

            {suggestions.length > 0 && (
              <>
                <Separator className="bg-white/5" />
                <div>
                  <h4 className="mb-2 text-xs font-semibold text-white/50 uppercase tracking-wide">Suggestions</h4>
                  <div className="space-y-2">
                    {suggestions.map((s, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                        <span className="text-white/40">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator className="bg-white/5" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">ATS Tips</p>
              {["Use single-column format", "Start bullets with action verbs", "Include measurable impact (numbers)", "Add relevant keywords/skills"].map(tip => (
                <div key={tip} className="flex gap-2 text-xs text-white/30">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}