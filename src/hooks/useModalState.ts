import { useState, useCallback } from 'react';
import { JobMatch } from '../types';

export type ModalType =
  | 'alert'
  | 'resume'
  | 'intel'
  | 'tailor'
  | 'cover_letter'
  | 'interview_prep'
  | 'jd_analyzer'
  | 'salary';

export interface ModalState {
  type: ModalType | null;
  job?: JobMatch | null;
  data?: any;
}

export function useModalState() {
  const [modal, setModal] = useState<ModalState>({ type: null, job: null });

  const openModal = useCallback((type: ModalType, job: JobMatch | null = null, data?: any) => {
    setModal({ type, job, data });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ type: null, job: null, data: undefined });
  }, []);

  return {
    modal,
    isOpen: (type: ModalType) => modal.type === type,
    activeJob: modal.job,
    activeData: modal.data,
    openModal,
    closeModal,
  };
}
