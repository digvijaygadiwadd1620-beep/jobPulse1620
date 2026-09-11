#!/usr/bin/env python3
"""
JobPulse Core Engine:
- SQLite3 persistent storage for Resumes, Jobs, Matches, and Scan Logs
- TF-IDF Vector Space text similarity calculation
- Skill Extraction and Keyword Bonus matching
- Domain boost (Healthcare, Fintech, Cloud/DevOps, QA/Testing, AI/ML)
- Telegram Notification Dispatcher
- Public & Regional Job Feeds Aggregator (India & Global)
"""

import sys
import os
import json
import sqlite3
import math
import re
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "jobpulse.db")

# Stopwords for text processing
STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
    'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
    'between', 'both', 'but', 'by', 'could', 'did', 'do', 'does', 'doing', 'down',
    'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having',
    'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if',
    'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my',
    'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or',
    'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she',
    'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
    'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to',
    'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
    'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours',
    'yourself', 'yourselves', 'will', 'can', 'must', 'experience', 'working', 'work',
    'years', 'role', 'team', 'company', 'candidate', 'responsibilities', 'requirements'
}

CANONICAL_SKILLS = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang", "rust",
    "php", "ruby", "sql", "html", "css", "kotlin", "swift", "scala",
    # Frontend
    "react", "angular", "vue", "next.js", "tailwind", "redux", "webpack", "vite", "html5", "css3",
    # Backend
    "node.js", "nodejs", "express", "django", "fastapi", "flask", "spring boot", "spring",
    "graphql", "rest api", "microservices", "grpc", "kafka", "rabbitmq",
    # Databases
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
    "cassandra", "dynamodb", "oracle", "prisma",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "k8s", "terraform", "ci/cd", "jenkins",
    "git", "github actions", "ansible", "helm", "linux", "prometheus", "grafana",
    # QA & Testing
    "selenium", "cypress", "playwright", "testng", "junit", "pytest", "postman", "jmeter",
    "cucumber", "bdd", "manual testing", "automation testing", "api testing", "appium",
    "regression testing", "test automation", "qa", "jira",
    # Data & AI
    "machine learning", "deep learning", "nlp", "pytorch", "tensorflow", "pandas", "numpy",
    "scikit-learn", "data analysis", "power bi", "tableau", "spark", "hadoop", "airflow",
    "generative ai", "llm", "rag", "langchain", "gemini",
    # Healthcare & Domain
    "healthcare", "epic", "cerner", "hl7", "fhir", "hipaa", "dicom", "clinical data",
    "medtech", "ehr", "emr", "telehealth",
    # Fintech
    "fintech", "pci-dss", "payment gateway", "trading", "banking", "blockchain", "cryptography"
]

DOMAIN_KEYWORDS = {
    "healthcare": ["healthcare", "hospital", "clinical", "hipaa", "fhir", "hl7", "epic", "cerner", "medical", "patient", "pharma"],
    "fintech": ["fintech", "banking", "payments", "trading", "crypto", "blockchain", "pci-dss", "financial", "ledger"],
    "qa_testing": ["qa", "testing", "selenium", "cypress", "test automation", "sdet", "testng", "playwright", "quality assurance"],
    "cloud_devops": ["devops", "cloud", "aws", "kubernetes", "docker", "ci/cd", "infrastructure", "terraform", "sre", "azure", "gcp"],
    "ai_data": ["machine learning", "ai", "data science", "nlp", "llm", "deep learning", "analytics", "computer vision", "data engineer", "data analyst"],
    "fullstack": ["full stack", "fullstack", "react", "frontend", "next.js", "node.js", "typescript", "vue", "web developer"],
    "software_engineering": ["software engineer", "software developer", "backend engineer", "python developer", "java developer", "golang", "microservices"]
}

def extract_text_from_docx_base64(raw_b64):
    """Extract clean readable text from docx bytes without external dependencies."""
    try:
        import base64, io, zipfile, xml.etree.ElementTree as ET
        raw_bytes = base64.b64decode(raw_b64)
        with zipfile.ZipFile(io.BytesIO(raw_bytes)) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            paragraphs = []
            for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error extracting DOCX text: {e}"

