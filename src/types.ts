export interface JobMatch {
  match_id: string;
  total_score: number;
  tfidf_score: number;
  skill_bonus: number;
  domain_boost: number;
  matched_skills: string[];
  missing_skills: string[];
  status: "Discovered" | "Applied" | "Interview" | "Offer" | "Rejected";
  notes?: string;
  interview_date?: string | null;
  salary_offered?: string | null;
  updated_at: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  city: string;
  is_remote: number;
  description: string;
  url: string;
  source: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  job_skills: string[];
  domain?: string;
  posted_at: string;
  resume_id: string;
  candidate_name: string;
  candidate_title: string;
}

export interface ResumeProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  target_title: string;
  domain?: string;
  years_experience?: number;
  skills: string[];
  raw_text?: string;
  executive_summary?: string;
  experience_highlights?: string[];
  education?: string;
  is_active?: number;
  created_at?: string;
}

export interface ScanLog {
  id: number;
  timestamp: string;
  jobs_found: number;
  jobs_matched: number;
  top_score: number;
  top_role: string;
  alert_sent: number;
}

export interface AlertConfig {
  id: number;
  telegram_bot_token: string;
  telegram_chat_id: string;
  min_score_alert: number;
  auto_scan_enabled: number;
  scan_interval_minutes: number;
  desktop_notifications: number;
  adzuna_app_id?: string;
  adzuna_app_key?: string;
}

export interface AppStats {
  total_jobs: number;
  matched_jobs: number;
  top_score: number;
  status_breakdown: {
    Discovered: number;
    Applied: number;
    Interview: number;
    Offer: number;
    Rejected: number;
  };
  recent_scans: ScanLog[];
  alert_config: AlertConfig;
  active_profile: ResumeProfile | null;
}

export interface FilterState {
  city: string;
  country: string;
  status: string;
  min_score: number;
  search: string;
  sort: string;
}
