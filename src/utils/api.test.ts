import { describe, it, expect } from 'vitest';
import { api } from './api';

describe('JobPulse API Client', () => {
  it('exposes essential CRUD methods for matches, resumes, and alerts', () => {
    expect(typeof api.getJobs).toBe('function');
    expect(typeof api.getStats).toBe('function');
    expect(typeof api.triggerScan).toBe('function');
    expect(typeof api.updateMatchStatus).toBe('function');
    expect(typeof api.getResumes).toBe('function');
    expect(typeof api.saveResume).toBe('function');
    expect(typeof api.activateResume).toBe('function');
    expect(typeof api.deleteResume).toBe('function');
    expect(typeof api.getAlertConfig).toBe('function');
    expect(typeof api.saveAlertConfig).toBe('function');
    expect(typeof api.generateCoverLetter).toBe('function');
    expect(typeof api.generateInterviewPrep).toBe('function');
    expect(typeof api.generateResumeTailor).toBe('function');
  });
});