def extract_text_from_pdf_base64(raw_b64):
    """Fallback stream and string extractor for raw PDF bytes in Python."""
    try:
        import base64, zlib, re
        pdf_bytes = base64.b64decode(raw_b64)
        text_chunks = []
        for match in re.finditer(rb'stream\r?\n(.*?)\r?\nendstream', pdf_bytes, re.DOTALL):
            stream_data = match.group(1)
            decomp = None
            try:
                decomp = zlib.decompress(stream_data)
            except:
                try:
                    decomp = zlib.decompress(stream_data, -15)
                except:
                    continue
            if decomp:
                tj_matches = re.findall(rb'\((.*?)\)\s*Tj', decomp)
                for m in tj_matches:
                    try:
                        text_chunks.append(m.decode('utf-8', errors='ignore'))
                    except:
                        pass
                tj_array = re.findall(rb'\[(.*?)\]\s*TJ', decomp)
                for arr in tj_array:
                    inner_strings = re.findall(rb'\((.*?)\)', arr)
                    try:
                        text_chunks.append(b''.join(inner_strings).decode('utf-8', errors='ignore'))
                    except:
                        pass
        return ' '.join(text_chunks)
    except Exception as e:
        return ""

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA busy_timeout = 30000;")
    except Exception as e:
        pass
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        target_title TEXT NOT NULL,
        domain TEXT,
        skills_json TEXT,
        raw_text TEXT,
        years_experience INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT NOT NULL,
        country TEXT NOT NULL,
        city TEXT NOT NULL,
        is_remote INTEGER DEFAULT 0,
        description TEXT NOT NULL,
        url TEXT,
        source TEXT NOT NULL,
        salary_min INTEGER,
        salary_max INTEGER,
        salary_currency TEXT,
        skills_json TEXT,
        domain TEXT,
        posted_at TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        resume_id TEXT NOT NULL,
        total_score INTEGER NOT NULL,
        tfidf_score INTEGER NOT NULL,
        skill_bonus INTEGER NOT NULL,
        domain_boost INTEGER NOT NULL,
        matched_skills_json TEXT,
        missing_skills_json TEXT,
        status TEXT NOT NULL DEFAULT 'Discovered', -- 'Discovered', 'Applied', 'Interview', 'Offer', 'Rejected'
        notes TEXT DEFAULT '',
        interview_date TEXT,
        salary_offered TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(job_id) REFERENCES jobs(id),
        FOREIGN KEY(resume_id) REFERENCES resumes(id),
        UNIQUE(job_id, resume_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scan_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        jobs_found INTEGER NOT NULL,
        jobs_matched INTEGER NOT NULL,
        top_score INTEGER NOT NULL,
        top_role TEXT,
        alert_sent INTEGER DEFAULT 0
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alert_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        telegram_bot_token TEXT DEFAULT '',
        telegram_chat_id TEXT DEFAULT '',
        min_score_alert INTEGER DEFAULT 80,
        auto_scan_enabled INTEGER DEFAULT 1,
        scan_interval_minutes INTEGER DEFAULT 5,
        desktop_notifications INTEGER DEFAULT 1,
        adzuna_app_id TEXT DEFAULT '066adfaf',
        adzuna_app_key TEXT DEFAULT '9d8303ee9e09eea727a92c1281addba8'
    );
    """)

    # Alter table if needed for existing DB
    try:
        cursor.execute("ALTER TABLE alert_config ADD COLUMN adzuna_app_id TEXT DEFAULT '066adfaf';")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE alert_config ADD COLUMN adzuna_app_key TEXT DEFAULT '9d8303ee9e09eea727a92c1281addba8';")
    except:
        pass

    cursor.execute("""
    INSERT OR IGNORE INTO alert_config (id, min_score_alert, auto_scan_enabled, scan_interval_minutes, desktop_notifications, adzuna_app_id, adzuna_app_key)
    VALUES (1, 80, 1, 5, 1, '066adfaf', '9d8303ee9e09eea727a92c1281addba8');
    """)

    cursor.execute("""
    UPDATE alert_config
    SET adzuna_app_id = CASE WHEN adzuna_app_id IS NULL OR adzuna_app_id = '' THEN '066adfaf' ELSE adzuna_app_id END,
        adzuna_app_key = CASE WHEN adzuna_app_key IS NULL OR adzuna_app_key = '' THEN '9d8303ee9e09eea727a92c1281addba8' ELSE adzuna_app_key END
    WHERE id = 1;
    """)

    conn.commit()
    conn.close()

def tokenize(text):
    if not text:
        return []
    cleaned = re.sub(r'[^a-zA-Z0-9+#\.\s]', ' ', text.lower())
    tokens = [t.strip() for t in cleaned.split() if len(t.strip()) > 1]
    return [t for t in tokens if t not in STOP_WORDS]

def extract_skills_from_text(text):
    if not text:
        return []
    text_lower = text.lower()
    found = set()
    for skill in CANONICAL_SKILLS:
        pattern = r'(?:\b|(?<=[^a-zA-Z0-9]))' + re.escape(skill) + r'(?:\b|(?=[^a-zA-Z0-9]))'
        if re.search(pattern, text_lower):
            found.add(skill)
    return sorted(list(found))

def calculate_tfidf(resume_text, job_text, corpus_docs=None):
    resume_tokens = tokenize(resume_text)
    job_tokens = tokenize(job_text)
    
    if not resume_tokens or not job_tokens:
        return 0.0

    docs = [resume_tokens, job_tokens]
    if corpus_docs:
        docs.extend([tokenize(d) for d in corpus_docs[:20]])
    
    vocab = set(resume_tokens) | set(job_tokens)
    N = len(docs)

    # Document frequencies
    df = {}
    for term in vocab:
        df[term] = sum(1 for d in docs if term in d)

    def compute_vec(tokens):
        tf = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        
        vec = {}
        for t in tf:
            # Sublinear tf * idf
            idf = math.log((1 + N) / (1 + df.get(t, 1))) + 1.0
            vec[t] = (1 + math.log(tf[t])) * idf
        return vec

    v1 = compute_vec(resume_tokens)
    v2 = compute_vec(job_tokens)

    # Cosine similarity
    intersection = set(v1.keys()) & set(v2.keys())
    dot = sum(v1[t] * v2[t] for t in intersection)

    norm1 = math.sqrt(sum(val * val for val in v1.values()))
    norm2 = math.sqrt(sum(val * val for val in v2.values()))

    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    sim = dot / (norm1 * norm2)
    return min(1.0, max(0.0, sim))

def score_job_match(resume_skills, resume_domain, resume_text, job_skills, job_domain, job_text, corpus_samples=None, resume_title=None, job_title=None):
    # 1. TF-IDF Text Similarity (0 to 40 pts)
    tfidf_sim = calculate_tfidf(resume_text, job_text, corpus_samples)
    tfidf_pts = round(tfidf_sim * 40)

    # 2. Skill Overlap Bonus (0 to 45 pts)
    resume_skills_set = set(s.lower() for s in resume_skills)
    job_skills_set = set(s.lower() for s in job_skills)

    matched = sorted(list(resume_skills_set & job_skills_set))
    missing = sorted(list(job_skills_set - resume_skills_set))

    if job_skills_set:
        skill_ratio = len(matched) / len(job_skills_set)
        # Scaled skill points
        skill_pts = round(skill_ratio * 45)
    else:
        skill_pts = 25

    # 3. Domain Boost (0 to 15 pts)
    domain_pts = 0
    job_text_lower = (job_text + " " + (job_domain or "")).lower()
    resume_domain_clean = (resume_domain or "").lower()

    for domain_name, kw_list in DOMAIN_KEYWORDS.items():
        domain_match_count = sum(1 for kw in kw_list if kw in job_text_lower)
        resume_has_domain = any(kw in (resume_text.lower() + " " + resume_domain_clean) for kw in kw_list)
        
        if domain_match_count >= 2 and resume_has_domain:
            domain_pts = min(15, 10 + (domain_match_count * 2))
            break
        elif domain_match_count > 0 and resume_has_domain:
            domain_pts = max(domain_pts, 8)
        elif resume_has_domain:
            domain_pts = max(domain_pts, 4)

    # 4. Generalized Title alignment bonus (0 to 10 pts)
    title_bonus = 0
    if resume_title and job_title:
        r_toks = set(tokenize(resume_title))
        j_toks = set(tokenize(job_title))
        fluff = {"and", "or", "in", "the", "for", "with", "a", "an", "at", "to", "of", "engineer", "developer", "lead", "senior", "staff", "junior", "specialist"}
        meaningful_overlap = (r_toks & j_toks) - fluff
        if meaningful_overlap:
            title_bonus = min(10, 4 + len(meaningful_overlap) * 3)
        elif r_toks & j_toks:
            title_bonus = 3
    elif any(word in job_text_lower for word in ["qa", "tester", "sdet", "test engineer", "automation"]) and \
       any(word in resume_domain_clean or word in resume_text.lower() for word in ["qa", "tester", "sdet", "test engineer"]):
        title_bonus = 4

    # 5. Synergy bonus for exceptional skill alignment (>75% skills matched)
    synergy_bonus = 0
    if job_skills_set and (len(matched) / len(job_skills_set)) >= 0.75:
        synergy_bonus = 16
    elif job_skills_set and (len(matched) / len(job_skills_set)) >= 0.5:
        synergy_bonus = 8

    total = tfidf_pts + skill_pts + domain_pts + title_bonus + synergy_bonus
    final_score = min(98, max(25, total))

    return {
        "total_score": final_score,
        "tfidf_score": tfidf_pts,
        "skill_bonus": skill_pts + synergy_bonus,
        "domain_boost": domain_pts + title_bonus,
        "matched_skills": matched,
        "missing_skills": missing
    }

def seed_sample_jobs():
    """Seed comprehensive realistic live jobs across India & Global tech centers."""
    jobs_data = [
        {
            "id": "job-gl-pune-01",
            "title": "QA Test Engineer (Automation & Healthcare)",
            "company": "GlobalLogic (Hitachi)",
            "location": "Pune, Maharashtra, India",
            "country": "India",
            "city": "Pune",
            "is_remote": 0,
            "description": "GlobalLogic is looking for an experienced QA Test Engineer with deep expertise in Selenium, Java, Cypress, and Healthcare clinical workflow validation (HL7 / FHIR / HIPAA). You will design automated regression suites, perform API testing with Postman and REST-assured, and ensure zero-defect software for leading US health systems.",
            "url": "https://careers.globallogic.com/jobs/qa-test-engineer-pune",
            "source": "JobsPipe",
            "salary_min": 1400000,
            "salary_max": 2200000,
            "salary_currency": "INR",
            "skills": ["selenium", "java", "cypress", "postman", "api testing", "healthcare", "hl7", "hipaa", "jira", "automation testing"],
            "domain": "healthcare",
            "posted_at": "2026-09-07T06:30:00Z"
        },
        {
            "id": "job-wipro-pune-02",
            "title": "Senior SDET & Automation Architect",
            "company": "Wipro Digital",
            "location": "Hinjewadi, Pune, India",
            "country": "India",
            "city": "Pune",
            "is_remote": 0,
            "description": "Lead automated test architecture using Playwright, Python, and PyTest with CI/CD integration via Docker and GitHub Actions. Experience with performance testing using JMeter and healthcare domain compliance is a huge advantage.",
            "url": "https://careers.wipro.com/jobs/sdet-pune",
            "source": "Adzuna",
            "salary_min": 1800000,
            "salary_max": 2800000,
            "salary_currency": "INR",
            "skills": ["python", "playwright", "pytest", "docker", "ci/cd", "selenium", "jmeter", "automation testing"],
            "domain": "qa_testing",
            "posted_at": "2026-09-07T05:15:00Z"
        },
        {
            "id": "job-optum-blr-03",
            "title": "Healthcare QA Automation Lead",
            "company": "Optum (UnitedHealth Group)",
            "location": "Bengaluru, Karnataka, India",
            "country": "India",
            "city": "Bangalore",
            "is_remote": 1,
            "description": "Drive quality engineering for UnitedHealth core patient portal. Requirements: 4+ years in Test Automation using Cypress, Selenium, Postman, Cucumber BDD, and Healthcare standards including EHR, FHIR, and HIPAA compliance.",
            "url": "https://careers.unitedhealthgroup.com/jobs/qa-lead-blr",
            "source": "JobsPipe",
            "salary_min": 2000000,
            "salary_max": 3200000,
            "salary_currency": "INR",
            "skills": ["selenium", "cypress", "cucumber", "bdd", "postman", "healthcare", "fhir", "hipaa", "api testing", "sql"],
            "domain": "healthcare",
            "posted_at": "2026-09-07T07:10:00Z"
        },
        {
            "id": "job-tcs-hyd-04",
            "title": "Full Stack Engineer (React + Node.js)",
            "company": "Tata Consultancy Services",
            "location": "HITEC City, Hyderabad, India",
            "country": "India",
            "city": "Hyderabad",
            "is_remote": 0,
            "description": "TCS Interactive is seeking a Full Stack Developer proficient in React, TypeScript, Node.js, Express, and PostgreSQL. Experience building responsive web applications, managing state with Redux or Zustand, and container deployment on AWS.",
            "url": "https://careers.tcs.com/jobs/fullstack-hyd",
            "source": "JobsPipe",
            "salary_min": 1200000,
            "salary_max": 2000000,
            "salary_currency": "INR",
            "skills": ["react", "typescript", "node.js", "express", "postgresql", "aws", "docker", "rest api"],
            "domain": "fullstack",
            "posted_at": "2026-09-07T04:45:00Z"
        },
        {
            "id": "job-ms-blr-05",
            "title": "Senior Cloud DevOps & Kubernetes Engineer",
            "company": "Microsoft India R&D",
            "location": "Bengaluru, India",
            "country": "India",
            "city": "Bangalore",
            "is_remote": 1,
            "description": "Work on hyperscale Azure infrastructure. Strong hands-on knowledge in Kubernetes (K8s), Terraform, Linux internals, Docker, Prometheus, Grafana, and CI/CD automation pipelines. Python or Go scripting required.",
            "url": "https://careers.microsoft.com/jobs/cloud-devops-blr",
            "source": "LinkedIn",
            "salary_min": 3500000,
            "salary_max": 5500000,
            "salary_currency": "INR",
            "skills": ["kubernetes", "docker", "terraform", "azure", "linux", "ci/cd", "prometheus", "python", "go"],
            "domain": "cloud_devops",
            "posted_at": "2026-09-07T08:00:00Z"
        },
        {
            "id": "job-stripe-us-06",
            "title": "Staff Software Engineer - Financial Infrastructure",
            "company": "Stripe",
            "location": "San Francisco, CA, USA",
            "country": "USA",
            "city": "San Francisco",
            "is_remote": 1,
            "description": "Build high-throughput, low-latency financial ledgers. We need deep proficiency with distributed systems, Ruby or Go, PostgreSQL, Redis, and high security PCI-DSS standards.",
            "url": "https://stripe.com/jobs/staff-swe-sf",
            "source": "Adzuna",
            "salary_min": 190000,
            "salary_max": 260000,
            "salary_currency": "USD",
            "skills": ["go", "ruby", "distributed systems", "postgresql", "redis", "fintech", "pci-dss", "microservices"],
            "domain": "fintech",
            "posted_at": "2026-09-07T03:00:00Z"
        },
        {
            "id": "job-revolut-lon-07",
            "title": "Lead Backend Engineer (Python & Microservices)",
            "company": "Revolut",
            "location": "London, United Kingdom",
            "country": "UK",
            "city": "London",
            "is_remote": 1,
            "description": "Join Europe's fastest growing fintech bank. Build real-time trading engines using Python (FastAPI/asyncio), PostgreSQL, Kafka, and Docker. Experience in banking regulations and automated testing with PyTest.",
            "url": "https://revolut.com/careers/lead-backend-london",
            "source": "JobsPipe",
            "salary_min": 95000,
            "salary_max": 140000,
            "salary_currency": "GBP",
            "skills": ["python", "fastapi", "postgresql", "kafka", "docker", "pytest", "fintech", "rest api"],
            "domain": "fintech",
            "posted_at": "2026-09-06T20:30:00Z"
        },
        {
            "id": "job-zalando-ber-08",
            "title": "Senior Frontend Developer (React/TypeScript)",
            "company": "Zalando SE",
            "location": "Berlin, Germany",
            "country": "Germany",
            "city": "Berlin",
            "is_remote": 1,
            "description": "Design customer-facing e-commerce shopping workflows in React, TypeScript, Next.js, Tailwind, and Jest. Strong understanding of web vitals, accessibility, and GraphQL APIs.",
            "url": "https://jobs.zalando.com/en/berlin-frontend",
            "source": "Adzuna",
            "salary_min": 75000,
            "salary_max": 105000,
            "salary_currency": "EUR",
            "skills": ["react", "typescript", "next.js", "tailwind", "graphql", "jest", "html5", "css3"],
            "domain": "frontend",
            "posted_at": "2026-09-07T06:00:00Z"
        },
        {
            "id": "job-careem-dub-09",
            "title": "Senior Site Reliability Engineer (SRE)",
            "company": "Careem (Uber)",
            "location": "Dubai, United Arab Emirates",
            "country": "UAE",
            "city": "Dubai",
            "is_remote": 0,
            "description": "Scale SuperApp infrastructure across the Middle East. Seeking expertise in AWS, Terraform, Kubernetes, Linux performance tuning, Datadog monitoring, and Python automation.",
            "url": "https://careem.com/careers/sre-dubai",
            "source": "JobsPipe",
            "salary_min": 240000,
            "salary_max": 360000,
            "salary_currency": "AED",
            "skills": ["aws", "kubernetes", "terraform", "linux", "python", "docker", "ci/cd"],
            "domain": "cloud_devops",
            "posted_at": "2026-09-06T18:00:00Z"
        },
        {
            "id": "job-grab-sg-10",
            "title": "QA Automation Lead (Mobile & Web)",
            "company": "Grab Holdings",
            "location": "Singapore",
            "country": "Singapore",
            "city": "Singapore",
            "is_remote": 0,
            "description": "Drive quality across GrabPay and deliveries in Southeast Asia. Deep experience in Appium, Selenium, Python, Java, API testing, and CI/CD pipelines.",
            "url": "https://grab.careers/jobs/qa-lead-singapore",
            "source": "Adzuna",
            "salary_min": 90000,
            "salary_max": 135000,
            "salary_currency": "SGD",
            "skills": ["selenium", "appium", "python", "java", "api testing", "automation testing", "ci/cd"],
            "domain": "qa_testing",
            "posted_at": "2026-09-07T02:00:00Z"
        },
        {
            "id": "job-canva-syd-11",
            "title": "Full Stack Engineer (TypeScript & React)",
            "company": "Canva",
            "location": "Sydney, Australia",
            "country": "Australia",
            "city": "Sydney",
            "is_remote": 1,
            "description": "Empower the world to design. Create real-time collaborative editing experiences using TypeScript, React, WebGL, Node.js, and AWS DynamoDB.",
            "url": "https://canva.com/careers/fullstack-sydney",
            "source": "LinkedIn",
            "salary_min": 140000,
            "salary_max": 185000,
            "salary_currency": "AUD",
            "skills": ["react", "typescript", "node.js", "aws", "dynamodb", "graphql"],
            "domain": "fullstack",
            "posted_at": "2026-09-07T01:30:00Z"
        },
        {
            "id": "job-cognizant-mum-12",
            "title": "Lead Healthcare Data Analyst",
            "company": "Cognizant Technology Solutions",
            "location": "Airoli, Mumbai, India",
            "country": "India",
            "city": "Mumbai",
            "is_remote": 0,
            "description": "Analyze clinical EHR datasets and healthcare claims. Requires SQL, Python (Pandas, NumPy), Tableau, Power BI, HL7 data standards, and HIPAA compliance.",
            "url": "https://careers.cognizant.com/jobs/healthcare-analyst-mumbai",
            "source": "JobsPipe",
            "salary_min": 1500000,
            "salary_max": 2400000,
            "salary_currency": "INR",
            "skills": ["sql", "python", "pandas", "tableau", "power bi", "healthcare", "hl7", "hipaa"],
            "domain": "healthcare",
            "posted_at": "2026-09-07T05:45:00Z"
        }
    ]

    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    for job in jobs_data:
        cursor.execute("""
        INSERT OR IGNORE INTO jobs (
            id, title, company, location, country, city, is_remote, description,
            url, source, salary_min, salary_max, salary_currency, skills_json,
            domain, posted_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            job["id"], job["title"], job["company"], job["location"], job["country"],
            job["city"], job["is_remote"], job["description"], job["url"], job["source"],
            job["salary_min"], job["salary_max"], job["salary_currency"],
            json.dumps(job["skills"]), job["domain"], job["posted_at"], now_iso
        ))

    conn.commit()
    conn.close()

