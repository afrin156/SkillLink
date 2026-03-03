"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Timer, CheckCircle, XCircle, ChevronRight, RotateCcw, Trophy, BookOpen, Filter, Target, AlertCircle, Brain, Users, Calculator, ChevronDown, ChevronUp, Star, Code, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MCQuestion { id: string; domain: string; topic: string; difficulty: "easy" | "medium" | "hard"; question: string; options: string[]; correctIndex: number; explanation: string; timeLimit: number }
interface TestResult { score: number; correct: number; wrong: number; total: number; results: { questionId: string; question: string; selected: number; correctIndex: number; isCorrect: boolean; explanation: string }[] }

const DIFFICULTY_COLORS = { easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", medium: "bg-amber-500/10 text-amber-400 border-amber-500/20", hard: "bg-red-500/10 text-red-400 border-red-500/20" }
const DOMAINS = ["all", "Java", "Python", "DSA", "DBMS", "OS", "Networks", "Aptitude", "Cloud"]

const TECHNICAL_QA = [
  { category: "OOP Concepts", icon: "🧱", questions: [{ q: "What are the 4 pillars of OOP?", a: "Encapsulation (hiding data), Abstraction (hiding complexity), Inheritance (reusing code from parent class), and Polymorphism (same method behaving differently)." }, { q: "What is the difference between abstract class and interface?", a: "Abstract class can have method implementations and constructors; interface only has method signatures. A class can implement multiple interfaces but extend only one abstract class." }, { q: "What is method overloading vs overriding?", a: "Overloading: same method name, different parameters (compile-time). Overriding: subclass redefines parent's method with same signature (runtime polymorphism)." }] },
  { category: "Data Structures", icon: "📊", questions: [{ q: "What is the difference between Stack and Queue?", a: "Stack is LIFO (Last In First Out) — like a pile of plates. Queue is FIFO (First In First Out) — like a line of people. Stack uses push/pop, Queue uses enqueue/dequeue." }, { q: "When would you use a HashMap vs ArrayList?", a: "Use HashMap when you need key-value pairs and fast O(1) lookup by key. Use ArrayList when you need ordered elements and access by index." }, { q: "What is a Binary Search Tree?", a: "A BST is a tree where left child < parent < right child. Search, insert, delete are O(log n) average case. In-order traversal gives sorted output." }] },
  { category: "Databases", icon: "🗄️", questions: [{ q: "What is the difference between SQL and NoSQL?", a: "SQL databases are relational with fixed schema (MySQL, PostgreSQL). NoSQL are non-relational, flexible schema (MongoDB, Redis). SQL is great for complex queries; NoSQL for scalability." }, { q: "What are ACID properties?", a: "Atomicity (all or nothing), Consistency (data stays valid), Isolation (transactions don't interfere), Durability (committed data persists)." }, { q: "What is indexing and why is it important?", a: "An index speeds up data retrieval. Without index, DB scans all rows O(n). With index, lookup is O(log n). Trade-off: faster reads but slower writes." }] },
  { category: "System Design", icon: "🏗️", questions: [{ q: "How would you design a URL shortener?", a: "Use a hash function to generate 6-7 char short code → store mapping in DB → on redirect, lookup original URL → use Redis cache for popular URLs → load balancer for scale." }, { q: "What is the difference between horizontal and vertical scaling?", a: "Vertical scaling = adding more power to existing server. Horizontal scaling = adding more servers. Horizontal is preferred for large scale as it has no single point of failure." }] },
  { category: "JavaScript / React", icon: "⚛️", questions: [{ q: "What is the difference between let, const, and var?", a: "var is function-scoped and hoisted. let is block-scoped, not hoisted. const is block-scoped and cannot be reassigned. Always prefer const/let over var." }, { q: "What is useEffect and when do you use it?", a: "useEffect runs side effects after render. Use it for: API calls, subscriptions, DOM manipulation. Empty dependency [] = runs once on mount." }, { q: "What is the virtual DOM?", a: "React keeps a lightweight copy of the real DOM in memory. When state changes, React diffs old vs new virtual DOM, then updates only the changed parts — making updates fast." }] },
]

const APTITUDE_TOPICS = [
  { title: "Quantitative Aptitude", icon: "🔢", topics: [{ name: "Percentages", formula: "Percentage = (Part/Whole) × 100", example: "20 out of 80 = 25%" }, { name: "Profit & Loss", formula: "Profit% = (Profit/CP) × 100", example: "CP=100, SP=120 → Profit=20%" }, { name: "Time & Work", formula: "If A does in n days → 1 day work = 1/n", example: "A=10 days, B=15 days → Together = 6 days" }, { name: "Time, Speed & Distance", formula: "Speed = Distance/Time", example: "360km in 4hrs = 90km/h = 25m/s" }, { name: "Simple Interest", formula: "SI = (P × R × T) / 100", example: "P=1000, R=10%, T=2yr → SI=200" }, { name: "Compound Interest", formula: "CI = P(1 + R/100)^T - P", example: "P=1000, R=10%, T=2 → CI=210" }] },
  { title: "Logical Reasoning", icon: "🧩", topics: [{ name: "Number Series", formula: "Find the pattern — differences, ratios, squares", example: "2, 6, 12, 20, 30 → diff: 4,6,8,10 → next: 42" }, { name: "Coding-Decoding", formula: "Each letter shifted by fixed number", example: "CAT → ECV (shift +2)" }, { name: "Blood Relations", formula: "Map family tree carefully", example: "Father's brother = Uncle; Uncle's son = Cousin" }, { name: "Syllogisms", formula: "All A=B, All B=C → All A=C (valid)", example: "All dogs are animals → Some animals are dogs ✓" }] },
  { title: "Verbal Ability", icon: "📝", topics: [{ name: "Synonyms/Antonyms", formula: "Learn root words: bene(good), mal(bad), ambi(both)", example: "Eloquent = Fluent, Articulate" }, { name: "Reading Comprehension", formula: "Read question first, then passage", example: "Find main idea → supporting details → author's tone" }, { name: "Sentence Correction", formula: "Check: subject-verb agreement, tense consistency", example: "He go → He goes (3rd person singular)" }] },
]

const PERSONAL_INTERVIEW = [
  { category: "Most Asked HR Questions", icon: "👤", questions: [
    { q: "Tell me about yourself", tip: "Structure: Present → Past → Future", answer: "Start with your current status, then education and key skills, then what you're looking for. Keep it under 2 minutes. Don't just read your resume.", example: "I'm a final year Computer Science student. I have strong skills in React and Node.js, and have built 3 projects. I'm looking for a role where I can contribute to real products while growing as a developer." },
    { q: "What are your strengths?", tip: "Give 2-3 strengths with examples", answer: "Pick strengths relevant to the job. Always back them up with a real example.", example: "My biggest strength is problem-solving. During my project, our payment integration kept failing. I debugged it systematically and found a race condition — fixed it in 2 hours." },
    { q: "What are your weaknesses?", tip: "Be honest but show self-awareness + improvement", answer: "Pick a real weakness but one you're actively improving. Never say 'I'm a perfectionist'.", example: "I used to struggle with public speaking. I joined my college's debate club 6 months ago and it's helped significantly." },
    { q: "Why should we hire you?", tip: "Summarise your unique value proposition", answer: "Combine your skills + enthusiasm + quick learning. Be specific about what value you bring.", example: "I bring strong full-stack skills, a portfolio of real projects, and genuine passion for building products. I learn fast — I picked up TypeScript in 2 weeks for my last project." },
  ]},
]

const INTERVIEW_TIPS = [
  { phase: "Before the Interview", icon: "📋", border: "border-blue-500/20", bg: "bg-blue-500/8", text: "text-blue-400", tips: ["Research the company — know their products, recent news, mission statement", "Review your resume — be ready to explain every project and skill on it", "Practice coding problems on LeetCode for at least 30 mins daily", "Prepare 3-4 questions to ask the interviewer", "Do a mock interview with a friend or use a mirror", "Sleep well the night before — tiredness shows in interviews"] },
  { phase: "During the Interview", icon: "🎯", border: "border-emerald-500/20", bg: "bg-emerald-500/8", text: "text-emerald-400", tips: ["Think out loud during coding — explain your thought process", "If you don't know something, say 'I'm not sure but I think...'", "Ask clarifying questions before solving coding problems", "Write clean code with proper variable names", "Maintain eye contact and smile — body language matters", "If stuck on a problem, explain your approach and ask for hints"] },
  { phase: "Common Mistakes to Avoid", icon: "⚠️", border: "border-red-500/20", bg: "bg-red-500/8", text: "text-red-400", tips: ["Don't bad-mouth previous internship/college/professors", "Don't lie about skills you don't have — you'll be caught", "Don't use your phone or check the time during interview", "Don't memorise answers — understand and adapt them", "Don't forget to negotiate salary — it's expected and normal"] },
  { phase: "Salary Negotiation Tips", icon: "💰", border: "border-amber-500/20", bg: "bg-amber-500/8", text: "text-amber-400", tips: ["Research market rates on Glassdoor, LinkedIn, AmbitionBox", "Never give a number first — ask 'What is the budgeted range?'", "Negotiate the entire package: salary + bonus + benefits", "Use competing offers as leverage if you have them", "Be polite but firm — 'I was hoping for X based on my research'"] },
]

type Screen = "setup" | "quiz" | "result"

function TechnicalQACard({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/5 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-white/3 transition-colors">
        <span className="text-sm font-medium pr-2 text-white/80">{question}</span>
        {open ? <ChevronUp className="h-4 w-4 text-white/30 shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/30 shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 bg-blue-500/5 border-t border-white/5"><p className="text-sm text-white/50 leading-relaxed">{answer}</p></div>}
    </div>
  )
}

function HRQuestionCard({ item }: { item: any }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/5 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 flex items-start justify-between hover:bg-white/3 transition-colors gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80">{item.q}</p>
          <Badge className="text-xs mt-1 bg-blue-500/10 text-blue-400 border border-blue-500/20">💡 {item.tip}</Badge>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-white/30 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-white/30 shrink-0 mt-1" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 bg-white/2 border-t border-white/5">
          <div><p className="text-xs font-semibold text-white/30 uppercase mb-1">How to Answer</p><p className="text-sm text-white/50 leading-relaxed">{item.answer}</p></div>
          <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3"><p className="text-xs font-semibold text-emerald-400 mb-1">✅ Sample Answer</p><p className="text-sm text-emerald-300/70 italic">"{item.example}"</p></div>
        </div>
      )}
    </div>
  )
}

