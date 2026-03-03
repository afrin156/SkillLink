"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import {
  Sparkles, Trophy, Star, BarChart2, Briefcase, Image as ImageIcon,
  ThumbsUp, MessageCircle, Share2, Bookmark, MoreHorizontal,
  TrendingUp, Send, Loader2, Award, Zap,
  Heart, Lightbulb, PartyPopper, X, Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ── Types ──
type PostType = "regular" | "win" | "skill" | "poll" | "job" | "culture"

interface Post {
  _id: string
  authorId: string
  authorName: string
  authorRole: string
  authorCompany?: string
  type: PostType
  content: string
  mediaUrl?: string
  mediaType?: "image" | "video"
  skillBadge?: string
  winType?: string
  pollOptions?: { text: string; votes: number }[]
  jobTitle?: string
  jobCompany?: string
  jobLocation?: string
  visibility?: string
  reactions: { like: number; helpful: number; relatable: number; inspiring: number }
  userReaction?: string
  commentCount: number
  createdAt: string
  isVerifiedHR?: boolean
}

// ── Constants ──
const POST_TYPES = [
  { type: "regular" as PostType, icon: MessageCircle, label: "Post",        color: "text-blue-400",   bg: "bg-blue-500/10" },
  { type: "win"     as PostType, icon: Trophy,        label: "Career Win",  color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { type: "skill"   as PostType, icon: Star,          label: "Skill Badge", color: "text-purple-400", bg: "bg-purple-500/10" },
  { type: "poll"    as PostType, icon: BarChart2,      label: "Poll",        color: "text-cyan-400",   bg: "bg-cyan-500/10" },
]

const WIN_TYPES = ["Got an Interview 🎯", "Got an Offer 🎉", "Completed a Course 📚", "Got Internship 💼", "First Salary 💰", "Promotion 🚀"]
const SKILL_BADGES = ["React", "Python", "Node.js", "UI/UX", "Data Science", "AWS", "Machine Learning", "Figma", "Java", "SQL"]
const TRENDING_SKILLS = ["React.js", "Python", "AI/ML", "Node.js", "Figma", "AWS", "Data Analysis", "TypeScript"]

const REACTION_CONFIG = [
  { key: "like",      icon: ThumbsUp,  label: "Like",      color: "text-blue-400" },
  { key: "helpful",   icon: Lightbulb, label: "Helpful",   color: "text-yellow-400" },
  { key: "relatable", icon: Heart,     label: "Relatable", color: "text-pink-400" },
  { key: "inspiring", icon: Zap,       label: "Inspiring", color: "text-purple-400" },
]

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 60000) return "just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