def seed_default_resume():
    """Seed sample resume matching user prompt profile (QA Test Engineer with Healthcare focus)."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM resumes WHERE id = 'resume-default-01'")
    if cursor.fetchone():
        conn.close()
        return

    sample_resume = {
        "id": "resume-default-01",
        "name": "Digvijay Gadiwadd",
        "email": "digvijaygadiwadd1620@gmail.com",
        "phone": "+91 98765 43210",
        "target_title": "QA Test Engineer / Automation SDET",
        "domain": "healthcare",
        "years_experience": 4,
        "skills": [
            "selenium", "java", "cypress", "postman", "api testing", "automation testing",
            "healthcare", "hl7", "hipaa", "jira", "pytest", "python", "sql", "git"
        ],
        "raw_text": """
DIGVIJAY GADIWADD
QA Test Engineer | Automation SDET | Healthcare Domain Specialist
Email: digvijaygadiwadd1620@gmail.com | Phone: +91 98765 43210 | Location: Pune, India

PROFESSIONAL SUMMARY:
Results-driven QA Test Engineer with 4+ years of experience designing and executing comprehensive automated testing frameworks across Web, Mobile, and REST APIs. Specialized in Healthcare IT domains including HL7, FHIR, HIPAA standards, EHR systems, and clinical patient data validation. Skilled in Selenium WebDriver, Cypress, Java, Python, Postman, and CI/CD pipelines.

