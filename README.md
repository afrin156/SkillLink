# SkillLink – Career Networking Platform

SkillLink is a full-stack career networking platform designed to connect students with verified recruiters. It helps students discover career opportunities and apply for jobs while enabling recruiters to manage applications and connect with potential candidates.

## Features

- **User Authentication:** Secure sign-in and authentication using NextAuth.
- **Role-Based Dashboards:** Separate experiences for students and recruiters.
- **Job Opportunities:** Browse and explore available job opportunities.
- **Job Applications:** Apply for jobs and manage application information.
- **In-App Messaging:** Support communication between platform users.
- **Responsive Interface:** User-friendly interface built with modern web technologies.
- **Cloud Deployment:** AWS infrastructure for hosting and storage, where configured.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Full-stack web framework |
| React.js | User interface |
| TypeScript | Type-safe development |
| MongoDB | Database |
| NextAuth | Authentication |
| AWS EC2 | Application hosting |
| AWS S3 | File storage, where configured |
| Git & GitHub | Version control and collaboration |

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB database
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/afrin156/SkillLink.git
   ```

2. Navigate to the project directory:

   ```bash
   cd SkillLink
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env.local` file in the project root and configure the environment variables required by your application.

   Example:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_authentication_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

   Add other variables required by your actual implementation. Never commit real credentials, API keys, or secrets.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

The exact structure depends on your implementation. A typical Next.js project may contain:

```text
SkillLink/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── models/
├── .env.local
├── package.json
└── README.md
```

## Learning Outcomes

- Building a full-stack web application using Next.js and React.
- Integrating a database with application features.
- Implementing authentication and role-based user experiences.
- Developing job application workflows and messaging functionality.
- Using Git and GitHub to manage project changes.

## Future Improvements

- Advanced job search and filtering.
- Recruiter and student profile enhancements.
- Notifications for application updates.
- Improved accessibility and automated testing.

## Author

**Afrin Nisha N**

- LinkedIn: https://linkedin.com/in/afrin-nisha-zeenath13
- GitHub: https://github.com/afrin156

---

*SkillLink aims to make career networking more accessible by helping students and recruiters connect through one platform.*
