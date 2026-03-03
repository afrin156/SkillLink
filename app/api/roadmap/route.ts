import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"

const FREE_RESOURCES: Record<string, { name: string; url: string }[]> = {
  general: [
    { name: "freeCodeCamp", url: "https://www.freecodecamp.org" },
    { name: "The Odin Project", url: "https://www.theodinproject.com" },
    { name: "MDN Web Docs", url: "https://developer.mozilla.org" },
    { name: "roadmap.sh", url: "https://roadmap.sh" },
  ],
  frontend: [
    { name: "freeCodeCamp - Responsive Web Design", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/" },
    { name: "The Odin Project - Foundations", url: "https://www.theodinproject.com/paths/foundations" },
    { name: "MDN CSS", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" },
    { name: "YouTube - Traversy Media", url: "https://www.youtube.com/@TraversyMedia" },
    { name: "YouTube - Fireship", url: "https://www.youtube.com/@Fireship" },
  ],
  backend: [
    { name: "freeCodeCamp - APIs", url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/" },
    { name: "The Odin Project - NodeJS", url: "https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs" },
    { name: "YouTube - CodeWithHarry", url: "https://www.youtube.com/@CodeWithHarry" },
    { name: "YouTube - Telusko", url: "https://www.youtube.com/@Telusko" },
  ],
  fullstack: [
    { name: "freeCodeCamp Full Stack", url: "https://www.freecodecamp.org" },
    { name: "The Odin Project Full Stack", url: "https://www.theodinproject.com/paths/full-stack-javascript" },
    { name: "YouTube - freeCodeCamp.org", url: "https://www.youtube.com/@freecodecamp" },
    { name: "roadmap.sh - Full Stack", url: "https://roadmap.sh/full-stack" },
  ],
  data: [
    { name: "SQLBolt", url: "https://sqlbolt.com" },
    { name: "freeCodeCamp - Data Analysis", url: "https://www.freecodecamp.org/learn/data-analysis-with-python/" },
    { name: "LeetCode", url: "https://leetcode.com" },
    { name: "HackerRank", url: "https://www.hackerrank.com" },
  ],
  devops: [
    { name: "roadmap.sh - DevOps", url: "https://roadmap.sh/devops" },
    { name: "freeCodeCamp - Linux", url: "https://www.freecodecamp.org/news/tag/linux/" },
    { name: "YouTube - TechWorld with Nana", url: "https://www.youtube.com/@TechWorldwithNana" },
  ],
}

function generatePlan(track: string, level: string, hoursPerWeek: number) {
  const trackPlans: Record<string, { title: string; topics: string[]; project?: string }[]> = {
    "Full Stack Developer": [
      { title: "HTML & CSS Fundamentals", topics: ["HTML5 semantics", "CSS Flexbox & Grid", "Responsive design"], project: "Portfolio website" },
      { title: "JavaScript Essentials", topics: ["Variables, functions, loops", "DOM manipulation", "ES6+ features"], project: "Todo app" },
      { title: "React Fundamentals", topics: ["Components & props", "State & hooks", "React Router"], project: "Weather app" },
      { title: "Node.js & Express", topics: ["REST APIs", "Middleware", "Error handling"], project: "REST API server" },
      { title: "Database & MongoDB", topics: ["CRUD operations", "Mongoose ODM", "Data modeling"], project: "Blog backend" },
      { title: "Full Stack Integration", topics: ["Auth with JWT", "Deployment", "Testing basics"], project: "Full stack CRUD app" },
      { title: "Advanced Topics", topics: ["TypeScript", "Next.js", "CI/CD basics"], project: "Full stack project" },
      { title: "DSA & Interview Prep", topics: ["Arrays & strings", "Linked lists", "Trees & graphs"], project: "LeetCode 50 problems" },
    ],
    "Frontend": [
      { title: "HTML & CSS Deep Dive", topics: ["Semantic HTML", "CSS animations", "Accessibility"], project: "Responsive landing page" },
      { title: "JavaScript Core", topics: ["Closures, prototypes", "Async/await", "Fetch API"], project: "API consumer app" },
      { title: "React", topics: ["Hooks deep dive", "Context API", "Performance"], project: "E-commerce UI" },
      { title: "Styling & UI", topics: ["Tailwind CSS", "Component libraries", "Design systems"], project: "Design system" },
      { title: "State Management", topics: ["Redux/Zustand", "React Query", "Form handling"], project: "Dashboard app" },
      { title: "Testing & Tooling", topics: ["Jest", "React Testing Library", "Webpack/Vite"], project: "Tested component library" },
    ],
    "Backend": [
      { title: "Node.js Foundations", topics: ["Event loop", "File system", "Streams"], project: "CLI tool" },
      { title: "Express & APIs", topics: ["REST design", "Validation", "Authentication"], project: "Auth API" },
      { title: "Databases", topics: ["SQL basics", "MongoDB", "ORMs"], project: "Database-backed API" },
      { title: "Advanced Backend", topics: ["Caching", "Rate limiting", "WebSockets"], project: "Real-time chat server" },
      { title: "Security & DevOps", topics: ["OWASP top 10", "Docker basics", "CI/CD"], project: "Secure deployed API" },
    ],
    "Data Engineer": [
      { title: "Python & SQL Basics", topics: ["Python fundamentals", "SQL queries", "Data types"], project: "Data cleaning script" },
      { title: "Data Processing", topics: ["Pandas", "NumPy", "Data pipelines"], project: "ETL pipeline" },
      { title: "Databases", topics: ["PostgreSQL", "MongoDB", "Redis"], project: "Multi-DB app" },
      { title: "Big Data Basics", topics: ["Spark basics", "Kafka intro", "Cloud storage"], project: "Data pipeline" },
      { title: "Visualization", topics: ["Matplotlib", "Seaborn", "Dashboards"], project: "Analytics dashboard" },
    ],
    "Data Analyst": [
      { title: "Excel & SQL", topics: ["Advanced Excel", "SQL queries", "Data cleaning"], project: "Sales analysis" },
      { title: "Python for Analysis", topics: ["Pandas", "NumPy", "Jupyter"], project: "Dataset analysis" },
      { title: "Statistics", topics: ["Descriptive stats", "Probability", "Hypothesis testing"], project: "Statistical report" },
      { title: "Visualization", topics: ["Matplotlib", "Tableau basics", "Storytelling with data"], project: "Visual dashboard" },
      { title: "Projects & Portfolio", topics: ["End-to-end analysis", "Presentation skills", "Portfolio"], project: "Capstone analysis" },
    ],
    "DevOps Basics": [
      { title: "Linux & Shell", topics: ["Linux commands", "Shell scripting", "File permissions"], project: "Automation scripts" },
      { title: "Version Control", topics: ["Git advanced", "Branching strategies", "GitHub Actions"], project: "CI pipeline" },
      { title: "Containers", topics: ["Docker", "Docker Compose", "Container registries"], project: "Containerized app" },
      { title: "Cloud Basics", topics: ["AWS/GCP intro", "S3, EC2", "IAM"], project: "Cloud deployment" },
      { title: "Monitoring & Infra", topics: ["Prometheus", "Grafana", "Terraform basics"], project: "Monitored infrastructure" },
    ],
  }

  const plan = trackPlans[track] || trackPlans["Full Stack Developer"]
  const resourceKey = track.toLowerCase().includes("full") ? "fullstack" :
    track.toLowerCase().includes("front") ? "frontend" :
    track.toLowerCase().includes("back") ? "backend" :
    track.toLowerCase().includes("data") ? "data" :
    track.toLowerCase().includes("devops") ? "devops" : "general"

  const resources = FREE_RESOURCES[resourceKey] || FREE_RESOURCES.general
  const weeksPerSection = Math.max(1, Math.round(hoursPerWeek >= 15 ? 1 : hoursPerWeek >= 10 ? 1.5 : 2))

  return plan.map((section, i) => ({
    week: i * weeksPerSection + 1,
    title: section.title,
    topics: section.topics,
    project: section.project,
    resources: [...resources, ...FREE_RESOURCES.general].slice(0, 5),
  }))
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const db = await getDb()
    const roadmap = await db.collection("roadmaps").findOne({ userId })
    return NextResponse.json(roadmap || null)
  } catch {
    return NextResponse.json({ error: "Failed to fetch roadmap" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { track, level, hoursPerWeek, progressUpdate } = await req.json()

    const db = await getDb()

    if (progressUpdate) {
      await db.collection("roadmaps").updateOne(
        { userId },
        { $set: { progressJSON: progressUpdate } }
      )
      return NextResponse.json({ message: "Progress updated" })
    }

    const planJSON = generatePlan(track, level, hoursPerWeek)

    await db.collection("roadmaps").updateOne(
      { userId },
      {
        $set: {
          userId,
          track,
          level,
          hoursPerWeek,
          planJSON,
          progressJSON: {},
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ planJSON })
  } catch {
    return NextResponse.json({ error: "Failed to save roadmap" }, { status: 500 })
  }
}