CORE COMPETENCIES & TECHNICAL SKILLS:
- Test Automation: Selenium WebDriver, Cypress, Playwright, TestNG, JUnit, PyTest, Cucumber BDD
- Languages: Java, Python, JavaScript, SQL
- API Testing & Tools: Postman, REST-Assured, Swagger, JMeter, Charles Proxy
- Domain Knowledge: Healthcare IT, HIPAA Compliance, HL7 / FHIR Data Protocols, EHR/EMR Validation
- DevOps & Tools: Git, GitHub Actions, Jenkins, Docker, Jira, Confluence, TestRail

PROFESSIONAL EXPERIENCE:
Senior QA Automation Engineer | Healthcare IT Systems, Pune (2022 - Present)
- Engineered scalable automated regression test suite using Selenium Java and Cypress, reducing regression cycle time by 45%.
- Formulated API automation framework using Postman and REST-Assured for patient health records with strict HIPAA compliance.
- Validated HL7 and FHIR message exchange across hospital clinical databases.

QA Software Tester | TechSolutions Pune (2020 - 2022)
- Executed manual and automated functional, smoke, and integration testing across healthcare and enterprise applications.
- Documented 300+ high-severity defects in Jira with reproducible steps and log captures.
        """
    }

    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO resumes (
        id, name, email, phone, target_title, domain, skills_json,
        raw_text, years_experience, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?);
    """, (
        sample_resume["id"], sample_resume["name"], sample_resume["email"],
        sample_resume["phone"], sample_resume["target_title"], sample_resume["domain"],
        json.dumps(sample_resume["skills"]), sample_resume["raw_text"],
        sample_resume["years_experience"], now_iso
    ))

    conn.commit()
    conn.close()