export default function InterviewPrepPage() {
  const [activeTab, setActiveTab] = useState("test")
  const [screen, setScreen] = useState<Screen>("setup")
  const [domain, setDomain] = useState("all"); const [difficulty, setDifficulty] = useState("all"); const [questionCount, setQuestionCount] = useState(10)
  const [questions, setQuestions] = useState<MCQuestion[]>([]); const [currentIndex, setCurrentIndex] = useState(0); const [answers, setAnswers] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<number | null>(null); const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0); const [totalTime, setTotalTime] = useState(0); const [timeTaken, setTimeTaken] = useState(0)
  const [result, setResult] = useState<TestResult | null>(null); const [loading, setLoading] = useState(false); const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined); const startTimeRef = useRef<number>(0)
  const currentQuestion = questions[currentIndex]

  const startQuiz = async () => {
    setLoading(true)
    try { const res = await fetch(`/api/interview-prep/mcq?domain=${domain}&difficulty=${difficulty}&limit=${questionCount}`); if (res.ok) { const data = await res.json(); if (!data.questions?.length) { toast.error("No questions found"); return }; setQuestions(data.questions); setCurrentIndex(0); setAnswers({}); setSelected(null); setShowExplanation(false); const firstLimit = data.questions[0]?.timeLimit || 30; setTimeLeft(firstLimit); setTotalTime(firstLimit); startTimeRef.current = Date.now(); setScreen("quiz") } } catch { toast.error("Failed to load questions") } finally { setLoading(false) }
  }

  useEffect(() => {
    if (screen !== "quiz" || showExplanation) return
    timerRef.current = setInterval(() => { setTimeLeft(prev => { if (prev <= 1) { clearInterval(timerRef.current); handleNext(true); return 0 }; return prev - 1 }) }, 1000)
    return () => clearInterval(timerRef.current)
  }, [screen, currentIndex, showExplanation])

  const handleSelect = (optionIndex: number) => { if (selected !== null) return; clearInterval(timerRef.current); setSelected(optionIndex); setShowExplanation(true); setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex })) }

  const handleNext = useCallback((timeout = false) => {
    clearInterval(timerRef.current)
    if (timeout && selected === null) { setAnswers(prev => ({ ...prev, [currentQuestion?.id]: -1 })) }
    if (currentIndex >= questions.length - 1) { submitTest(); return }
    const next = questions[currentIndex + 1]; setCurrentIndex(i => i + 1); setSelected(null); setShowExplanation(false); setTimeLeft(next?.timeLimit || 30); setTotalTime(next?.timeLimit || 30)
  }, [currentIndex, questions, selected, currentQuestion])

  const submitTest = async () => {
    setSubmitting(true); const taken = Math.round((Date.now() - startTimeRef.current) / 1000); setTimeTaken(taken)
    try { const res = await fetch("/api/interview-prep/mcq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, domain, difficulty, timeTaken: taken }) }); if (res.ok) { const data = await res.json(); setResult(data); setScreen("result") } } catch { toast.error("Failed to submit") } finally { setSubmitting(false) }
  }

  const resetQuiz = () => { setScreen("setup"); setQuestions([]); setAnswers({}); setSelected(null); setResult(null); setCurrentIndex(0) }
  const timerPercent = (timeLeft / totalTime) * 100

  const selectClass = "bg-white/5 border-white/10 text-white [&>span]:text-white"

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-violet-600/10 via-blue-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex items-center gap-2 mb-1"><Brain className="h-4 w-4 text-violet-400" /><span className="text-xs text-violet-400 font-medium">Interview Prep</span></div>
        <h1 className="text-2xl font-bold text-white">Interview Preparation</h1>
        <p className="text-sm text-white/40 mt-1">Everything you need to crack your next interview</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full bg-white/5 border border-white/5">
          <TabsTrigger value="test" className="gap-1.5 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40"><Brain className="h-3.5 w-3.5" /> MCQ Tests</TabsTrigger>
          <TabsTrigger value="technical" className="gap-1.5 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40"><Code className="h-3.5 w-3.5" /> Technical</TabsTrigger>
          <TabsTrigger value="aptitude" className="gap-1.5 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40"><Calculator className="h-3.5 w-3.5" /> Aptitude</TabsTrigger>
          <TabsTrigger value="personal" className="gap-1.5 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40"><Users className="h-3.5 w-3.5" /> HR Round</TabsTrigger>
        </TabsList>

        {/* MCQ Tests */}
        <TabsContent value="test" className="mt-4">
          {screen === "setup" && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="grid grid-cols-3 gap-3">
                {[{ label: "Questions", value: "20+", icon: BookOpen, gradient: "from-blue-500 to-blue-700" }, { label: "Domains", value: "8", icon: Target, gradient: "from-violet-500 to-violet-700" }, { label: "Timed", value: "✓", icon: Timer, gradient: "from-cyan-500 to-cyan-700" }].map(s => (
                  <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} mx-auto mb-2 shadow-md`}><s.icon className="h-5 w-5 text-white" /></div>
                    <p className="text-xl font-bold text-white">{s.value}</p><p className="text-xs text-white/30">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2"><Filter className="h-4 w-4 text-blue-400" /> Configure Your Test</h2>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block">Domain</label>
                  <Select value={domain} onValueChange={setDomain}><SelectTrigger className={selectClass}><SelectValue /></SelectTrigger><SelectContent className="bg-[#0d1117] border-white/10 text-white">{DOMAINS.map(d => <SelectItem key={d} value={d} className="text-white hover:bg-white/5">{d === "all" ? "All Domains" : d}</SelectItem>)}</SelectContent></Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block">Difficulty</label>
                  <Select value={difficulty} onValueChange={setDifficulty}><SelectTrigger className={selectClass}><SelectValue /></SelectTrigger><SelectContent className="bg-[#0d1117] border-white/10 text-white"><SelectItem value="all" className="text-white hover:bg-white/5">All Difficulties</SelectItem><SelectItem value="easy" className="text-white hover:bg-white/5">Easy</SelectItem><SelectItem value="medium" className="text-white hover:bg-white/5">Medium</SelectItem><SelectItem value="hard" className="text-white hover:bg-white/5">Hard</SelectItem></SelectContent></Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 mb-2 block">Number of Questions</label>
                  <div className="flex gap-2">{[5, 10, 15, 20].map(n => (<button key={n} onClick={() => setQuestionCount(n)} className={cn("flex-1 py-2 rounded-xl border text-sm font-medium transition-all", questionCount === n ? "bg-blue-600 text-white border-blue-600" : "border-white/10 text-white/30 hover:border-blue-500/50 hover:text-blue-400")}>{n}</button>))}</div>
                </div>
                <Button className="w-full gap-2 bg-gradient-to-r from-blue-600 to-violet-600 border-0" onClick={startQuiz} disabled={loading}>{loading ? "Loading..." : "Start Test"} <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {screen === "quiz" && currentQuestion && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-white/40">Question {currentIndex + 1} of {questions.length}</p><Progress value={((currentIndex) / questions.length) * 100} className="h-1.5 w-48 mt-1 bg-white/10 [&>div]:bg-blue-500" /></div>
                <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full border font-mono font-bold text-sm", timeLeft <= 10 ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-white/5 border-white/10 text-white")}><Timer className="h-4 w-4" /> {timeLeft}s</div>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden"><div className={cn("h-full rounded-full transition-all", timerPercent > 50 ? "bg-emerald-500" : timerPercent > 25 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${timerPercent}%` }} /></div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <div className="flex items-center gap-2 mb-4 flex-wrap"><Badge className="bg-white/8 text-white/50 border-0">{currentQuestion.domain}</Badge><Badge className="bg-white/8 text-white/50 border-0">{currentQuestion.topic}</Badge><Badge className={cn("text-xs border", DIFFICULTY_COLORS[currentQuestion.difficulty])}>{currentQuestion.difficulty}</Badge></div>
                <p className="text-base font-medium mb-6 leading-relaxed text-white/90">{currentQuestion.question}</p>
                <div className="space-y-2.5">
                  {currentQuestion.options.map((option, i) => {
                    const isSelected = selected === i; const isCorrect = i === currentQuestion.correctIndex
                    return (
                      <button key={i} onClick={() => handleSelect(i)} disabled={showExplanation}
                        className={cn("w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                          !showExplanation && "border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 text-white/70",
                          showExplanation && isCorrect && "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-medium",
                          showExplanation && isSelected && !isCorrect && "bg-red-500/10 border-red-500/30 text-red-300",
                          isSelected && !showExplanation && "border-blue-500/50 bg-blue-500/10 text-blue-300")}>
                        <div className="flex items-center gap-3">
                          <span className={cn("h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0",
                            showExplanation && isCorrect && "bg-emerald-500 border-emerald-500 text-white",
                            showExplanation && isSelected && !isCorrect && "bg-red-500 border-red-500 text-white",
                            !showExplanation && "border-white/20 text-white/40")}>
                            {showExplanation && isCorrect ? "✓" : showExplanation && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + i)}
                          </span>
                          {option}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {showExplanation && <div className="mt-4 p-4 rounded-xl bg-blue-500/8 border border-blue-500/20"><p className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Explanation</p><p className="text-sm text-blue-300/70">{currentQuestion.explanation}</p></div>}
              </div>
              {showExplanation && <Button className="w-full gap-2 bg-gradient-to-r from-blue-600 to-violet-600 border-0" onClick={() => handleNext()} disabled={submitting}>{submitting ? "Submitting..." : currentIndex >= questions.length - 1 ? "See Results" : "Next Question"}<ChevronRight className="h-4 w-4" /></Button>}
            </div>
          )}

          {screen === "result" && result && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className={cn("rounded-2xl border-2 p-6 text-center", result.score >= 80 ? "border-emerald-500/30 bg-emerald-500/8" : result.score >= 60 ? "border-amber-500/30 bg-amber-500/8" : "border-red-500/30 bg-red-500/8")}>
                <Trophy className={cn("h-12 w-12 mx-auto mb-3", result.score >= 80 ? "text-emerald-400" : result.score >= 60 ? "text-amber-400" : "text-red-400")} />
                <p className={cn("text-5xl font-bold mb-1", result.score >= 80 ? "text-emerald-400" : result.score >= 60 ? "text-amber-400" : "text-red-400")}>{result.score}%</p>
                <p className="text-white/40 text-sm">{result.score >= 80 ? "Excellent! You're interview ready 🎉" : result.score >= 60 ? "Good effort! Keep practicing 💪" : "Keep going! Review the explanations 📚"}</p>
                <div className="flex justify-center gap-6 mt-4">
                  <div><p className="text-2xl font-bold text-emerald-400">{result.correct}</p><p className="text-xs text-white/30">Correct</p></div>
                  <div><p className="text-2xl font-bold text-red-400">{result.wrong}</p><p className="text-xs text-white/30">Wrong</p></div>
                  <div><p className="text-2xl font-bold text-white">{result.total}</p><p className="text-xs text-white/30">Total</p></div>
                  <div><p className="text-2xl font-bold text-white">{Math.floor(timeTaken / 60)}m {timeTaken % 60}s</p><p className="text-xs text-white/30">Time</p></div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
                <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wide">Question Review</h3>
                {result.results.map((r, i) => (
                  <div key={r.questionId} className={cn("rounded-xl border p-3", r.isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")}>
                    <div className="flex items-start gap-2">
                      <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5", r.isCorrect ? "bg-emerald-500" : "bg-red-500")}>
                        {r.isCorrect ? <CheckCircle className="h-3.5 w-3.5 text-white" /> : <XCircle className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-1 text-white/80">Q{i + 1}: {r.question}</p>
                        {!r.isCorrect && r.selected !== -1 && <p className="text-xs text-red-400">Your answer: {questions.find(q => q.id === r.questionId)?.options[r.selected]}</p>}
                        {!r.isCorrect && r.selected === -1 && <p className="text-xs text-amber-400">Timed out</p>}
                        <p className="text-xs text-emerald-400 font-medium mt-0.5">Correct: {questions.find(q => q.id === r.questionId)?.options[r.correctIndex]}</p>
                        <p className="text-xs text-white/25 mt-1 italic">💡 {r.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full gap-2 bg-gradient-to-r from-blue-600 to-violet-600 border-0" onClick={resetQuiz}><RotateCcw className="h-4 w-4" /> Try Another Test</Button>
            </div>
          )}
        </TabsContent>

        {/* Technical */}
        <TabsContent value="technical" className="mt-4 space-y-4">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 p-3 text-sm text-blue-300 flex items-start gap-2"><span className="text-lg">💡</span><span>Most commonly asked technical questions in campus placements. Click to expand each answer.</span></div>
          {TECHNICAL_QA.map(section => (
            <div key={section.category} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4"><span className="text-xl">{section.icon}</span> {section.category}</h2>
              <div className="space-y-3">{section.questions.map((item, i) => <TechnicalQACard key={i} question={item.q} answer={item.a} />)}</div>
            </div>
          ))}
        </TabsContent>

        {/* Aptitude */}
        <TabsContent value="aptitude" className="mt-4 space-y-4">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3 text-sm text-amber-300 flex items-start gap-2"><span className="text-lg">🎯</span><span>Aptitude tests are the first round at TCS, Infosys, Wipro, Accenture. Master these formulas!</span></div>
          {APTITUDE_TOPICS.map(section => (
            <div key={section.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4"><span className="text-xl">{section.icon}</span> {section.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.topics.map((topic, i) => (
                  <div key={i} className="rounded-xl border border-white/5 bg-white/3 p-3 space-y-1.5">
                    <p className="font-semibold text-sm text-white/80">{topic.name}</p>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-2.5 py-1.5"><p className="text-xs font-mono text-blue-400">{topic.formula}</p></div>
                    <p className="text-xs text-white/30">📌 {topic.example}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* HR Round */}
        <TabsContent value="personal" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTERVIEW_TIPS.map(section => (
              <div key={section.phase} className={cn("rounded-2xl border p-5", section.border, section.bg)}>
                <h3 className={cn("text-sm font-semibold flex items-center gap-2 mb-4", section.text)}><span className="text-xl">{section.icon}</span> {section.phase}</h3>
                <ul className="space-y-1.5">{section.tips.map((tip, i) => <li key={i} className="flex items-start gap-2 text-xs text-white/40"><span className={cn("mt-0.5 shrink-0", section.text)}>•</span><span>{tip}</span></li>)}</ul>
              </div>
            ))}
          </div>
          {PERSONAL_INTERVIEW.map(section => (
            <div key={section.category} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4"><span className="text-xl">{section.icon}</span> {section.category}</h2>
              <div className="space-y-3">{section.questions.map((item, i) => <HRQuestionCard key={i} item={item} />)}</div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}