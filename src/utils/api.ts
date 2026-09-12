/**
 * Centralized API client for JobPulse backend service.
 * Supports configurable authorization header and typed request/response handling.
 */

import { JobMatch, ResumeProfile, AlertConfig, AppStats } from '../types';

const API_BASE = '';

function getHeaders(customHeaders?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  // Check for any client-side stored API key if authentication is enabled
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem('jobpulse_api_key') : null;
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }
  return { ...headers, ...customHeaders };
}

export async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: getHeaders(options?.headers),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Error [${res.status}] ${url}:`, errorText);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`Network Error ${url}:`, err);
    return null;
  }
}

export const api = {
  // Jobs & Matches
  getJobs: (params?: { resume_id?: string; status?: string; city?: string; country?: string; min_score?: number; search?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const qs = query.toString();
    return safeFetchJson<JobMatch[]>(`/api/jobs${qs ? `?${qs}` : ''}`);
  },

  getStats: (resumeId?: string) => {
    const url = resumeId ? `/api/stats?resume_id=${encodeURIComponent(resumeId)}` : '/api/stats';
    return safeFetchJson<AppStats>(url);
  },

  triggerScan: (payload: { resume_id?: string; candidate_name?: string; target_title?: string; domain?: string; skills?: string[] }) => {
    return safeFetchJson<{ status: string; jobs_found: number; jobs_matched: number; top_score?: number; top_role?: string }>('/api/jobs/scan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateMatchStatus: (matchId: string, status: string, notes?: string) => {
    return safeFetchJson<{ status: string; match_id: string }>(`/api/matches/${encodeURIComponent(matchId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  // Resumes
  getResumes: () => {
    return safeFetchJson<ResumeProfile[]>('/api/resumes');
  },

  saveResume: (resume: Partial<ResumeProfile>) => {
    return safeFetchJson<{ status: string; profile: ResumeProfile; scan?: any }>('/api/resumes', {
      method: 'POST',
      body: JSON.stringify(resume),
    });
  },

  activateResume: (resumeId: string) => {
    return safeFetchJson<{ status: string; active_id: string; scan?: any }>(`/api/resumes/${encodeURIComponent(resumeId)}/activate`, {
      method: 'POST',
    });
  },

  deleteResume: (resumeId: string) => {
    return safeFetchJson<{ status: string }>(`/api/resumes/${encodeURIComponent(resumeId)}`, {
      method: 'DELETE',
    });
  },

  parseResume: (payload: { raw_text?: string; file_base64?: string; file_name?: string; mime_type?: string }) => {
    return safeFetchJson<{ status: string; parsed: Partial<ResumeProfile> }>('/api/resume/parse', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Alerts & Config
  getAlertConfig: () => {
    return safeFetchJson<AlertConfig>('/api/alerts/config');
  },

  saveAlertConfig: (config: Partial<AlertConfig>) => {
    return safeFetchJson<{ status: string; config: AlertConfig }>('/api/alerts/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  // AI Assistance Services
  generateCoverLetter: (payload: { job_title: string; company: string; location?: string; job_description?: string; resume_name?: string; resume_text?: string; skills?: string[]; tone?: string }) => {
    return safeFetchJson<{ cover_letter: string; model: string }>('/api/ai/cover-letter', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  generateInterviewPrep: (payload: { job_title: string; company: string; job_description?: string; matched_skills?: string[]; missing_skills?: string[] }) => {
    return safeFetchJson<{
      technical_questions: Array<{ question: string; category: string; sample_answer_key_points: string }>;
      behavioral_scenarios: Array<{ scenario: string; star_tip: string }>;
      company_questions_to_ask: string[];
    }>('/api/ai/interview-prep', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  generateResumeTailor: (payload: { job_title: string; company: string; job_description?: string; matched_skills?: string[]; missing_skills?: string[]; resume_text?: string }) => {
    return safeFetchJson<{
      ats_match_rate: number;
      keyword_recommendations: string[];
      bullet_point_rewrites: Array<{ original_concept: string; tailored_bullet: string; reasoning: string }>;
      bullet_points: string[];
      summary_hook_suggestion: string;
    }>('/api/ai/resume-tailor', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  generateCompanyIntel: (payload: { company: string; job_title: string; location?: string }) => {
    return safeFetchJson<{
      overview: string;
      engineering_culture: string;
      recent_initiatives: string;
      interview_insider_tips: string[];
      estimated_rating: string;
    }>('/api/ai/company-intel', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  estimateSalary: (payload: { job_title: string; location?: string; country?: string; domain?: string; experience_years?: number; skills?: string[] }) => {
    return safeFetchJson<{
      currency: string;
      median: number;
      min: number;
      max: number;
      confidence: string;
      factors: string[];
      takeaway: string;
    }>('/api/salary/estimate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
