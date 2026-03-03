"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Send, Search, BadgeCheck, ArrowLeft, UserPlus, Clock, CheckCircle, XCircle, Users, Inbox, Check, CheckCheck, MoreVertical, Download, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Message { _id: string; conversationId: string; fromUserId: string; toUserId: string; text: string; createdAt: string; read?: boolean }
interface Conversation { id: string; userId: string; userName: string; userEmail?: string; isVerifiedHR: boolean; role: string; lastMessage: string; lastMessageAt: string; unreadCount?: number }
interface ConnectionRequest { _id: string; fromUserId: string; fromUserName: string; fromUserRole: string; fromUserEmail: string; toUserId?: string; toUserName?: string; toUserEmail?: string; isVerifiedHR?: boolean; note?: string; status: "pending" | "accepted" | "rejected"; rejectReason?: string; autoRejected?: boolean; createdAt: string }

const formatTime = (date: string) => { if (!date) return ""; const d = new Date(date); const now = new Date(); const diff = now.getTime() - d.getTime(); if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" }); return d.toLocaleDateString([], { month: "short", day: "numeric" }) }
const Avatar = ({ name, size = "md", online = false }: { name: string; size?: "sm" | "md" | "lg"; online?: boolean }) => {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" }
  return (
    <div className="relative shrink-0">
      <div className={cn("rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 flex items-center justify-center font-semibold text-white border border-white/10", sizes[size])}>{name?.[0]?.toUpperCase() || "U"}</div>
      {online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#05080f]" />}
    </div>
  )
}
const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20"

export default function MessagesPage() {
  const { data: session } = useSession(); const user = session?.user as any; const role = user?.role
  const [conversations, setConversations] = useState<Conversation[]>([]); const [activeConversation, setActiveConversation] = useState<Conversation | null>(null); const [messages, setMessages] = useState<Message[]>([]); const [newMessage, setNewMessage] = useState(""); const [sendingMessage, setSendingMessage] = useState(false); const [searchTerm, setSearchTerm] = useState(""); const [loadingConvs, setLoadingConvs] = useState(true); const [isTyping, setIsTyping] = useState(false); const [activeTab, setActiveTab] = useState("messages")
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]); const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]); const [loadingRequests, setLoadingRequests] = useState(true); const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({})
  const [connectEmail, setConnectEmail] = useState(""); const [connectNote, setConnectNote] = useState(""); const [showConnectForm, setShowConnectForm] = useState(false); const [sendingRequest, setSendingRequest] = useState(false); const [remainingRequests, setRemainingRequests] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null); const inputRef = useRef<HTMLInputElement>(null)

  const fetchConversations = async () => { try { const res = await fetch("/api/messages"); if (res.ok) { const data = await res.json(); setConversations(data.conversations || []) } } catch { toast.error("Failed to load conversations") } finally { setLoadingConvs(false) } }
  const fetchMessages = async (conversationId: string) => { try { const res = await fetch(`/api/messages?conversationId=${conversationId}`); if (res.ok) { const data = await res.json(); setMessages(data.messages || []); await fetch("/api/messages/read", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId }) }) } } catch {} }
  const fetchRequests = async () => { try { const res = await fetch("/api/connections/requests"); if (res.ok) { const data = await res.json(); setIncomingRequests(data.incoming || []); setSentRequests(data.sent || []) } } catch {} finally { setLoadingRequests(false) } }
  const sendConnectionRequest = async () => {
    if (!connectEmail.trim()) return; setSendingRequest(true)
    try { const res = await fetch("/api/connections/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toUserEmail: connectEmail.trim(), note: connectNote.trim() }) }); const data = await res.json(); if (res.ok) { setRemainingRequests(data.remainingToday); toast.success(`Request sent! ${data.remainingToday} request(s) left today.`); setConnectEmail(""); setConnectNote(""); setShowConnectForm(false); fetchRequests() } else if (res.status === 429) { toast.error("Daily limit reached!") } else { toast.error(data.error || "Failed to send request") } } catch { toast.error("Failed to send request") } finally { setSendingRequest(false) }
  }
  const respondToRequest = async (requestId: string, action: "accept" | "reject", reason?: string) => {
    try { const res = await fetch("/api/connections/requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, action: action === "reject" ? "decline" : "accept", declineReason: reason || null }) }); if (res.ok) { toast.success(action === "accept" ? "Connection accepted!" : "Request declined."); fetchRequests(); fetchConversations(); if (action === "accept") setActiveTab("messages") } else { const data = await res.json(); toast.error(data.error || "Failed to respond") } } catch { toast.error("Failed to respond") }
  }
  const openChat = (req: ConnectionRequest) => {
    const otherId = req.toUserId || req.fromUserId; const otherName = req.toUserName || req.fromUserName; const otherEmail = req.toUserEmail || req.fromUserEmail; const convId = [user?.id, otherId].sort().join("_")
    const existing = conversations.find(c => c.id === convId)
    if (existing) { setActiveConversation(existing) } else { setActiveConversation({ id: convId, userId: otherId, userName: otherName, userEmail: otherEmail, isVerifiedHR: false, role: req.fromUserRole || "student", lastMessage: "", lastMessageAt: new Date().toISOString(), unreadCount: 0 }) }
    setActiveTab("messages")
  }
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return; setSendingMessage(true); const text = newMessage.trim(); setNewMessage("")
    try { const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toUserId: activeConversation.userId, text }) }); if (res.ok) { fetchMessages(activeConversation.id); fetchConversations() } else toast.error("Failed to send message") } catch { toast.error("Failed to send message") } finally { setSendingMessage(false) }
  }
  const handleTyping = (val: string) => { setNewMessage(val); if (activeConversation) { fetch("/api/messages/typing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: activeConversation.id, isTyping: true }) }) }; clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = setTimeout(() => { if (activeConversation) { fetch("/api/messages/typing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: activeConversation.id, isTyping: false }) }) } }, 2000) }
  const exportChat = () => { if (!messages.length || !activeConversation) return; const lines = messages.map(m => `[${new Date(m.createdAt).toLocaleString()}] ${m.fromUserId === user?.id ? "Me" : activeConversation.userName}: ${m.text}`).join("\n"); const blob = new Blob([`Chat with ${activeConversation.userName}\n${"=".repeat(40)}\n\n${lines}`], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `chat-${activeConversation.userName.replace(/\s/g, "_")}.txt`; a.click(); URL.revokeObjectURL(url); toast.success("Chat exported!") }

  useEffect(() => { fetchConversations(); fetchRequests() }, [])
  useEffect(() => { if (!activeConversation) return; fetchMessages(activeConversation.id); const interval = setInterval(async () => { fetchMessages(activeConversation.id); fetchConversations(); try { const res = await fetch(`/api/messages/typing?conversationId=${activeConversation.id}&otherUserId=${activeConversation.userId}`); if (res.ok) { const data = await res.json(); setIsTyping(data.isTyping) } } catch {} }, 2500); return () => clearInterval(interval) }, [activeConversation?.id])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const filteredConversations = conversations.filter(c => c.userName.toLowerCase().includes(searchTerm.toLowerCase()))
  const pendingIncoming = incomingRequests.filter(r => r.status === "pending")
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-cyan-600/10 via-blue-600/5 to-transparent p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1"><MessageSquare className="h-4 w-4 text-cyan-400" /><span className="text-xs text-cyan-400 font-medium">Messaging</span></div>
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <p className="text-sm text-white/40 mt-1">Connect and communicate with your network</p>
          </div>
          <div className="flex items-center gap-2">
            {remainingRequests !== null && <span className="text-xs text-white/30">{remainingRequests}/20 left today</span>}
            <Button size="sm" onClick={() => setShowConnectForm(!showConnectForm)} className="bg-gradient-to-r from-blue-600 to-violet-600 border-0">
              <UserPlus className="mr-2 h-4 w-4" /> Connect
            </Button>
          </div>
        </div>
      </div>

      {showConnectForm && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/8 p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-white"><UserPlus className="h-4 w-4 text-blue-400" /> Send Connection Request</p>
          <div className="space-y-2">
            <Input className={inputClass} placeholder="Enter their email address..." value={connectEmail} onChange={e => setConnectEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && sendConnectionRequest()} />
            <div className="relative">
              <Input className={inputClass} placeholder="Add a personal note (optional, max 200 chars)..." maxLength={200} value={connectNote} onChange={e => setConnectNote(e.target.value)} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/20">{connectNote.length}/200</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={sendConnectionRequest} disabled={sendingRequest} className="bg-gradient-to-r from-blue-600 to-violet-600 border-0">{sendingRequest ? "Sending..." : "Send Request"}</Button>
              <Button size="sm" variant="ghost" className="text-white/40 hover:text-white" onClick={() => setShowConnectForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/5">
          <TabsTrigger value="messages" className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40">
            <MessageSquare className="h-4 w-4" /> Chats
            {totalUnread > 0 && <Badge className="ml-1 text-xs bg-blue-500/20 text-blue-400 border-0 h-4 w-4 rounded-full p-0 flex items-center justify-center">{totalUnread}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40">
            <Inbox className="h-4 w-4" /> Requests {pendingIncoming.length > 0 && <Badge className="ml-1 text-xs bg-amber-500/20 text-amber-400 border-0">{pendingIncoming.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40">
            <Users className="h-4 w-4" /> Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <div className="flex h-[calc(100vh-22rem)] overflow-hidden rounded-2xl border border-white/5 bg-[#080c15]">
            {/* Sidebar */}
            <div className={cn("w-80 border-r border-white/5 flex flex-col shrink-0", activeConversation && "hidden md:flex")}>
              <div className="p-3 border-b border-white/5">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" /><Input className={cn(inputClass, "pl-9 h-9")} placeholder="Search messages..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
              </div>
              <ScrollArea className="flex-1">
                {loadingConvs ? (
                  <div className="p-3 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full bg-white/5" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-28 bg-white/5" /><Skeleton className="h-3 w-40 bg-white/5" /></div></div>)}</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-white/20 text-sm gap-2"><MessageSquare className="h-8 w-8 opacity-20" /><p>No conversations yet</p><p className="text-xs text-center px-4">Accept a connection request to start chatting</p></div>
                ) : filteredConversations.map(conv => (
                  <button key={conv.id} onClick={() => setActiveConversation(conv)} className={cn("flex w-full items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/3", activeConversation?.id === conv.id && "bg-white/5")}>
                    <Avatar name={conv.userName} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className={cn("text-sm truncate", (conv.unreadCount ?? 0) > 0 ? "font-bold text-white" : "font-medium text-white/70")}>{conv.userName}</span>
                          {conv.isVerifiedHR && <BadgeCheck className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-white/20 shrink-0">{conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn("text-xs truncate", (conv.unreadCount ?? 0) > 0 ? "text-white/60 font-medium" : "text-white/25")}>{conv.lastMessage || "Start a conversation..."}</p>
                        {(conv.unreadCount ?? 0) > 0 && <span className="h-4 w-4 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center shrink-0 font-bold">{conv.unreadCount}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>

            {/* Chat window */}
            <div className={cn("flex flex-1 flex-col min-w-0", !activeConversation && "hidden md:flex")}>
              {activeConversation ? (
                <>
                  <div className="border-b border-white/5 px-4 py-3 flex items-center gap-3 bg-[#080c15]">
                    <Button variant="ghost" size="icon" className="md:hidden shrink-0 text-white/40 hover:text-white" onClick={() => setActiveConversation(null)}><ArrowLeft className="h-4 w-4" /></Button>
                    <Avatar name={activeConversation.userName} size="sm" online />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate text-white">{activeConversation.userName}</span>
                        {activeConversation.isVerifiedHR && <BadgeCheck className="h-4 w-4 text-blue-400 shrink-0" />}
                      </div>
                      <span className="text-xs text-white/30 capitalize">{isTyping ? <span className="text-blue-400 font-medium animate-pulse">typing...</span> : activeConversation.role}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-white/30 hover:text-white"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0d1117] border-white/10 text-white">
                        <DropdownMenuItem onClick={exportChat} className="gap-2 cursor-pointer hover:bg-white/5"><Download className="h-4 w-4" /> Export Chat</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <ScrollArea className="flex-1 px-4 py-3">
                    <div className="space-y-1">
                      {messages.length === 0 && <div className="flex flex-col items-center justify-center py-12 text-white/20 gap-2"><MessageSquare className="h-10 w-10 opacity-20" /><p className="text-sm font-medium text-white/30">Start the conversation!</p><p className="text-xs">Say hello to {activeConversation.userName} 👋</p></div>}
                      {messages.map((msg, idx) => {
                        const isMe = msg.fromUserId === user?.id; const prevMsg = messages[idx - 1]; const showAvatar = !isMe && (!prevMsg || prevMsg.fromUserId !== msg.fromUserId); const isLast = idx === messages.length - 1
                        return (
                          <div key={msg._id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                            {!isMe && <div className="w-6 shrink-0">{showAvatar && <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 flex items-center justify-center text-[10px] font-semibold text-white">{activeConversation.userName[0]}</div>}</div>}
                            <div className={cn("max-w-[68%] flex flex-col", isMe ? "items-end" : "items-start")}>
                              <div className={cn("rounded-2xl px-3.5 py-2 text-sm", isMe ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-br-sm" : "bg-white/8 text-white/80 rounded-bl-sm")}>{msg.text}</div>
                              <div className={cn("flex items-center gap-1 mt-0.5 px-1", isMe ? "justify-end" : "justify-start")}>
                                <span className="text-[10px] text-white/20">{formatTime(msg.createdAt)}</span>
                                {isMe && (isLast && msg.read ? <CheckCheck className="h-3 w-3 text-blue-400" /> : <Check className="h-3 w-3 text-white/20" />)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {isTyping && <div className="flex items-end gap-2 justify-start"><div className="w-6 shrink-0"><div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-semibold text-white">{activeConversation.userName[0]}</div></div><div className="bg-white/8 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center"><span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" /><span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" /><span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" /></div></div>}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="border-t border-white/5 px-4 py-3 flex gap-2 bg-[#080c15]">
                    <Input ref={inputRef} className="flex-1 rounded-full bg-white/5 border-white/8 text-white placeholder:text-white/20 focus:bg-white/8" placeholder="Write a message..." value={newMessage} onChange={e => handleTyping(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()} />
                    <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()} size="icon" className="rounded-full shrink-0 bg-gradient-to-r from-blue-600 to-violet-600 border-0"><Send className="h-4 w-4" /></Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-white/20 gap-3">
                  <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center"><MessageSquare className="h-8 w-8 opacity-30" /></div>
                  <p className="font-semibold text-white/40">Your Messages</p>
                  <p className="text-sm text-center max-w-xs text-white/25">Select a conversation or connect with someone new</p>
                  <Button size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10 border" onClick={() => setShowConnectForm(true)}><UserPlus className="mr-2 h-4 w-4" /> Start a conversation</Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Pending Requests ({pendingIncoming.length})</p>
            {loadingRequests ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5" />)}</div>
              : pendingIncoming.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-white/20 gap-2"><Inbox className="h-10 w-10 opacity-20" /><p className="font-medium text-white/30">No pending requests</p></div>
              : <div className="space-y-3">{pendingIncoming.map(req => (
                  <div key={req._id} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 hover:bg-white/3 transition-colors">
                    <Avatar name={req.fromUserName} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold text-sm text-white/80">{req.fromUserName}</span>{req.isVerifiedHR && <BadgeCheck className="h-4 w-4 text-blue-400" />}<Badge className="text-xs capitalize bg-white/8 text-white/40 border-0">{req.fromUserRole}</Badge></div>
                      <p className="text-xs text-white/30">{req.fromUserEmail}</p>
                      {req.note && <p className="text-sm mt-2 text-white/50 bg-white/5 rounded-xl px-3 py-2 italic border-l-2 border-blue-500/30">"{req.note}"</p>}
                      <p className="text-[11px] text-white/20 mt-1.5">{formatTime(req.createdAt)}</p>
                      {role === "hr" ? (
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Button size="sm" onClick={() => respondToRequest(req._id, "accept")} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 border-0"><CheckCircle className="h-3.5 w-3.5" /> Accept</Button>
                          <Input className={cn("h-8 text-xs flex-1 min-w-32", "bg-white/5 border-white/10 text-white placeholder:text-white/20")} placeholder="Decline reason (optional)..." value={rejectReasons[req._id] || ""} onChange={e => setRejectReasons(prev => ({ ...prev, [req._id]: e.target.value }))} />
                          <Button size="sm" className="gap-1.5 shrink-0 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20" onClick={() => respondToRequest(req._id, "reject", rejectReasons[req._id])}><XCircle className="h-3.5 w-3.5" /> Decline</Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => respondToRequest(req._id, "accept")} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 border-0"><CheckCircle className="h-3.5 w-3.5" /> Accept</Button>
                          <Button size="sm" className="gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20" onClick={() => respondToRequest(req._id, "reject")}><XCircle className="h-3.5 w-3.5" /> Decline</Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}</div>}
          </div>
        </TabsContent>

        <TabsContent value="sent">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Sent Requests ({sentRequests.length})</p>
            {loadingRequests ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl bg-white/5" />)}</div>
              : sentRequests.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-white/20 gap-2"><Users className="h-10 w-10 opacity-20" /><p className="font-medium text-white/30">No sent requests</p><p className="text-sm text-white/20">Click "Connect" to send your first request</p></div>
              : <div className="space-y-3">{sentRequests.map(req => (
                  <div key={req._id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:bg-white/3 transition-colors">
                    <Avatar name={req.toUserName || req.fromUserName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="font-medium text-sm text-white/70">{req.toUserName || req.fromUserName}</span><Badge className="text-xs capitalize bg-white/8 text-white/40 border-0">{req.fromUserRole}</Badge></div>
                      <p className="text-xs text-white/30">{req.toUserEmail || req.fromUserEmail}</p>
                      {req.status === "rejected" && req.rejectReason && <p className="text-xs text-white/25 mt-1 italic">Reason: {req.rejectReason}</p>}
                    </div>
                    {req.status === "accepted" && <Button size="sm" className="gap-1.5 shrink-0 bg-gradient-to-r from-blue-600 to-violet-600 border-0" onClick={() => openChat(req)}><MessageSquare className="h-3.5 w-3.5" /> Message</Button>}
                    {req.status === "pending" && <Badge className="gap-1 text-amber-400 border border-amber-500/20 bg-amber-500/8 shrink-0"><Clock className="h-3 w-3" /> Pending</Badge>}
                    {req.status === "rejected" && <Badge className="gap-1 text-red-400 border border-red-500/20 bg-red-500/8 shrink-0"><XCircle className="h-3 w-3" /> Declined</Badge>}
                  </div>
                ))}</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}