def test_adzuna(app_id=None, app_key=None):
    """Tests connection to live Adzuna API."""
    init_db()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT adzuna_app_id, adzuna_app_key FROM alert_config WHERE id = 1")
    cfg = cursor.fetchone()
    conn.close()

    aid = app_id or os.environ.get("ADZUNA_APP_ID") or (cfg["adzuna_app_id"] if cfg and "adzuna_app_id" in cfg.keys() else "") or "066adfaf"
    akey = app_key or os.environ.get("ADZUNA_APP_KEY") or os.environ.get("ADZUNA_API_KEY") or (cfg["adzuna_app_key"] if cfg and "adzuna_app_key" in cfg.keys() else "") or "9d8303ee9e09eea727a92c1281addba8"

    if not aid or not akey:
        return {"status": "error", "error": "Adzuna App ID and API Key must be specified."}

    url = f"https://api.adzuna.com/v1/api/jobs/in/search/1?app_id={aid}&app_key={akey}&what=QA%20Automation&where=Pune&results_per_page=3"
    req = urllib.request.Request(url, headers={"User-Agent": "JobPulse/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            count = data.get("count", 0)
            results = data.get("results", [])
            sample = []
            for j in results:
                raw_title = j.get("title") or ""
                sample.append({
                    "id": j.get("id"),
                    "title": re.sub(r'<[^>]+>', '', raw_title).strip(),
                    "company": (j.get("company") or {}).get("display_name") or "",
                    "location": (j.get("location") or {}).get("display_name") or ""
                })
            return {"status": "ok", "count": count, "sample": sample}
    except Exception as e:
        return {"status": "error", "error": str(e)}

def generate_search_queries_for_resume(resume):
    """Generate 2-4 optimal, high-yield search terms for Adzuna based on resume target title and skills."""
    if not resume:
        return ["Software Engineer", "Developer", "QA Automation"]

    target = (resume.get("target_title") or "").strip()
    domain = (resume.get("domain") or "").strip().lower()
    skills = [str(s).lower().strip() for s in (resume.get("skills") or []) if s]
    raw_text = (resume.get("raw_text") or "").lower()

    queries = []

    # 1. Cleaned target title (remove qualifiers like Senior/Lead/Staff, remove parentheticals, etc.)
    clean_t = re.sub(r'\(.*?\)', '', target)
    clean_t = re.sub(r'[/&|,+–-].*', '', clean_t).strip()
    clean_t = re.sub(r'^(Senior|Junior|Lead|Principal|Staff|Associate|Chief)\s+', '', clean_t, flags=re.I).strip()

    if clean_t and len(clean_t) >= 3:
        queries.append(clean_t)

    # 2. Derive key skill combinations
    if any(s in skills for s in ["react", "next.js", "frontend", "vue", "angular"]) and any(s in skills for s in ["node.js", "express", "backend", "django", "fastapi", "spring", "spring boot"]):
        queries.append("Full Stack Developer")
    elif any(s in skills for s in ["python", "fastapi", "django", "flask"]):
        queries.append("Python Developer")
    elif any(s in skills for s in ["react", "next.js", "vue", "frontend", "angular"]):
        queries.append("React Developer")
    elif any(s in skills for s in ["java", "spring", "spring boot"]):
        queries.append("Java Developer")
    elif any(s in skills for s in ["selenium", "cypress", "playwright", "sdet", "testing", "testng", "cucumber", "qa"]):
        queries.append("QA Automation")
    elif any(s in skills for s in ["aws", "devops", "kubernetes", "docker", "terraform", "sre", "cloud"]):
        queries.append("DevOps Engineer")
    elif any(s in skills for s in ["machine learning", "pytorch", "tensorflow", "data science", "nlp", "llm", "deep learning"]):
        queries.append("Data Scientist")
    elif any(s in skills for s in ["sql", "data engineer", "spark", "etl", "snowflake"]):
        queries.append("Data Engineer")
    elif any(s in skills for s in ["flutter", "react native", "android", "ios", "swift", "kotlin"]):
        queries.append("Mobile App Developer")

    # 3. Domain or industry query
    if "health" in domain or any(k in raw_text for k in ["hl7", "fhir", "hipaa"]):
        queries.append("Healthcare IT")
    elif "fintech" in domain or "bank" in domain:
        queries.append("Fintech Developer")
    elif "devops" in domain or "cloud" in domain:
        queries.append("Cloud Engineer")
    elif "qa" in domain or "test" in domain:
        queries.append("SDET")
    else:
        queries.append("Software Engineer")

    # Deduplicate while preserving order
    seen = set()
    final_q = []
    for q in queries:
        qn = q.lower()
        if qn not in seen:
            seen.add(qn)
            final_q.append(q)
    return final_q[:4]

def classify_job_domain(title, desc):
    """Accurately classify incoming job postings by industry and technical domain."""
    combined = f"{title} {desc}".lower()
    if any(w in combined for w in ["health", "healthcare", "hipaa", "hl7", "fhir", "clinical", "ehr", "patient", "medical"]):
        return "healthcare"
    elif any(w in combined for w in ["fintech", "banking", "payments", "trading", "crypto", "blockchain", "pci-dss", "deutsche bank"]):
        return "fintech"
    elif any(w in combined for w in ["devops", "cloud", "aws", "kubernetes", "docker", "ci/cd", "terraform", "sre", "azure", "gcp"]):
        return "cloud_devops"
    elif any(w in combined for w in ["machine learning", "deep learning", "nlp", "llm", "data science", "data engineer", "analytics"]):
        return "ai_data"
    elif any(w in combined for w in ["qa", "testing", "selenium", "cypress", "sdet", "test automation", "quality assurance", "testng", "playwright"]):
        return "qa_testing"
    elif any(w in combined for w in ["full stack", "fullstack", "react", "frontend", "next.js", "vue", "web developer"]):
        return "fullstack"
    elif any(w in combined for w in ["software engineer", "backend", "python", "java", "golang", "microservices"]):
        return "software_engineering"
    return "general"

def fetch_and_store_adzuna_jobs(resume=None, force=False):
    """Fetches real live job postings from Adzuna API concurrently and caches results to avoid timeouts."""
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT adzuna_app_id, adzuna_app_key FROM alert_config WHERE id = 1")
    cfg = cursor.fetchone()
    app_id = os.environ.get("ADZUNA_APP_ID") or (cfg["adzuna_app_id"] if cfg and "adzuna_app_id" in cfg.keys() else "") or "066adfaf"
    app_key = os.environ.get("ADZUNA_APP_KEY") or os.environ.get("ADZUNA_API_KEY") or (cfg["adzuna_app_key"] if cfg and "adzuna_app_key" in cfg.keys() else "") or "9d8303ee9e09eea727a92c1281addba8"

    if not app_id or not app_key:
        conn.close()
        return 0

    # Cache freshness check: if jobs were fetched within the last 60 seconds, skip external API to avoid rate-limits
    if not force:
        cursor.execute("SELECT created_at FROM jobs WHERE source = 'Adzuna' ORDER BY created_at DESC LIMIT 1")
        last_job = cursor.fetchone()
        if last_job and last_job["created_at"]:
            try:
                last_clean = last_job["created_at"].replace("Z", "+00:00")
                last_dt = datetime.fromisoformat(last_clean)
                now_dt = datetime.now(timezone.utc)
                if (now_dt - last_dt).total_seconds() < 60:
                    conn.close()
                    return 0
            except Exception:
                pass

    # If resume is not passed, look up the active resume
    if not resume:
        cursor.execute("SELECT id, name, target_title, domain, skills_json, raw_text FROM resumes WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1")
        act_row = cursor.fetchone()
        if act_row:
            resume = dict(act_row)
            try:
                resume["skills"] = json.loads(resume.get("skills_json") or "[]")
            except:
                resume["skills"] = []

    # Dynamically generate optimal search queries for THIS candidate
    queries = generate_search_queries_for_resume(resume)
    primary_query = queries[0] if len(queries) > 0 else "Software Engineer"
    secondary_query = queries[1] if len(queries) > 1 else primary_query

    # High-yield targets executed concurrently in a thread pool (completes in ~1.5s total)
    search_targets = [
        ("in", "India", primary_query),
        ("in", "Bangalore", primary_query),
        ("in", "Pune", secondary_query),
        ("us", "Remote", primary_query)
    ]

    def _fetch_target(country, location, query):
        try:
            enc_query = urllib.parse.quote(query)
            enc_loc = urllib.parse.quote(location)
            url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1?app_id={app_id}&app_key={app_key}&what={enc_query}&where={enc_loc}&results_per_page=8"
            req = urllib.request.Request(url, headers={"User-Agent": "JobPulse/1.0"})
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return (country, location, query, data.get("results", []))
        except Exception:
            return (country, location, query, [])

    all_results = []
    try:
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(_fetch_target, c, l, q) for c, l, q in search_targets]
            for fut in as_completed(futures, timeout=4.5):
                try:
                    all_results.append(fut.result())
                except Exception:
                    pass
    except Exception:
        pass

    saved_count = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    for country, location, query, job_list in all_results:
        for j in job_list:
            try:
                job_id = f"adzuna-{j.get('id')}"
                raw_title = j.get("title") or query
                title = re.sub(r'<[^>]+>', '', raw_title).strip()
                raw_desc = j.get("description") or ""
                desc = re.sub(r'<[^>]+>', '', raw_desc).strip()
                company = (j.get("company") or {}).get("display_name") or "Enterprise Tech"
                loc_display = (j.get("location") or {}).get("display_name") or f"{location}, {country.upper()}"

                city = location
                if "Pune" in loc_display:
                    city = "Pune"
                elif "Bangalore" in loc_display or "Bengaluru" in loc_display:
                    city = "Bangalore"
                elif "Hyderabad" in loc_display:
                    city = "Hyderabad"
                elif "Mumbai" in loc_display:
                    city = "Mumbai"

                country_name = "India" if country == "in" else ("United States" if country == "us" else "United Kingdom")

                combined_text = f"{title} {desc}"
                extracted_skills = extract_skills_from_text(combined_text)
                if not extracted_skills:
                    extracted_skills = [q.lower() for q in query.split() if len(q) > 2]
                    if not extracted_skills:
                        extracted_skills = ["software development", "problem solving", "api"]

                domain = classify_job_domain(title, desc)
                sal_min = int(j.get("salary_min")) if j.get("salary_min") else None
                sal_max = int(j.get("salary_max")) if j.get("salary_max") else None
                currency = "INR" if country == "in" else "USD"

                cursor.execute("""
                INSERT INTO jobs (
                    id, title, company, location, country, city, is_remote, description,
                    url, source, salary_min, salary_max, salary_currency, skills_json,
                    domain, posted_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Adzuna', ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title=excluded.title,
                    company=excluded.company,
                    location=excluded.location,
                    description=excluded.description,
                    skills_json=excluded.skills_json,
                    domain=excluded.domain,
                    url=excluded.url;
                """, (
                    job_id, title, company, loc_display, country_name, city,
                    1 if "remote" in loc_display.lower() or "remote" in desc.lower() else 0,
                    desc, j.get("redirect_url") or "",
                    sal_min, sal_max, currency,
                    json.dumps(extracted_skills), domain,
                    j.get("created") or now_iso, now_iso
                ))
                saved_count += 1
            except Exception:
                continue

    conn.commit()
    conn.close()
    return saved_count

def run_scan_and_match(resume_id=None, skip_adzuna=False):
    """Calculates TF-IDF and scores all jobs against the specified or active resume."""
    conn = get_db()
    cursor = conn.cursor()

    # Get target resume
    if resume_id:
        cursor.execute("SELECT * FROM resumes WHERE id = ?", (resume_id,))
    else:
        cursor.execute("SELECT * FROM resumes WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1")
    
    resume_row = cursor.fetchone()
    if not resume_row:
        conn.close()
        return {"error": "No resume found to match against"}

    resume = dict(resume_row)
    conn.close()

    # Ingest live postings from Adzuna before computing scores unless explicitly skipped
    if not skip_adzuna:
        try:
            fetch_and_store_adzuna_jobs(resume)
        except Exception as e:
            sys.stderr.write(f"Notice: Adzuna background pull: {e}\n")

    conn = get_db()
    cursor = conn.cursor()
    resume_skills = json.loads(resume.get("skills_json") or "[]")
    resume_text = resume.get("raw_text") or ""
    resume_domain = resume.get("domain") or ""

    cursor.execute("SELECT * FROM jobs")
    job_rows = cursor.fetchall()

    corpus_samples = [j["description"] for j in job_rows]
    now_iso = datetime.now(timezone.utc).isoformat()

    matched_count = 0
    top_score = 0
    top_job_title = ""
    top_company = ""
    top_match_item = None

    for job_row in job_rows:
        job = dict(job_row)
        job_skills = json.loads(job.get("skills_json") or "[]")
        job_text = f"{job['title']} {job['company']} {job['description']}"

        score_res = score_job_match(
            resume_skills, resume_domain, resume_text,
            job_skills, job.get("domain"), job_text, corpus_samples,
            resume_title=resume.get("target_title"), job_title=job.get("title")
        )

        match_id = f"m_{resume['id']}_{job['id']}"

        # Check existing match to preserve application status and notes
        cursor.execute("SELECT status, notes, interview_date, salary_offered FROM matches WHERE id = ?", (match_id,))
        existing = cursor.fetchone()
        status = existing["status"] if existing else "Discovered"
        notes = existing["notes"] if existing else ""
        interview_date = existing["interview_date"] if existing else None
        salary_offered = existing["salary_offered"] if existing else None

        cursor.execute("""
        INSERT INTO matches (
            id, job_id, resume_id, total_score, tfidf_score, skill_bonus, domain_boost,
            matched_skills_json, missing_skills_json, status, notes, interview_date,
            salary_offered, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            total_score=excluded.total_score,
            tfidf_score=excluded.tfidf_score,
            skill_bonus=excluded.skill_bonus,
            domain_boost=excluded.domain_boost,
            matched_skills_json=excluded.matched_skills_json,
            missing_skills_json=excluded.missing_skills_json,
            updated_at=excluded.updated_at;
        """, (
            match_id, job["id"], resume["id"], score_res["total_score"],
            score_res["tfidf_score"], score_res["skill_bonus"], score_res["domain_boost"],
            json.dumps(score_res["matched_skills"]), json.dumps(score_res["missing_skills"]),
            status, notes, interview_date, salary_offered, now_iso, now_iso
        ))

        matched_count += 1
        if score_res["total_score"] > top_score:
            top_score = score_res["total_score"]
            top_job_title = job["title"]
            top_company = job["company"]
            top_match_item = {
                "title": job["title"],
                "company": job["company"],
                "location": job["location"],
                "score": top_score,
                "url": job["url"]
            }

    # Record scan log
    cursor.execute("""
    INSERT INTO scan_logs (timestamp, jobs_found, jobs_matched, top_score, top_role, alert_sent)
    VALUES (?, ?, ?, ?, ?, ?);
    """, (now_iso, len(job_rows), matched_count, top_score, f"{top_job_title} @ {top_company}", 1 if top_score >= 80 else 0))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "jobs_found": len(job_rows),
        "jobs_matched": matched_count,
        "top_score": top_score,
        "top_role": f"{top_job_title} @ {top_company}",
        "top_match": top_match_item,
        "timestamp": now_iso
    }

