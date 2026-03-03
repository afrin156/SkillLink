import type { ObjectId } from "mongodb"

export type UserRole = "student" | "hr" | "admin"
export type VerificationStatus = "pending" | "verified" | "rejected"
export type ApplicationStatus = "submitted" | "reviewed" | "shortlisted" | "selected" | "rejected"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  passwordHash: string
  role: UserRole
  isVerifiedStudent: boolean
  isVerifiedHR: boolean
  createdAt: Date
}

export interface Job {
  _id?: ObjectId
  title: string
  company: string
  location: string
  jobType: string
  skills: string[]
  description: string
  salary?: string
  officialCompanyUrl: string
  postedByUserId: string
  postedByName?: string
  verificationStatus: VerificationStatus
  createdAt: Date
}

export interface SavedJob {
  _id?: ObjectId
  userId: string
  jobId: string
  createdAt: Date
}

export interface Application {
  _id?: ObjectId
  userId: string
  userName?: string
  userEmail?: string
  jobId: string
  jobTitle?: string
  company?: string
  status: ApplicationStatus
  resumeSnapshot?: string
  createdAt: Date
}

export interface Event {
  _id?: ObjectId
  title: string
  organizer: string
  date: string
  mode: string
  officialUrl: string
  certificateInfo?: string
  createdByUserId: string
  verificationStatus: VerificationStatus
  createdAt: Date
}

export interface Message {
  _id?: ObjectId
  conversationId: string
  fromUserId: string
  fromUserName?: string
  toUserId: string
  toUserName?: string
  text: string
  createdAt: Date
}

export interface Roadmap {
  _id?: ObjectId
  userId: string
  track: string
  level: string
  hoursPerWeek: number
  planJSON: RoadmapWeek[]
  progressJSON: Record<string, boolean>
  createdAt: Date
}

export interface RoadmapWeek {
  week: number
  title: string
  topics: string[]
  project?: string
  resources: { name: string; url: string }[]
}

export interface Resume {
  _id?: ObjectId
  userId: string
  resumeJSON: ResumeData
  atsScore: number
  suggestions: string[]
  updatedAt: Date
}

export interface ResumeData {
  fullName: string
  email: string
  phone: string
  summary: string
  skills: string[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  education: ResumeEducation[]
  certifications: string[]
}

export interface ResumeExperience {
  title: string
  company: string
  startDate: string
  endDate: string
  bullets: string[]
}

export interface ResumeProject {
  name: string
  description: string
  technologies: string[]
  bullets: string[]
}

export interface ResumeEducation {
  institution: string
  degree: string
  year: string
  gpa?: string
}
