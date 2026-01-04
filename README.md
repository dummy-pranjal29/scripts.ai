# Scripts.AI - Intelligent Code Playground

<div align="center">
  <img src="/hero.svg" alt="Scripts.AI Hero" width="200"/>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

**Create. Iterate. Deploy**

Scripts.AI is a thoughtfully designed code editor that blends intelligence with simplicity. With AI-powered assistance and smooth tooling, it helps developers write, debug, and optimize code efficiently, all in one focused workspace.

[Get Started](#getting-started) • [Features](#features) • [Deploy](#deployment-on-vercel)

</div>

## 🚀 Features

### 🎯 AI-Powered Code Assistance

- **Smart Code Completion**: Get intelligent code suggestions powered by Groq AI
- **Real-time Error Detection**: AI identifies and helps fix coding errors
- **Code Optimization**: Receive suggestions for performance improvements
- **Multi-language Support**: Works with React, Next.js, Express, Vue, Angular, and more

### 💻 Advanced Code Editor

- **Monaco Editor Integration**: Professional VS Code-like editing experience
- **Syntax Highlighting**: Support for 50+ programming languages
- **IntelliSense**: Advanced autocomplete and parameter hints
- **Multi-tab Interface**: Work with multiple files simultaneously
- **File Explorer**: Full project structure navigation

### 🏗️ Live Preview & Development

- **WebContainer Integration**: Run code in isolated browser environments
- **Live Preview**: See changes instantly without manual refresh
- **Terminal Access**: Full command-line interface in the browser
- **Hot Reload**: Automatic preview updates on file changes

### 📊 Project Management

- **Dashboard Overview**: Manage all your projects from one place
- **Project Templates**: Quick start with pre-configured templates
- **Version Control**: Built-in Git integration
- **Collaboration**: Share projects with team members

### 🎨 Modern UI/UX

- **Dark/Light Theme**: Automatic theme switching
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Accessible Interface**: WCAG 2.1 compliant design
- **Smooth Animations**: delightful micro-interactions

## 📸 Screenshots

### Home Page

![Home Page](./screenshots/home-page.png)
_Clean, modern landing page with gradient hero section_

### Dashboard

![Dashboard](./screenshots/dashboard.png)
_Comprehensive project management dashboard with quick actions_

### Code Editor

![Code Editor](./screenshots/code-editor.png)
_Professional code editing interface with AI suggestions_

### AI Assistant in Action

![AI Assistant](./screenshots/ai-assistant.png)
_AI-powered code suggestions and error detection_

### Live Preview

![Live Preview](./screenshots/live-preview.png)
_Real-time preview of your running application_

### File Explorer

![File Explorer](./screenshots/file-explorer.png)
_Intuitive project structure navigation_

### Terminal Integration

![Terminal](./screenshots/terminal.png)
_Full command-line access within the browser_

### Mobile View

![Mobile View](./screenshots/mobile-view.png)
_Responsive design for mobile devices_

## 🛠️ Tech Stack

### Frontend

- **Next.js 16.0** - React framework with App Router
- **TypeScript 5.0** - Type-safe JavaScript
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **Monaco Editor** - Professional code editor
- **WebContainer API** - Secure browser-based environments

### Backend & Database

- **NextAuth.js 5.0** - Authentication solution
- **Prisma 6.19** - Modern database toolkit
- **MongoDB** - NoSQL database
- **Groq SDK** - AI integration for code assistance

### Development Tools

- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing
- **Git Hooks** - Pre-commit checks

## 🏁 Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm, yarn, pnpm, or bun
- MongoDB database (local or cloud)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/scripts.ai.git
   cd scripts.ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:

   ```env
   # Database
   DATABASE_URL="mongodb://localhost:27017/scripts-ai"

   # Authentication (NextAuth)
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # OAuth Providers (Optional)
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # AI Integration
   GROQ_API_KEY="your-groq-api-key"

   # WebContainer (Optional)
   WEBCONTAINER_API_KEY="your-webcontainer-key"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   # or for production:
   npx prisma migrate deploy
   ```

5. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see your application.

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema to database

## 🏗️ Project Structure

```
scripts.ai/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (root)/            # Main application pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── playground/        # Code playground pages
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
├── lib/                   # Utility libraries
├── modules/               # Feature modules
│   ├── ai-chat/          # AI chat functionality
│   ├── auth/              # Authentication module
│   ├── dashboard/         # Dashboard features
│   ├── playground/        # Code playground
│   └── webcontainers/     # WebContainer integration
├── prisma/                # Database schema and migrations
├── public/                # Static assets
└── types/                 # TypeScript type definitions
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/scripts-ai"

# Authentication
NEXTAUTH_SECRET="your-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (Optional but recommended)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Integration (Required for AI features)
GROQ_API_KEY="your-groq-api-key"

# Additional Services
RESEND_API_KEY="your-resend-api-key"        # For emails
UPSTASH_REDIS_REST_URL="your-redis-url"     # For caching
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

### Database Setup

1. **MongoDB Setup**

   - Local: Install MongoDB and create a database named `scripts-ai`
   - Cloud: Use MongoDB Atlas and get the connection string

2. **Prisma Setup**
   ```bash
   npx prisma generate  # Generate Prisma client
   npx prisma db push   # Push schema to database
   ```

### Authentication Setup

1. **GitHub OAuth** (Optional)

   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set callback URL: `http://localhost:3000/api/auth/callback/github`
   - Copy Client ID and Secret to `.env.local`

2. **Google OAuth** (Optional)
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Secret to `.env.local`

## 🚀 Deployment on Vercel

### Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- GitHub repository with your code
- MongoDB Atlas database (recommended for production)

### Step-by-Step Deployment

#### Step 1: Prepare Your Project

1. **Update your `package.json`** with the correct build command:

   ```json
   {
     "scripts": {
       "build": "prisma generate && next build",
       "postbuild": "next-sitemap"
     }
   }
   ```

2. **Add Vercel configuration** (optional but recommended):

   ```bash
   touch vercel.json
   ```

   Add to `vercel.json`:

   ```json
   {
     "buildCommand": "prisma generate && next build",
     "devCommand": "next dev",
     "installCommand": "npm install",
     "framework": "nextjs"
   }
   ```

#### Step 2: Set Up Database

1. **Create MongoDB Atlas account** if you haven't already
2. **Create a new cluster** and database
3. **Get your connection string** from Atlas dashboard
4. **Add your IP** to the whitelist (0.0.0.0/0 for Vercel)

#### Step 3: Deploy to Vercel

1. **Connect your GitHub repository to Vercel**

   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select your `scripts.ai` repository

2. **Configure Project Settings**

   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `prisma generate && next build`
   - **Output Directory**: `.next`

3. **Add Environment Variables**
   Go to Settings > Environment Variables and add:

   ```
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/scripts-ai
   NEXTAUTH_SECRET=your-random-secret-key
   NEXTAUTH_URL=https://your-app-name.vercel.app
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GROQ_API_KEY=your-groq-api-key
   ```

4. **Generate NEXTAUTH_SECRET**

   ```bash
   openssl rand -base64 32
   ```

   Copy the output as your NEXTAUTH_SECRET

5. **Deploy!**
   Click "Deploy" and wait for the build to complete

#### Step 4: Post-Deployment Setup

1. **Update OAuth Redirect URLs**

   - GitHub: Update callback URL to `https://your-app-name.vercel.app/api/auth/callback/github`
   - Google: Update authorized redirect URI to `https://your-app-name.vercel.app/api/auth/callback/google`

2. **Set Up Production Database**

   ```bash
   # Run database migrations on production
   npx prisma migrate deploy
   ```

3. **Verify Deployment**
   - Visit your deployed app
   - Test authentication
   - Create a test playground
   - Verify AI features are working

#### Step 5: Custom Domain (Optional)

1. **Add Custom Domain**

   - Go to Vercel dashboard > Settings > Domains
   - Add your custom domain name
   - Configure DNS records as instructed by Vercel

2. **Update Environment Variables**
   - Update `NEXTAUTH_URL` to your custom domain
   - Update OAuth redirect URLs to use your custom domain

#### Step 6: Monitor and Optimize

1. **Set Up Analytics**

   - Vercel Analytics (built-in)
   - Google Analytics (optional)

2. **Performance Optimization**

   - Enable Edge Functions where possible
   - Optimize images and assets
   - Set up caching strategies

3. **Monitoring**
   - Set up error tracking (Sentry, etc.)
   - Monitor database performance
   - Set up uptime monitoring

### Troubleshooting Common Issues

#### Build Issues

- **Prisma Generation Error**: Ensure `DATABASE_URL` is correctly set
- **Import Errors**: Check all imports are using correct paths
- **TypeScript Errors**: Run `npm run lint` locally to catch issues

#### Runtime Issues

- **Authentication Fails**: Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- **Database Connection**: Verify MongoDB connection string and IP whitelist
- **AI Features Not Working**: Check `GROQ_API_KEY` is valid and has credits

#### Performance Issues

- **Slow Builds**: Enable caching in Vercel settings
- **Large Bundle Size**: Analyze with `@next/bundle-analyzer`
- **Database Slow**: Add indexes and optimize queries

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Prisma](https://www.prisma.io/) - Next-generation Node.js and TypeScript ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - The code editor that powers VS Code
- [WebContainer API](https://webcontainers.io/) - Secure, in-browser Node.js runtime
- [Groq](https://groq.com/) - Fast AI inference for LLMs

## 📞 Support

- 📧 Email: support@scripts.ai
- 💬 Discord: [Join our community](https://discord.gg/scripts-ai)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/scripts.ai/issues)
- 📖 Documentation: [docs.scripts.ai](https://docs.scripts.ai)

---

<div align="center">
  Made with ❤️ by the Scripts.AI Team
  
  [⭐ Star this repo](https://github.com/your-username/scripts.ai) • [🐛 Report issues](https://github.com/your-username/scripts.ai/issues)
</div>
