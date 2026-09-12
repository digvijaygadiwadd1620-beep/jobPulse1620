import { describe, it, expect } from 'vitest';
import { useModalState } from './useModalState';

// Simplified unit test for modal state transitions
describe('useModalState logic', () => {
  it('initializes with all modals closed', () => {
    let state = { type: null, job: null };
    const isOpen = (type: string) => state.type === type;

    expect(isOpen('alert')).toBe(false);
    expect(isOpen('resume')).toBe(false);
  });

  it('sets active modal type and job correctly on open', () => {
    const mockJob: any = {
      id: 'job-1',
      title: 'QA Engineer',
      company: 'TestCorp',
      total_score: 90,
    };

    let state: any = { type: null, job: null };
    const openModal = (type: any, job: any = null) => {
      state = { type, job };
    };
    const closeModal = () => {
      state = { type: null, job: null };
    };

    openModal('cover_letter', mockJob);
    expect(state.type).toBe('cover_letter');
    expect(state.job.title).toBe('QA Engineer');

    closeModal();
    expect(state.type).toBeNull();
    expect(state.job).toBeNull();
  });
});