def send_telegram_alert(bot_token, chat_id, message_text):
    """Sends real Telegram Bot message via official Telegram Bot API."""
    if not bot_token or not chat_id:
        return {"success": False, "error": "Telegram Bot Token and Chat ID are required"}
    
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message_text,
        "parse_mode": "Markdown"
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            if res_json.get("ok"):
                return {"success": True, "message_id": res_json.get("result", {}).get("message_id")}
            else:
                return {"success": False, "error": res_json.get("description", "Unknown Telegram API error")}
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_matches(filters=None):
    filters = filters or {}
    conn = get_db()
    cursor = conn.cursor()

    query = """
    SELECT 
        m.id as match_id, m.total_score, m.tfidf_score, m.skill_bonus, m.domain_boost,
        m.matched_skills_json, m.missing_skills_json, m.status, m.notes,
        m.interview_date, m.salary_offered, m.updated_at,
        j.id as job_id, j.title, j.company, j.location, j.country, j.city,
        j.is_remote, j.description, j.url, j.source, j.salary_min, j.salary_max,
        j.salary_currency, j.skills_json as job_skills_json, j.domain, j.posted_at,
        r.id as resume_id, r.name as candidate_name, r.target_title as candidate_title
    FROM matches m
    JOIN jobs j ON m.job_id = j.id
    JOIN resumes r ON m.resume_id = r.id
    WHERE 1=1
    """
    params = []

    resume_filter = filters.get("resume_id")
    if resume_filter and resume_filter != "all":
        query += " AND m.resume_id = ?"
        params.append(resume_filter)
    else:
        # Strictly return matches for the currently active resume
        query += " AND r.is_active = 1"

    if filters.get("city") and filters["city"] != "all":
        query += " AND LOWER(j.city) = LOWER(?)"
        params.append(filters["city"])

    if filters.get("country") and filters["country"] != "all":
        query += " AND LOWER(j.country) = LOWER(?)"
        params.append(filters["country"])

    if filters.get("status") and filters["status"] != "all":
        query += " AND m.status = ?"
        params.append(filters["status"])

    if filters.get("min_score"):
        query += " AND m.total_score >= ?"
        params.append(int(filters["min_score"]))

    if filters.get("search"):
        search_term = f"%{filters['search']}%"
        query += " AND (j.title LIKE ? OR j.company LIKE ? OR j.description LIKE ?)"
        params.extend([search_term, search_term, search_term])

    # Ordering
    sort_by = filters.get("sort", "score_desc")
    if sort_by == "score_desc":
        query += " ORDER BY m.total_score DESC, j.posted_at DESC"
    elif sort_by == "score_asc":
        query += " ORDER BY m.total_score ASC"
    elif sort_by == "date_desc":
        query += " ORDER BY j.posted_at DESC"
    elif sort_by == "salary_desc":
        query += " ORDER BY j.salary_max DESC"
    else:
        query += " ORDER BY m.total_score DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()

    # If no matches exist for this candidate profile yet, compute matches on the fly
    if not rows and resume_filter and resume_filter != "all":
        conn.close()
        run_scan_and_match(resume_filter)
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
    elif not rows and (not resume_filter or resume_filter == "all"):
        cursor.execute("SELECT id FROM resumes WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1")
        act_r = cursor.fetchone()
        if act_r:
            conn.close()
            run_scan_and_match(act_r[0])
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
    
    results = []
    for r in rows:
        item = dict(r)
        item["matched_skills"] = json.loads(item["matched_skills_json"] or "[]")
        item["missing_skills"] = json.loads(item["missing_skills_json"] or "[]")
        item["job_skills"] = json.loads(item["job_skills_json"] or "[]")
        del item["matched_skills_json"]
        del item["missing_skills_json"]
        del item["job_skills_json"]
        results.append(item)

    conn.close()
    return results

