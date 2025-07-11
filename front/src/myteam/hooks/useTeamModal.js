import { useState, useCallback } from 'react';

export const useTeamModal = () => {
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [teamSport, setTeamSport] = useState('');
  const [error, setError] = useState('');

  const resetModal = useCallback(() => {
    setShowCreateTeamModal(false);
    setModalStep(1);
    setTeamName('');
    setTeamSport('');
    setError('');
  }, []);

  const handleNextStep = useCallback(() => {
    if (modalStep === 1) {
      if (!teamName.trim()) {
        setError('Please enter a team name');
        return;
      }
      if (!teamSport) {
        setError('Please select a sport');
        return;
      }
      setError('');
    }
    setModalStep(prev => Math.min(prev + 1, 3));
  }, [modalStep, teamName, teamSport]);

  const handleBackStep = useCallback(() => {
    if (modalStep === 1) {
      resetModal();
    } else {
      setModalStep(prev => Math.max(prev - 1, 1));
      setError('');
    }
  }, [modalStep, resetModal]);

  return {
    showCreateTeamModal,
    setShowCreateTeamModal,
    modalStep,
    teamName,
    setTeamName,
    teamSport,
    setTeamSport,
    error,
    setError,
    resetModal,
    handleNextStep,
    handleBackStep
  };
};
