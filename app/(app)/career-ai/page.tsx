"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Send, Sparkles, RotateCcw, BookOpen, Briefcase, GraduationCap, TrendingUp, Code, FileText, ChevronRight, Loader2, User, Bot, StopCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ── Types ──
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

// ── Suggested prompts by category ──
const SUGGESTIONS = [
  { icon: Briefcase,    label: "Career Path",    text: "I'm a CSE student. What are the best career paths for me in 2025?" },
  { icon: Code,         label: "Skills to Learn", text: "What skills should I learn to become a full-stack developer?" },
  { icon: FileText,     label: "Resume Help",     text: "How do I write a strong resume with no work experience?" },
  { icon: GraduationCap,label: "Fresher Jobs",    text: "What are the best entry-level tech jobs for freshers in India?" },
  { icon: TrendingUp,   label: "Salary Guide",    text: "What is the average salary for a software engineer fresher in India?" },
  { icon: BookOpen,     label: "Interview Prep",  text: "How do I prepare for a technical interview at a product company?" },
]

// ── Format markdown-like text ──
function formatContent(text: string) {
  const lines = text.split("\n")
  return lines.map((line, i) => {
    if (line.startsWith("## ")) return <h3 key={i} className="text-base font-bold mt-3 mb-1 text-white">{line.slice(3)}</h3>
    if (line.startsWith("# "))  return <h2 key={i} className="text-lg font-bold mt-4 mb-2 text-white">{line.slice(2)}</h2>
    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-white/90 mt-2">{line.slice(2, -2)}</p>
    if (line.startsWith("- ") || line.startsWith("• ")) return (
      <div key={i} className="flex items-start gap-2 my-0.5">
        <span className="text-emerald-400 mt-1 shrink-0">▸</span>
        <span className="text-white/80">{line.slice(2)}</span>
      </div>
    )
    if (/^\d+\.\s/.test(line)) return (
      <div key={i} className="flex items-start gap-2 my-0.5">
        <span className="text-blue-400 font-bold shrink-0 min-w-[20px]">{line.match(/^\d+/)?.[0]}.</span>
        <span className="text-white/80">{line.replace(/^\d+\.\s/, "")}</span>
      </div>
    )
    if (line.trim() === "") return <div key={i} className="h-2" />
    // Bold inline
    const boldParts = line.split(/\*\*(.*?)\*\*/g)
    if (boldParts.length > 1) return (
      <p key={i} className="text-white/80 leading-relaxed">
        {boldParts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part)}
      </p>
    )
    return <p key={i} className="text-white/80 leading-relaxed">{line}</p>
  })
}

export default function CareerAIPage() {
  const { data: session } = useSession()
  const user = session?.user as any

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(text?: string) {
    const messageText = (text || input).trim()
    if (!messageText || loading) return

    setInput("")
    setLoading(true)
    setStreaming(true)

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    }

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])

    abortRef.current = new AbortController()

    try {
      const res = await fetch("/api/ai/career-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userName: user?.name,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed")
      }

      // Stream response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") break
              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta?.content || ""
                fullText += delta
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: fullText } : m
                ))
              } catch {}
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast.info("Response stopped")
      } else {
        toast.error(err.message || "Something went wrong")
        setMessages(prev => prev.filter(m => m.id !== assistantMsg.id))
      }
    } finally {
      setLoading(false)
      setStreaming(false)
      abortRef.current = null
    }
  }

  function stopStreaming() {
    abortRef.current?.abort()
  }

  function clearChat() {
    setMessages([])
    setInput("")
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-emerald-600/10 via-blue-600/5 to-transparent p-5 mb-4 shrink-0">
        <div className="absolute top-0 right-0 w-72 h-32 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">SkillLink AI</h1>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Career Assistant</Badge>
              </div>
              <p className="text-sm text-white/40">Ask me anything about your career, jobs, skills or interviews</p>
            </div>
          </div>
          {hasMessages && (
            <Button size="sm" variant="ghost" onClick={clearChat}
              className="text-white/30 hover:text-white gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> New Chat
            </Button>
          )}
        </div>
      </div>

      {/* ── CHAT AREA ── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">

        {/* Empty state with suggestions */}
        {!hasMessages && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Hi {user?.name?.split(" ")[0] || "there"}! 👋
              </h2>
              <p className="text-sm text-white/40 max-w-md mx-auto">
                I'm your personal career AI. Ask me about jobs, skills, resume tips, interview prep — anything career related!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.text)}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all text-left group">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    <s.icon className="h-4 w-4 text-white/40 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/50 group-hover:text-white/70">{s.label}</p>
                    <p className="text-xs text-white/30 truncate group-hover:text-white/50">{s.text}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-3",
              msg.role === "user"
                ? "bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-br-sm"
                : "bg-white/[0.04] border border-white/5 rounded-bl-sm"
            )}>
              {msg.role === "user" ? (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              ) : (
                <div className="text-sm space-y-0.5">
                  {msg.content ? formatContent(msg.content) : (
                    <div className="flex items-center gap-2 py-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
              )}
              <p className="text-[10px] text-white/20 mt-1.5 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {msg.role === "user" && (
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-1">
                <span className="text-sm font-bold text-white">{user?.name?.[0] || "U"}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT ── */}
      <div className="shrink-0 pt-3 border-t border-white/5">
        <div className="relative flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Ask about careers, skills, resume, interviews..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              rows={1}
              className="resize-none bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl pr-4 py-3 min-h-[48px] max-h-[120px] overflow-y-auto"
              style={{ height: "auto" }}
            />
          </div>
          {streaming ? (
            <Button onClick={stopStreaming} size="icon"
              className="rounded-2xl h-12 w-12 shrink-0 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30">
              <StopCircle className="h-5 w-5 text-red-400" />
            </Button>
          ) : (
            <Button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              size="icon" className="rounded-2xl h-12 w-12 shrink-0 bg-gradient-to-br from-emerald-500 to-blue-600 border-0 disabled:opacity-30">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          )}
        </div>
        <p className="text-center text-[10px] text-white/15 mt-2">
          SkillLink AI gives career guidance only · Not a substitute for professional advice
        </p>
      </div>
    </div>
  )
}