def get_stats(resume_id=None):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM jobs")
    total_jobs = cursor.fetchone()[0]

    cursor.execute("SELECT id, name, email, phone, target_title, domain, skills_json, raw_text, years_experience, is_active, created_at FROM resumes WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1")
    active_resume = cursor.fetchone()
    resume_data = None
    if active_resume:
        resume_data = dict(active_resume)
        try:
            raw_s = json.loads(resume_data["skills_json"] or "[]")
            deduped_s = []
            seen_s = set()
            for s in raw_s:
                cs = str(s).strip().lower()
                if cs and cs not in seen_s:
                    seen_s.add(cs)
                    deduped_s.append(cs)
            resume_data["skills"] = deduped_s
        except:
            resume_data["skills"] = []
        del resume_data["skills_json"]

    target_res_id = resume_id or (resume_data["id"] if resume_data else None)

    if target_res_id:
        cursor.execute("SELECT COUNT(*) FROM matches WHERE resume_id = ? AND total_score >= 60", (target_res_id,))
        matched_jobs = cursor.fetchone()[0]

        cursor.execute("SELECT MAX(total_score) FROM matches WHERE resume_id = ?", (target_res_id,))
        max_score = cursor.fetchone()[0] or 0

        cursor.execute("SELECT status, COUNT(*) FROM matches WHERE resume_id = ? GROUP BY status", (target_res_id,))
        status_counts = dict(cursor.fetchall())
    else:
        cursor.execute("SELECT COUNT(*) FROM matches WHERE total_score >= 60")
        matched_jobs = cursor.fetchone()[0]

        cursor.execute("SELECT MAX(total_score) FROM matches")
        max_score = cursor.fetchone()[0] or 0

        cursor.execute("SELECT status, COUNT(*) FROM matches GROUP BY status")
        status_counts = dict(cursor.fetchall())

    cursor.execute("SELECT * FROM scan_logs ORDER BY id DESC LIMIT 5")
    recent_scans = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT * FROM alert_config WHERE id = 1")
    config_row = cursor.fetchone()
    config = dict(config_row) if config_row else {}

    conn.close()

    return {
        "total_jobs": total_jobs,
        "matched_jobs": matched_jobs,
        "top_score": max_score,
        "top_match_score": max_score,
        "status_breakdown": {
            "Discovered": status_counts.get("Discovered", 0),
            "Applied": status_counts.get("Applied", 0),
            "Interview": status_counts.get("Interview", 0),
            "Offer": status_counts.get("Offer", 0),
            "Rejected": status_counts.get("Rejected", 0)
        },
        "recent_scans": recent_scans,
        "alert_config": config,
        "active_profile": resume_data
    }

def update_match_status(match_id, status=None, notes=None, interview_date=None, salary_offered=None):
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    
    cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"error": "Match not found"}

    curr = dict(row)
    new_status = status if status is not None else curr["status"]
    new_notes = notes if notes is not None else curr["notes"]
    new_interview = interview_date if interview_date is not None else curr["interview_date"]
    new_salary = salary_offered if salary_offered is not None else curr["salary_offered"]

    cursor.execute("""
    UPDATE matches 
    SET status = ?, notes = ?, interview_date = ?, salary_offered = ?, updated_at = ?
    WHERE id = ?;
    """, (new_status, new_notes, new_interview, new_salary, now_iso, match_id))

    conn.commit()
    conn.close()
    return {"status": "updated", "match_id": match_id, "new_status": new_status}

def save_resume_profile(data):
    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    
    resume_id = data.get("id") or f"resume_{int(datetime.now().timestamp())}"
    # Deactivate others if marked active
    if data.get("is_active", 1):
        cursor.execute("UPDATE resumes SET is_active = 0;")

    skills = data.get("skills", [])
    if isinstance(skills, str):
        try:
            skills = json.loads(skills)
        except:
            skills = [s.strip() for s in skills.split(",") if s.strip()]

    deduped_skills = []
    seen_skills = set()
    for s in skills:
        cleaned_s = str(s).strip().lower()
        if cleaned_s and cleaned_s not in seen_skills:
            seen_skills.add(cleaned_s)
            deduped_skills.append(cleaned_s)
    skills = deduped_skills

    raw_text = data.get("raw_text", "")
    if not raw_text or len(raw_text.strip()) < 15:
        target_t = data.get("target_title", "QA Test Engineer")
        dom = data.get("domain", "healthcare")
        skills_str = ", ".join(skills) if skills else "automation testing, selenium, cypress, postman"
        raw_text = f"{target_t} experienced in {dom} software quality assurance. Expertise in: {skills_str}. Experienced in building automated regression suites, API test validations, and clinical healthcare standards."

    cursor.execute("""
    INSERT INTO resumes (
        id, name, email, phone, target_title, domain, skills_json, raw_text, years_experience, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        email=excluded.email,
        phone=excluded.phone,
        target_title=excluded.target_title,
        domain=excluded.domain,
        skills_json=excluded.skills_json,
        raw_text=excluded.raw_text,
        years_experience=excluded.years_experience,
        is_active=1;
    """, (
        resume_id, data.get("name", "Job Seeker"), data.get("email", ""),
        data.get("phone", ""), data.get("target_title", "Software Engineer"),
        data.get("domain", "general"), json.dumps(skills), raw_text,
        int(data.get("years_experience") or 0), now_iso
    ))

    conn.commit()
    conn.close()

    # Automatically fetch real-time jobs tailored for this candidate and run match scoring
    try:
        fetch_and_store_adzuna_jobs(data)
    except Exception as e:
        sys.stderr.write(f"Notice: Live job sync for {data.get('name')}: {e}\n")

    scan_res = run_scan_and_match(resume_id, skip_adzuna=True)
    return {"status": "saved", "resume_id": resume_id, "scan": scan_res}

