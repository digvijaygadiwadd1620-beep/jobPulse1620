# JobPulse

A full-stack job discovery, match ranking, and application tracking platform. JobPulse ingests job postings from live APIs, analyzes candidate resumes, calculates multidimensional match scores using tokenized TF-IDF vector similarity and domain-specific weighting, and dispatches automated alerts via Telegram.

---

## Features

- **Automated Job Ingestion**: Connects to the Adzuna API with request deduplication, rate limiting, and database caching.
- **Hybrid Scoring Algorithm**: Blends normalized TF-IDF cosine similarity with domain-specific keyword boosting (Healthcare, Fintech, QA Automation, DevOps) and experience level alignment.
- **Resume Parsing & Skill Extraction**: Supports PDF, DOCX, and raw text resume uploads. Extracts core competencies, years of experience, and domain focus.
- **Application Kanban Tracker**: Drag-and-drop pipeline (Discovered, Applied, Interviewing, Offer, Rejected) with status updates and note logging.
- **AI Application Tools**: Tailors cover letters, generates ATS optimization suggestions, predicts role-specific interview questions, and provides company research summaries.
- **Real-Time Telegram Alerts**: Configurable score threshold alerts dispatched directly to Telegram via bot webhook.

---

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite                      │
│      (Tailwind CSS, Modular Modals, Kanban Board)      │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON
┌───────────────────────────▼────────────────────────────┐
│              Node.js + Express (TypeScript)            │
│       (API Gateway, Auth Middleware, Subprocess Exec)  │
└───────────────────────────┬────────────────────────────┘
                            │ CLI Subprocess Invocation
┌───────────────────────────▼────────────────────────────┐
│               Python NLP & Scoring Engine              │
│       (TF-IDF Vectorizer, Domain Weighting, SQLite)    │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
       SQLite Database              Adzuna API
    (Indexed, Deduplicated)     (Live Job Aggregation)
```

### Components

1. **Frontend (`/src`)**:
   - Built with React 19, TypeScript, and Tailwind CSS.
   - Modular hook architecture (`useJobMatches`, `useModalState`) decoupling API communications and modal lifecycle from UI rendering.
   - Sub-component composition for modals (`TelegramSettingsSection`, `AdzunaSettingsSection`, `ScannerThresholdSection`).

2. **Backend Gateway (`server.ts`)**:
   - Express server written in TypeScript, compiled with `esbuild` for production.
   - API key authentication middleware (`requireAuth`) securing mutating endpoints.
   - CORS validation against configured origins.
   - Subprocess execution wrapper orchestrating the Python engine with timeouts and error handling.

3. **NLP & Scoring Engine (`/backend`)**:
   - Lightweight Python 3 implementation with zero external machine learning dependencies.
   - Tokenization, stop-word filtering, n-gram extraction, and TF-IDF vector representation.
   - Domain scoring heuristics providing context-aware relevance for specialized industries.
   - SQLite persistence layer with composite unique indices preventing duplicate job ingestion.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/jobpulse.git
cd jobpulse

# Install dependencies
npm install
```

### Configuration

Copy the sample environment file:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Web server port (defaults to 3000) | No |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | No |
| `JOBPULSE_API_KEY` | Optional secret key for securing `/api/*` mutating endpoints | No |
| `GEMINI_API_KEY` | Google Gemini API key for AI generation features | No (falls back to templates) |
| `ADZUNA_APP_ID` | Adzuna job search application ID | No |
| `ADZUNA_APP_KEY` | Adzuna job search API key | No |

### Development

Start the development server:

```bash
npm run dev
```

The app will be accessible at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

---

## Testing

The project includes unit and integration tests across both the TypeScript frontend and the Python NLP engine:

```bash
# Run all tests (frontend + backend)
npm test

# Run frontend unit tests (Vitest)
npm run test:frontend

# Run Python NLP engine tests
npm run test:backend

# Run TypeScript typecheck
npm run lint
```

---

## License

MIT