// ══════════════════════════════════════════
// POST CARD
// ══════════════════════════════════════════
function PostCard({ post, currentUserId, onReact, onVote }: {
  post: Post
  currentUserId: string
  onReact: (postId: string, reaction: string) => void
  onVote: (postId: string, optionIndex: number) => void
}) {
  const [showReactions, setShowReactions] = useState(false)
  const totalVotes = post.pollOptions?.reduce((s, o) => s + o.votes, 0) || 0
  const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0)

  return (
    <div className={cn(
      "rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.03] transition-all overflow-hidden",
      post.type === "win"     && "border-yellow-500/20 bg-yellow-500/[0.03]",
      post.type === "skill"   && "border-purple-500/20 bg-purple-500/[0.03]",
      post.type === "job"     && "border-blue-500/20 bg-blue-500/[0.03]",
      post.type === "culture" && "border-emerald-500/20 bg-emerald-500/[0.03]",
    )}>

      {/* Type banners */}
      {post.type === "win" && (
        <div className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border-b border-yellow-500/10 flex items-center gap-2">
          <PartyPopper className="h-4 w-4 text-yellow-400" />
          <span className="text-xs font-semibold text-yellow-400">{post.winType || "Career Win 🎉"}</span>
        </div>
      )}
      {post.type === "skill" && (
        <div className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/10 border-b border-purple-500/10 flex items-center gap-2">
          <Award className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-400">Skill Showcase</span>
          {post.skillBadge && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">{post.skillBadge}</Badge>}
        </div>
      )}
      {post.type === "job" && (
        <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/10 border-b border-blue-500/10 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-semibold text-blue-400">Job Alert</span>
        </div>
      )}
      {post.type === "culture" && (
        <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-b border-emerald-500/10 flex items-center gap-2">
          <Star className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">Company Culture</span>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Author */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/40 to-violet-500/40 flex items-center justify-center text-white font-bold border border-white/10 shrink-0">
              {post.authorName?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-white/90">{post.authorName}</span>
                {post.isVerifiedHR && <Badge className="text-[10px] bg-blue-500/15 text-blue-400 border-blue-500/20 px-1.5 py-0">HR ✓</Badge>}
                {post.visibility === "public" && <Badge className="text-[10px] bg-white/5 text-white/30 border-white/10 px-1.5 py-0">🌐</Badge>}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/30">
                <span className="capitalize">{post.authorRole}</span>
                {post.authorCompany && <><span>·</span><span>{post.authorCompany}</span></>}
                <span>·</span>
                <span>{timeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
  {post.authorId === currentUserId && (
    <Button variant="ghost" size="icon"
      className="h-8 w-8 text-red-400/40 hover:text-red-400 hover:bg-red-500/10"
      onClick={async () => {
        if (!confirm("Delete this post?")) return
        await fetch(`/api/feed/posts/${post._id}`, { method: "DELETE" })
        window.location.reload()
      }}>
      <X className="h-4 w-4" />
    </Button>
  )}
  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white">
    <MoreHorizontal className="h-4 w-4" />
  </Button>
</div>
        </div>

        {/* Text content */}
        <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {/* ── IMAGE ── */}
        {post.mediaUrl && post.mediaType === "image" && (
          <div className="rounded-xl overflow-hidden border border-white/5">
            <img
              src={post.mediaUrl}
              alt="post media"
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        {/* ── VIDEO ── */}
        {post.mediaUrl && post.mediaType === "video" && (
          <div className="rounded-xl overflow-hidden border border-white/5 bg-black">
            <video
              src={post.mediaUrl}
              controls
              className="w-full max-h-96"
              preload="metadata"
            />
          </div>
        )}

        {/* Job card */}
        {post.type === "job" && post.jobTitle && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-1">
            <p className="font-semibold text-white/90">{post.jobTitle}</p>
            <p className="text-sm text-white/50">{post.jobCompany} · {post.jobLocation}</p>
            <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700 border-0 h-7 text-xs">Apply Now</Button>
          </div>
        )}

        {/* Poll */}
        {post.type === "poll" && post.pollOptions && (
          <div className="space-y-2">
            {post.pollOptions.map((opt, i) => {
              const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
              return (
                <button key={i} onClick={() => onVote(post._id, i)}
                  className="w-full text-left rounded-xl border border-white/10 overflow-hidden hover:border-blue-500/40 transition-all group">
                  <div className="relative px-3 py-2.5">
                    <div className="absolute inset-0 bg-blue-500/15 transition-all" style={{ width: `${pct}%` }} />
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm text-white/80 group-hover:text-white">{opt.text}</span>
                      <span className="text-xs text-white/40 font-medium">{pct}%</span>
                    </div>
                  </div>
                </button>
              )
            })}
            <p className="text-xs text-white/25 text-center">{totalVotes} votes</p>
          </div>
        )}

        {/* Reactions */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="flex items-center gap-1">
            <div
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
              className="relative"
            >
              <Button variant="ghost" size="sm"
                className={cn("gap-1.5 text-xs h-8 rounded-xl",
                  post.userReaction ? "text-blue-400 bg-blue-500/10" : "text-white/30 hover:text-white hover:bg-white/5")}>
                <ThumbsUp className="h-3.5 w-3.5" />
                {totalReactions > 0 && <span>{totalReactions}</span>}
              </Button>
              {showReactions && (
                <div className="absolute bottom-10 left-0 flex gap-1 bg-[#0d1117] border border-white/10 rounded-2xl p-2 shadow-2xl z-10">
                  {REACTION_CONFIG.map(r => (
                    <button key={r.key}
                      onClick={() => { onReact(post._id, r.key); setShowReactions(false) }}
                      className={cn("flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-all group",
                        post.userReaction === r.key && "bg-white/10")}>
                      <r.icon className={cn("h-5 w-5 transition-transform group-hover:scale-125", r.color)} />
                      <span className="text-[9px] text-white/40">{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 rounded-xl text-white/30 hover:text-white hover:bg-white/5">
              <MessageCircle className="h-3.5 w-3.5" />
              {post.commentCount > 0 && <span>{post.commentCount}</span>}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 rounded-xl text-white/30 hover:text-white hover:bg-white/5">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white hover:bg-white/5">
            <Bookmark className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// CREATE POST
// ══════════════════════════════════════════
function CreatePost({ user, onPost }: { user: any; onPost: () => void }) {
  const [selectedType, setSelectedType] = useState<PostType>("regular")
  const [content, setContent] = useState("")
  const [winType, setWinType] = useState("")
  const [skillBadge, setSkillBadge] = useState("")
  const [pollOptions, setPollOptions] = useState(["", ""])
  const [jobTitle, setJobTitle] = useState("")
  const [jobLocation, setJobLocation] = useState("")
  const [visibility, setVisibility] = useState<"connections" | "public">("connections")
  const [generatingAI, setGeneratingAI] = useState(false)
  const [posting, setPosting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Media states
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Upload file to Cloudinary via API ──
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/feed/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setMediaUrl(data.url)
        setMediaType(data.type)
        toast.success("Media uploaded!")
      } else {
        toast.error(data.error || "Upload failed")
      }
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
      // Reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // ── AI generate post ──
  async function generateAIPost() {
    const topic = content || winType || skillBadge
    if (!topic.trim()) {
      toast.error("Write a topic first — what do you want to post about?")
      return
    }
    setGeneratingAI(true)
    try {
      const res = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, type: selectedType, userName: user?.name, role: user?.role }),
      })
      if (res.ok) {
        const data = await res.json()
        setContent(data.post)
        toast.success("AI post generated!")
      }
    } catch { toast.error("Failed to generate") }
    finally { setGeneratingAI(false) }
  }

  // ── Submit post ──
  async function submitPost() {
    if (!content.trim()) { toast.error("Write something first!"); return }
    if (selectedType === "poll" && pollOptions.filter(o => o.trim()).length < 2) {
      toast.error("Add at least 2 poll options"); return
    }
    setPosting(true)
    try {
      const res = await fetch("/api/feed/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          content,
          winType: selectedType === "win" ? winType : undefined,
          skillBadge: selectedType === "skill" ? skillBadge : undefined,
          pollOptions: selectedType === "poll"
            ? pollOptions.filter(o => o.trim()).map(text => ({ text, votes: 0 }))
            : undefined,
          jobTitle: selectedType === "job" ? jobTitle : undefined,
          jobLocation: selectedType === "job" ? jobLocation : undefined,
          jobCompany: user?.company,
          mediaUrl,
          mediaType,
          visibility,
        }),
      })
      if (res.ok) {
        toast.success("Posted!")
        setContent(""); setWinType(""); setSkillBadge("")
        setPollOptions(["", ""]); setJobTitle(""); setJobLocation("")
        setMediaUrl(null); setMediaType(null)
        setSelectedType("regular"); setExpanded(false)
        onPost()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to post")
      }
    } catch { toast.error("Failed to post") }
    finally { setPosting(false) }
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
      {/* Collapsed top row */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/40 to-violet-500/40 flex items-center justify-center text-white font-bold border border-white/10 shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="flex-1 text-left px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white/30 text-sm hover:bg-white/8 hover:border-white/10 transition-all">
          Share something with your network...
        </button>
      </div>

      {expanded && (
        <>
          {/* Post type selector */}
          <div className="flex gap-2 flex-wrap">
            {POST_TYPES.map(pt => (
              <button key={pt.type} onClick={() => setSelectedType(pt.type)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all",
                  selectedType === pt.type
                    ? `${pt.bg} ${pt.color} border-current`
                    : "border-white/5 text-white/30 hover:border-white/15 hover:text-white/60")}>
                <pt.icon className="h-3.5 w-3.5" />
                {pt.label}
              </button>
            ))}
          </div>

          {/* Win type picker */}
          {selectedType === "win" && (
            <div className="flex flex-wrap gap-2">
              {WIN_TYPES.map(w => (
                <button key={w} onClick={() => setWinType(w)}
                  className={cn("px-3 py-1 rounded-lg text-xs border transition-all",
                    winType === w
                      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      : "border-white/5 text-white/30 hover:border-white/15")}>
                  {w}
                </button>
              ))}
            </div>
          )}

          {/* Skill badge picker */}
          {selectedType === "skill" && (
            <div className="flex flex-wrap gap-2">
              {SKILL_BADGES.map(s => (
                <button key={s} onClick={() => setSkillBadge(s)}
                  className={cn("px-3 py-1 rounded-lg text-xs border transition-all",
                    skillBadge === s
                      ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                      : "border-white/5 text-white/30 hover:border-white/15")}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Job fields (HR only) */}
          {selectedType === "job" && user?.role === "hr" && (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Job Title" value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
              <Input placeholder="Location / Remote" value={jobLocation}
                onChange={e => setJobLocation(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
            </div>
          )}

          {/* Poll options */}
          {selectedType === "poll" && (
            <div className="space-y-2">
              {pollOptions.map((opt, i) => (
                <Input key={i} placeholder={`Option ${i + 1}`} value={opt}
                  onChange={e => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n) }}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
              ))}
              {pollOptions.length < 4 && (
                <button onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-xs text-white/30 hover:text-white flex items-center gap-1 transition-colors">
                  <Plus className="h-3 w-3" /> Add option
                </button>
              )}
            </div>
          )}

          {/* Text area */}
          <Textarea
            placeholder={
              selectedType === "win"     ? "Tell everyone about your achievement! 🎉" :
              selectedType === "skill"   ? "Share what you learned and how you'll use it..." :
              selectedType === "poll"    ? "Ask your question..." :
              selectedType === "job"     ? "Describe the role and why candidates should apply..." :
              "Share career tips, experiences, questions..."
            }
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            className="resize-none bg-white/5 border-white/10 text-white placeholder:text-white/20"
          />

          {/* ── MEDIA UPLOAD ── */}
          <div className="space-y-2">
            {/* Preview uploaded media */}
            {mediaUrl && (
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                {mediaType === "image" ? (
                  <img src={mediaUrl} alt="preview" className="w-full max-h-56 object-cover" />
                ) : (
                  <video src={mediaUrl} controls className="w-full max-h-56" />
                )}
                {/* Remove button */}
                <button
                  onClick={() => { setMediaUrl(null); setMediaType(null) }}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black/90 transition-all">
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-black/60 text-white/70 border-0 text-xs">
                    {mediaType === "image" ? "📷 Image" : "🎥 Video"} uploaded ✓
                  </Badge>
                </div>
              </div>
            )}

            {/* Upload button — only show if no media yet */}
            {!mediaUrl && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 text-xs transition-all w-full justify-center group">
                {uploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin text-blue-400" /> Uploading...</>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 group-hover:text-blue-400 transition-colors" />
                    Add Photo or Video
                    <span className="text-white/20">· Max 50MB</span>
                  </>
                )}
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/mov"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Bottom actions row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {/* AI write button */}
              <Button size="sm" variant="ghost"
                onClick={generateAIPost} disabled={generatingAI}
                className="gap-1.5 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                {generatingAI
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Sparkles className="h-3.5 w-3.5" />}
                AI Write
              </Button>

              {/* Visibility toggle */}
              <button
                onClick={() => setVisibility(v => v === "connections" ? "public" : "connections")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all",
                  visibility === "public"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                )}>
                {visibility === "public" ? "🌐 Everyone" : "👥 Connections"}
              </button>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="ghost"
                onClick={() => setExpanded(false)}
                className="text-white/30 hover:text-white text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={submitPost} disabled={posting || uploading}
                className="bg-gradient-to-r from-blue-600 to-violet-600 border-0 text-xs gap-1.5">
                {posting
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Send className="h-3.5 w-3.5" />}
                Post
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Quick type buttons when collapsed */}
      {!expanded && (
        <div className="flex gap-2 pt-1 border-t border-white/5">
          {POST_TYPES.map(pt => (
            <button key={pt.type}
              onClick={() => { setSelectedType(pt.type); setExpanded(true) }}
              className={cn("flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1 rounded-lg hover:bg-white/5", pt.color)}>
              <pt.icon className="h-3.5 w-3.5" />
              {pt.label}
            </button>
          ))}
          <button
            onClick={() => { setExpanded(true) }}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1 rounded-lg hover:bg-white/5 ml-auto">
            <ImageIcon className="h-3.5 w-3.5" />
            Photo/Video
          </button>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════
export default function FeedPage() {
  const { data: session } = useSession()
  const user = session?.user as any

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => { fetchPosts() }, [filter])

  async function fetchPosts() {
    setLoading(true)
    try {
      const res = await fetch(`/api/feed/posts?filter=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch { toast.error("Failed to load feed") }
    finally { setLoading(false) }
  }

  async function handleReact(postId: string, reaction: string) {
    try {
      await fetch("/api/feed/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, reaction }),
      })
      fetchPosts()
    } catch {}
  }

  async function handleVote(postId: string, optionIndex: number) {
    try {
      await fetch("/api/feed/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, optionIndex }),
      })
      fetchPosts()
    } catch {}
  }

  const filters = [
    { key: "all",     label: "✦ All" },
    { key: "wins",    label: "🏆 Wins" },
    { key: "skills",  label: "⭐ Skills" },
    { key: "jobs",    label: "💼 Jobs" },
    { key: "polls",   label: "📊 Polls" },
    { key: "culture", label: "🏢 Culture" },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-blue-600/10 via-violet-600/5 to-transparent p-5">
        <div className="absolute top-0 right-0 w-64 h-32 bg-blue-500/8 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative">
          <h1 className="text-xl font-bold text-white">Career Feed</h1>
          <p className="text-sm text-white/40">Wins, tips, jobs and opportunities from your network</p>
        </div>
        <div className="relative mt-3 flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-white/30 shrink-0">
            <TrendingUp className="h-3 w-3 text-emerald-400" /> Trending:
          </span>
          {TRENDING_SKILLS.slice(0, 5).map(s => (
            <Badge key={s} className="bg-white/5 text-white/40 border-white/8 text-xs cursor-pointer hover:bg-white/10">
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {/* Create post */}
      <CreatePost user={user} onPost={fetchPosts} />

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border transition-all shrink-0",
              filter === f.key
                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                : "border-white/5 text-white/30 hover:border-white/15 hover:text-white/60"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-24 bg-white/5 rounded" />
                  <div className="h-2.5 w-16 bg-white/5 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/5 rounded" />
                <div className="h-3 w-3/4 bg-white/5 rounded" />
              </div>
              <div className="h-32 w-full bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
            <TrendingUp className="h-8 w-8 text-white/20" />
          </div>
          <p className="text-white/40 font-medium">No posts yet</p>
          <p className="text-white/20 text-sm">Be the first to post something!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={user?.id}
              onReact={handleReact}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  )
}