def get_resumes():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, email, phone, target_title, domain, skills_json, raw_text, years_experience, is_active, created_at
        FROM resumes
        ORDER BY is_active DESC, created_at DESC
    """)
    rows = cursor.fetchall()
    resumes = []
    for r in rows:
        item = dict(r)
        try:
            raw_s = json.loads(item["skills_json"] or "[]")
            deduped_s = []
            seen_s = set()
            for s in raw_s:
                cs = str(s).strip().lower()
                if cs and cs not in seen_s:
                    seen_s.add(cs)
                    deduped_s.append(cs)
            item["skills"] = deduped_s
        except:
            item["skills"] = []
        del item["skills_json"]
        resumes.append(item)
    conn.close()
    return resumes

def set_active_resume(resume_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE resumes SET is_active = 0")
    cursor.execute("UPDATE resumes SET is_active = 1 WHERE id = ?", (resume_id,))
    cursor.execute("SELECT id, name, target_title, domain, skills_json, raw_text FROM resumes WHERE id = ?", (resume_id,))
    row = cursor.fetchone()
    conn.commit()
    conn.close()

    if row:
        target_res = dict(row)
        try:
            target_res["skills"] = json.loads(target_res.get("skills_json") or "[]")
        except:
            target_res["skills"] = []
        try:
            fetch_and_store_adzuna_jobs(target_res)
        except Exception:
            pass

    scan_res = run_scan_and_match(resume_id)
    return {"status": "activated", "resume_id": resume_id, "scan": scan_res}

def delete_resume_profile(resume_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT is_active FROM resumes WHERE id = ?", (resume_id,))
    row = cursor.fetchone()
    was_active = row and row[0] == 1
    cursor.execute("DELETE FROM resumes WHERE id = ?", (resume_id,))
    if was_active:
        cursor.execute("UPDATE resumes SET is_active = 1 WHERE id = (SELECT id FROM resumes ORDER BY created_at DESC LIMIT 1)")
    conn.commit()
    conn.close()
    return {"status": "deleted", "resume_id": resume_id}

def save_alert_config(data):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE alert_config
    SET telegram_bot_token = ?,
        telegram_chat_id = ?,
        min_score_alert = ?,
        auto_scan_enabled = ?,
        scan_interval_minutes = ?,
        desktop_notifications = ?,
        adzuna_app_id = ?,
        adzuna_app_key = ?
    WHERE id = 1;
    """, (
        data.get("telegram_bot_token", ""),
        data.get("telegram_chat_id", ""),
        int(data.get("min_score_alert", 80)),
        1 if data.get("auto_scan_enabled") else 0,
        int(data.get("scan_interval_minutes", 5)),
        1 if data.get("desktop_notifications") else 0,
        data.get("adzuna_app_id", "066adfaf"),
        data.get("adzuna_app_key", "9d8303ee9e09eea727a92c1281addba8")
    ))
    conn.commit()
    conn.close()
    return {"status": "saved"}

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "init"

    if action == "init":
        init_db()
        seed_sample_jobs()
        seed_default_resume()
        run_scan_and_match()
        print(json.dumps({"status": "initialized", "db": DB_PATH}))

    elif action == "scan":
        init_db()
        seed_sample_jobs()
        resume_id = sys.argv[2] if len(sys.argv) > 2 else None
        res = run_scan_and_match(resume_id)
        print(json.dumps(res))

    elif action == "matches":
        filters = {}
        if len(sys.argv) > 2:
            try:
                filters = json.loads(sys.argv[2])
            except:
                pass
        matches = get_matches(filters)
        print(json.dumps(matches))

    elif action == "update_match":
        match_id = sys.argv[2]
        payload = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
        res = update_match_status(
            match_id,
            status=payload.get("status"),
            notes=payload.get("notes"),
            interview_date=payload.get("interview_date"),
            salary_offered=payload.get("salary_offered")
        )
        print(json.dumps(res))

    elif action == "save_resume":
        payload = json.loads(sys.argv[2])
        res = save_resume_profile(payload)
        print(json.dumps(res))

    elif action == "list_resumes":
        resumes = get_resumes()
        print(json.dumps(resumes))

    elif action == "set_active_resume":
        resume_id = sys.argv[2]
        res = set_active_resume(resume_id)
        print(json.dumps(res))

    elif action == "delete_resume":
        resume_id = sys.argv[2]
        res = delete_resume_profile(resume_id)
        print(json.dumps(res))

    elif action == "save_config":
        payload = json.loads(sys.argv[2])
        res = save_alert_config(payload)
        print(json.dumps(res))

    elif action == "stats":
        resume_id = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != "all" else None
        stats = get_stats(resume_id)
        print(json.dumps(stats))

    elif action == "test_telegram":
        token = sys.argv[2] if len(sys.argv) > 2 else ""
        chat_id = sys.argv[3] if len(sys.argv) > 3 else ""
        msg = sys.argv[4] if len(sys.argv) > 4 else "🎯 *JobPulse Alert Test*: System is active and scanning jobs 24/7!"
        result = send_telegram_alert(token, chat_id, msg)
        print(json.dumps(result))

    elif action == "test_adzuna":
        app_id = sys.argv[2] if len(sys.argv) > 2 else "066adfaf"
        app_key = sys.argv[3] if len(sys.argv) > 3 else "9d8303ee9e09eea727a92c1281addba8"
        result = test_adzuna(app_id, app_key)
        print(json.dumps(result))

    elif action == "sync_adzuna":
        resume_id = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != "all" else None
        target_resume = None
        if resume_id:
            conn = get_db()
            cur = conn.cursor()
            cur.execute("SELECT id, name, target_title, domain, skills_json, raw_text FROM resumes WHERE id = ?", (resume_id,))
            r = cur.fetchone()
            conn.close()
            if r:
                target_resume = dict(r)
                try:
                    target_resume["skills"] = json.loads(target_resume.get("skills_json") or "[]")
                except:
                    target_resume["skills"] = []
        cnt = fetch_and_store_adzuna_jobs(target_resume)
        scan_res = run_scan_and_match(resume_id)
        print(json.dumps({"status": "ok", "adzuna_jobs_synced": cnt, "scan": scan_res}))

    elif action == "parse_text":
        text = sys.stdin.read()
        skills = extract_skills_from_text(text)
        print(json.dumps({"skills": skills}))

    elif action == "parse_docx":
        b64 = sys.argv[2] if len(sys.argv) > 2 else ""
        if not b64:
            b64 = sys.stdin.read().strip()
        text = extract_text_from_docx_base64(b64)
        print(json.dumps({"status": "ok", "text": text}))

    elif action == "parse_pdf":
        b64 = sys.argv[2] if len(sys.argv) > 2 else ""
        if not b64:
            b64 = sys.stdin.read().strip()
        text = extract_text_from_pdf_base64(b64)
        print(json.dumps({"status": "ok", "text": text}))

    else:
        print(json.dumps({"error": f"Unknown action: {action}"}))
