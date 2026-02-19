# OpenClaw — Legal AI Assistant

A full-stack legal AI assistant for anyone — lawyers and members of the public alike — to manage legal cases, upload documents, and chat with Claude for instant legal analysis.

![Stack](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi) ![Stack](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react) ![Stack](https://img.shields.io/badge/Claude-Anthropic-blueviolet?style=flat)

## Features

- **Dashboard** — case overview with stats (total, open, in progress, closed)
- **Case management** — any registered user can create and manage cases
- **AI chat** — ask legal questions per case, powered by Claude; full history persisted per case
- **Document analysis** — upload PDFs/DOCX/TXT and get AI-generated summaries and key points
- **Case status** — lawyers and admins can update case status (Open → In Progress → Closed)
- **Profile** — update your name, email, and password from the app
- **Auth** — JWT-based login; all new accounts default to the client role
- **Dark UI** — modern dark theme with indigo accents

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, Anthropic SDK |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v3, TanStack Query v5, Zustand |
| Auth | JWT (python-jose), bcrypt |
| Infrastructure | Docker Compose |

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── routers/       # auth, cases, chat, documents, users
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # business logic + Claude integration
│   │   └── main.py
│   └── alembic/           # database migrations
├── frontend/
│   └── src/
│       ├── api/           # Axios API layer
│       ├── components/    # UI components
│       ├── pages/         # Login, Register, Dashboard, CaseDetail, Profile
│       └── store/         # Zustand auth store
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### 1. Clone

```bash
git clone https://github.com/TP07-py/openclaw.git
cd openclaw
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-...
SECRET_KEY=change-me-in-production
```

### 3. Start the backend

```bash
docker compose up -d
```

This starts PostgreSQL and the FastAPI server. The API will be available at `http://localhost:8000`.

Run migrations (first time only):

```bash
docker compose exec api alembic upgrade head
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

## Usage

1. **Register** — create an account (name, email, password — no role selector needed)
2. **Dashboard** — see all your cases and stats at a glance
3. **Create a case** — click "+ New Case" in the sidebar
4. **Chat** — ask legal questions in the Chat tab; Claude responds with markdown-formatted analysis
5. **Documents** — upload a PDF/DOCX/TXT in the Documents tab, then click **Analyze** to get a summary and key points
6. **Profile** — click your name in the sidebar footer to update account details

## API

Interactive docs at **http://localhost:8000/docs**

Key endpoints:

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register (defaults to client role) |
| `POST` | `/auth/login` | Get JWT token |
| `GET/POST` | `/cases` | List / create cases |
| `POST` | `/cases/{id}/chat` | Send message, get AI reply |
| `POST` | `/cases/{id}/documents/upload` | Upload document |
| `POST` | `/cases/{id}/documents/{doc_id}/analyze` | AI analysis |

## License

MIT
