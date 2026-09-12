# JobPulse — Autonomous Job Aggregator & Real-Time Match Engine

An end-to-end intelligent career automation engine that aggregates job listings from global job boards, parses candidate resumes, computes multidimensional semantic match scores (TF-IDF + domain heuristics), generates tailored application materials via Gemini AI, and dispatches real-time alerts.

---

## 🌟 Key Capabilities

- **Automated Multi-Source Job Aggregation**: Connects to the Adzuna API and extensible job providers with automatic rate limiting, 60-second caching, and URL normalization.
- **Multidimensional Match Engine**: Computes similarity using tokenized TF-IDF vector math blended with domain-specific keyword weighting (Healthcare IT, Fintech, DevOps, Full-Stack).
- **Interactive Resume & Profile Manager**: Multi-profile support with real-time parsing of technical proficiencies, years of experience, and target roles.
- **AI-Powered Application Toolkit**: Powered by Google Gemini to perform instant Job Description gap analyses and generate customized, tone-adapted cover letters.
- **Real-Time Dispatch & Notification Engine**: Configurable threshold-based Telegram bot alerts and browser notifications when high-match opportunities (e.g. ≥80%) appear.
- **Application Pipeline Tracker**: Interactive Kanban workflow (Discovered, Applied, Interviewing, Offered, Rejected) with application metrics and salary analytics.

---

## 🏗️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│             React 19 + TypeScript + Tailwind           │
│       (Interactive Dashboard, Kanban, Profile Modals)  │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON
┌───────────────────────────▼────────────────────────────┐
│              Node.js + Express (TypeScript)            │
│       (API Gateway, Subprocess Manager, Gemini Proxy)  │
└───────────────────────────┬────────────────────────────┘
                            │ CLI Subprocess Invocation
┌───────────────────────────▼────────────────────────────┐
│               Python NLP & Scoring Engine              │
│       (TF-IDF Vectorizer, Domain Weighting, SQLite)    │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      SQLite Database              Adzuna / External APIs
     (Indexed, Deduplicated)      (Rate-Limited Ingestion)
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts
- **API Server**: Express.js, TypeScript (`tsx` / `esbuild`)
- **Intelligence & NLP**: Python 3 standard library engine, Google Gemini 2.5 Flash
- **Data Persistence**: SQLite 3 with composite unique indexing and deduplication

---

## 💡 System Design & Engineering Decisions (Interview Talking Points)

### 1. Subprocess Execution vs. Dedicated Microservice
- **Current Architecture**: Node.js triggers Python CLI subcommands (`python3 backend/jobpulse_engine.py <action>`).
- **Rationale**: Keeps local execution zero-dependency and self-contained within a single container without needing multiple running daemons or container orchestration during initial deployment.
- **Production Evolution**: In a high-concurrency production setting, the Python engine would run as a persistent asynchronous worker fleet (e.g., FastAPI or Celery backed by Redis/RabbitMQ) consuming ingestion tasks from a queue.

### 2. Hybrid Scoring Algorithm (TF-IDF + Domain Boosting)
- **Challenge**: Pure vector embeddings or TF-IDF can score jobs highly if common technical terms match, even if the domain context (e.g., healthcare compliance like HL7/HIPAA) is missing.
- **Solution**: Combines normalized TF-IDF token frequency overlap with domain keyword boosting (+15–20% weight) and penalty deductions for senior/lead requirement mismatches.

### 3. Aggressive Deduplication & Ingestion Caching
- Eliminates duplicate listings across boards using a normalized SHA-256 fingerprint of `(company_slug + title_slug + location_slug)`.
- Protects API rate limits via a 60-second in-memory / database freshness check before querying upstream external job providers.

---

## 🔒 Security & Privacy Best Practices

- **Zero Hardcoded Secrets**: No API keys or tokens are stored in the codebase or checked into version control.
- **Sanitized PII**: All sample candidate profiles, resumes, and test databases use anonymized demo identities.
- **Explicit Git Exclusions**: `.gitignore` is pre-configured to strictly ignore `*.db`, `*.sqlite`, `.env*`, and Python cache artifacts.

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js 18+ & npm
- Python 3.9+

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd job-pulse

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure any desired API keys:
- `GEMINI_API_KEY`: For AI cover letter generation and gap analysis.
- `ADZUNA_APP_ID` & `ADZUNA_APP_KEY`: Optional, for live global job search.
- `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID`: Optional, for automated push alerts.

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🧹 Repository Clean-up Note (For Fresh Git History)

Before publishing to a public Git repository, ensure your commit history is completely clean:

```bash
# Option A: Initialize a clean git repository
rm -rf .git
git init
git add .
git commit -m "feat: Initial commit of JobPulse job search and matching engine"
git branch -M main
git remote add origin <your-github-url>
git push -u origin main --force
```
