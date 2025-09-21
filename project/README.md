# 🤖 Chatbot Platform

A modern, scalable chatbot platform built with React, Express.js, and PostgreSQL. Create and manage AI-powered chatbots with custom personalities and system prompts.

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication with registration and login
- **Project Management**: Create, edit, and delete chatbot projects
- **Real-time Chat**: Interactive chat interface with AI responses
- **Custom System Prompts**: Configure unique personalities for each chatbot
- **Responsive Design**: Beautiful, mobile-first UI with Tailwind CSS
- **Database Integration**: PostgreSQL with Prisma ORM for data persistence
- **LLM Integration**: Support for OpenAI and OpenRouter APIs
- **File Upload**: Optional file management with OpenAI Files API

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls
- **React Hook Form** for form handling

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Prisma ORM** for database management
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

### External APIs
- **OpenAI API** for AI responses
- **OpenRouter API** (alternative)
- **OpenAI Files API** for file uploads

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **PostgreSQL** database (local or cloud like Neon)
- **OpenAI API Key** or **OpenRouter API Key**
- **Git** for version control

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/shaiksuhail01/chatbot-platform.git
cd project
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 4. Environment Configuration

#### Backend Environment (.env in server folder)
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration:
```env
# Database (use Neon or local PostgreSQL)
DATABASE_URL="postgresql://username:password@host:5432/database_name"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-here"

# LLM API Keys (you can use both for redundancy and fallback)
OPENAI_API_KEY="sk-your-openai-api-key"

OPENROUTER_API_KEY="sk-or-your-openrouter-key"

# Frontend URL (for CORS and OpenRouter)
FRONTEND_URL="http://localhost:5173"

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 5. Database Setup
```bash
cd server

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Optional: Open Prisma Studio to view data
npm run db:studio
```

### 6. Start the Application

#### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev:full
```

#### Option 2: Run Separately
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Project Endpoints
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Chat Endpoints
- `POST /api/chat/projects/:projectId/chats` - Create new chat
- `GET /api/chat/chats/:chatId/messages` - Get chat messages
- `POST /api/chat/chats/:chatId/messages` - Send message

### File Endpoints
- `POST /api/files/projects/:projectId/upload` - Upload files to a project (supports multiple files, max 10).
- `GET /api/files/projects/:projectId/files` - Get all files for a project
- `DELETE /api/files/:fileId` - Delete a file by its ID

## 🏗 Architecture

```
Frontend (React + TypeScript)
├── Authentication System
├── Project Dashboard
├── Chat Interface
└── UI Components

Backend (Express.js)
├── Authentication Routes
├── Project Management
├── Chat & Messaging
├── LLM Integration
└── Database Layer

Database (PostgreSQL + Prisma)
├── Users Table
├── Projects Table
├── Chats Table
├── Messages Table
└── Files Table
```

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** with bcryptjs
- **Input Validation** on all endpoints
- **CORS Configuration** for secure cross-origin requests
- **SQL Injection Protection** via Prisma ORM
- **Rate Limiting** ready for production


## 🎯 Future Enhancements

- [ ] Real-time messaging with WebSockets
- [ ] File upload and processing
- [ ] Chat history export
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Voice chat integration
- [ ] Custom themes and branding

---

Built with ❤️ for scalable AI chatbot solutions