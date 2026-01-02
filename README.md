scripts.ai 🚀

AI-powered cloud IDE for writing, fixing, and understanding code

scripts.ai is a cloud-native AI development platform that enables developers to generate, refactor, debug, and explain code in real time. It blends modern web technologies with AI-assisted workflows to help individuals and teams ship reliable, scalable software faster.

Built for developers who care about clean architecture, fast feedback loops, and real-world productivity.

✨ Features

AI Code Generation
Generate high-quality code snippets, components, and logic from natural language prompts.

Smart Refactoring & Debugging
Improve code structure, readability, and performance while catching logical and runtime issues early.

Real-Time Code Explanation
Instantly understand unfamiliar codebases with contextual explanations and breakdowns.

In-Browser Execution Environment
Run and experiment with code directly in the browser using isolated WebContainers.

Playground-Based Workflow
Create, manage, and star multiple coding playgrounds for experiments, learning, or rapid prototyping.

Secure Authentication & User Isolation
Each user operates in a secure, isolated environment with proper access control.

Production-Grade SaaS Architecture
Designed with scalability, performance, and maintainability in mind.

🧠 Tech Stack
Frontend

TypeScript

Next.js (App Router)

React

Tailwind CSS

React Hooks for state management

Backend

Node.js

Express / Next.js API Routes

Prisma ORM

MongoDB

Infrastructure & Tooling

WebContainers (browser-based execution)

Docker (environment consistency)

Vercel (deployment and edge optimization)

AI & Platform

Modern AI APIs for code generation, debugging, and explanation

Prompt orchestration and response normalization

Secure API handling and rate limiting

🏗️ Architecture Overview
Client (Next.js + React)
↓
API Layer (Next.js / Node.js)
↓
AI Services & Business Logic
↓
Database (MongoDB via Prisma)
↓
WebContainers (Sandboxed Runtime)

Clean separation of concerns

API-driven architecture

Stateless backend for scalable deployments

Secure sandboxed execution for user code

📦 Installation & Setup
Prerequisites

Node.js ≥ 18

npm / pnpm / yarn

MongoDB instance (local or cloud)

AI API credentials

Clone the Repository
git clone https://github.com/your-username/scripts.ai.git
cd scripts.ai

Install Dependencies
npm install

Environment Variables

Create a .env file in the root directory:

DATABASE_URL=your_mongodb_url
AI_API_KEY=your_ai_api_key
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=http://localhost:3000

Run the Application Locally
npm run dev

Visit:

http://localhost:3000

🔐 Security & Isolation

User-specific playground isolation

Secure authentication and authorization flows

Server-side validation for all requests

No direct execution on host machine

Fully sandboxed runtime via WebContainers

📈 Use Cases

Rapid prototyping

Learning new frameworks or languages

Debugging complex logic

Code reviews and refactoring

AI-assisted development workflows

Interview preparation and experimentation

🛠️ Roadmap

Multi-language runtime support

Team collaboration and shared playgrounds

Versioned playground history

Custom AI model selection

Usage analytics and developer insights

Plugin and extension ecosystem

🤝 Contributing

Contributions are welcome and encouraged.

# 1. Fork the repository

# 2. Create a feature branch

git checkout -b feature/your-feature-name

# 3. Commit your changes

git commit -m "Add meaningful feature"

# 4. Push and open a pull request

git push origin feature/your-feature-name

Quality over quantity. Architecture over hacks.

📄 License

MIT License
Free to use, modify, and build upon.

🧩 Philosophy

scripts.ai is built with the belief that AI should amplify developer intuition, not replace it.

If code is the language of machines, scripts.ai exists to make it more human.
