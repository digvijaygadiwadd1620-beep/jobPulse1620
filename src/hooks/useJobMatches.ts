import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  JobMatch,
  ResumeProfile,
  AppStats,
  AlertConfig,
  FilterState,
} from '../types';
import { SAMPLE_PROFILES } from '../data/sampleProfiles';
import { api } from '../utils/api';
import { ToastAlertData } from '../components/ToastAlert';

export function useJobMatches(onTopMatchAlert?: (alert: ToastAlertData) => void) {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [activeProfile, setActiveProfile] = useState<ResumeProfile>(SAMPLE_PROFILES[0]);
  const [savedProfiles, setSavedProfiles] = useState<ResumeProfile[]>(SAMPLE_PROFILES);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionWarning, setConnectionWarning] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    city: 'all',
    country: 'all',
    status: 'all',
    min_score: 0,
    search: '',
    sort: 'score_desc',
  });

  const activeProfileRef = useRef<ResumeProfile | null>(activeProfile);
  useEffect(() => {
    activeProfileRef.current = activeProfile;
  }, [activeProfile]);

  const loadJobs = useCallback(async (resumeId?: string) => {
    const targetId = resumeId || activeProfileRef.current?.id || activeProfile?.id;
    const data = await api.getJobs({ resume_id: targetId });
    if (Array.isArray(data)) {
      setMatches(data);
      setConnectionWarning(null);
    } else if (matches.length === 0) {
      setConnectionWarning('Connecting to JobPulse Agent Engine...');
    }
  }, [activeProfile?.id, matches.length]);

  const loadStats = useCallback(async (resumeId?: string) => {
    const targetId = resumeId || activeProfileRef.current?.id || activeProfile?.id;
    const data = await api.getStats(targetId);
    if (data && data.total_jobs !== undefined) {
      setStats(data as any);
      setConnectionWarning(null);
      if (data?.active_profile?.name) {
        setActiveProfile((prev) => {
          if (!prev || prev.id !== data.active_profile.id || prev.name !== data.active_profile.name) {
            return data.active_profile;
          }
          return prev;
        });
      }
    }
  }, [activeProfile?.id]);

  const loadResumes = useCallback(async () => {
    const data = await api.getResumes();
    if (Array.isArray(data) && data.length > 0) {
      setSavedProfiles(data);
      const active = data.find((r) => r.is_active === 1);
      if (active) {
        setActiveProfile(active);
      }
    }
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadJobs(), loadStats(), loadResumes()]);
    } finally {
      setIsLoading(false);
    }
  }, [loadJobs, loadStats, loadResumes]);

  // Initial load and periodic refresh
  useEffect(() => {
    loadAll();

    // Trigger initial toast to show user the 24/7 Agent is ready
    const initTimer = setTimeout(() => {
      if (onTopMatchAlert) {
        onTopMatchAlert({
          id: 'init-toast',
          title: 'QA Test Engineer (Automation & Healthcare)',
          company: 'Apex HealthTech',
          location: 'Pune, India',
          score: 98,
        });
      }
    }, 1500);

    const liveRefreshTimer = setInterval(() => {
      loadJobs();
      loadStats();
      loadResumes();
    }, 30000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(liveRefreshTimer);
    };
  }, [loadAll, loadJobs, loadStats, loadResumes, onTopMatchAlert]);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    return matches
      .filter((m) => {
        if (filters.city !== 'all' && m.city.toLowerCase() !== filters.city.toLowerCase()) {
          return false;
        }
        if (filters.country !== 'all' && m.country.toLowerCase() !== filters.country.toLowerCase()) {
          return false;
        }
        if (filters.status !== 'all' && m.status !== filters.status) {
          return false;
        }
        if (filters.min_score > 0 && m.total_score < filters.min_score) {
          return false;
        }
        if (filters.search.trim()) {
          const query = filters.search.toLowerCase();
          const inTitle = m.title.toLowerCase().includes(query);
          const inCompany = m.company.toLowerCase().includes(query);
          const inDesc = m.description.toLowerCase().includes(query);
          const inSkills = m.matched_skills.some((s) => s.toLowerCase().includes(query));
          if (!inTitle && !inCompany && !inDesc && !inSkills) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sort === 'score_desc') return b.total_score - a.total_score;
        if (filters.sort === 'salary_desc') return (b.salary_max || 0) - (a.salary_max || 0);
        return new Date(b.posted_at || 0).getTime() - new Date(a.posted_at || 0).getTime();
      });
  }, [matches, filters]);

  const handleScanNow = useCallback(async () => {
    setIsScanning(true);
    try {
      const profile = activeProfileRef.current || activeProfile;
      const data = await api.triggerScan({
        resume_id: profile?.id || '',
        candidate_name: profile?.name || '',
        target_title: profile?.target_title || '',
        domain: profile?.domain || '',
        skills: profile?.skills || [],
      });

      const currentResumeId = profile?.id;
      await Promise.all([loadJobs(currentResumeId), loadStats(currentResumeId)]);

      if (data && (data as any).top_match && onTopMatchAlert) {
        const top = (data as any).top_match;
        onTopMatchAlert({
          id: `scan-${Date.now()}`,
          title: top.title,
          company: top.company,
          location: top.location,
          score: top.score || top.total_score || 94,
          match: top,
        });
      }
    } catch (err: any) {
      console.warn('Scan notice:', err?.message || err);
      const currentResumeId = activeProfileRef.current?.id || activeProfile?.id;
      await Promise.all([loadJobs(currentResumeId), loadStats(currentResumeId)]);
    } finally {
      setIsScanning(false);
    }
  }, [activeProfile, loadJobs, loadStats, onTopMatchAlert]);

  const handleStatusChange = useCallback(
    async (matchId: string, newStatus: JobMatch['status']) => {
      // Optimistic update
      setMatches((prev) =>
        prev.map((m) => (m.match_id === matchId ? { ...m, status: newStatus } : m))
      );

      await api.updateMatchStatus(matchId, newStatus);
      loadStats();
    },
    [loadStats]
  );

  const handleUpdateDetails = useCallback(
    async (
      matchId: string,
      payload: { notes?: string; interview_date?: string; salary_offered?: string }
    ) => {
      setMatches((prev) =>
        prev.map((m) => (m.match_id === matchId ? { ...m, ...payload } : m))
      );

      await api.updateMatchStatus(matchId, '', payload.notes);
      loadStats();
    },
    [loadStats]
  );

  const handleSaveConfig = useCallback(
    async (updated: Partial<AlertConfig>) => {
      const res = await api.saveAlertConfig(updated);
      if (res && res.config) {
        setStats((prev) => (prev ? { ...prev, alert_config: res.config } : prev));
      }
    },
    []
  );

  const handleSwitchProfile = useCallback(
    async (profile: ResumeProfile) => {
      setActiveProfile(profile);
      setIsScanning(true);
      try {
        const res = await api.activateResume(profile.id);
        if (!res) {
          await api.saveResume({ ...profile, is_active: 1 });
        }
        await Promise.all([loadJobs(profile.id), loadStats(profile.id), loadResumes()]);
      } catch (err) {
        console.error('Profile switch scan error:', err);
      } finally {
        setIsScanning(false);
      }
    },
    [loadJobs, loadStats, loadResumes]
  );

  const handleSaveProfile = useCallback(
    async (profile: ResumeProfile) => {
      setActiveProfile(profile);
      setIsScanning(true);
      try {
        await api.saveResume({ ...profile, is_active: 1 });
        await Promise.all([loadJobs(profile.id), loadStats(profile.id), loadResumes()]);
      } catch (err) {
        console.error('Profile save error:', err);
      } finally {
        setIsScanning(false);
      }
    },
    [loadJobs, loadStats, loadResumes]
  );

  return {
    matches,
    stats,
    activeProfile,
    savedProfiles,
    filters,
    filteredMatches,
    isScanning,
    isLoading,
    connectionWarning,
    setFilters,
    loadAll,
    handleScanNow,
    handleStatusChange,
    handleUpdateDetails,
    handleSaveConfig,
    handleSwitchProfile,
    handleSaveProfile,
  };
}
