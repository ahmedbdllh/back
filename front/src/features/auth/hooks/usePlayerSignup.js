import { useState } from 'react';
import { AuthService } from '../services/authService';

export const usePlayerSignup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const signup = async (userData) => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const { response, data } = await AuthService.playerSignup(userData);

      if (!response.ok) {
        const errorMessage = data.msg || 
          (data.errors && data.errors[0].msg) || 
          "Player registration failed";
        throw new Error(errorMessage);
      }

      setSuccessMessage(data.msg || "Registration successful! Please check your email for verification.");
      setUserEmail(userData.email);
      setShowVerificationModal(true);
      setIsLoading(false);
      return { success: true, data };

    } catch (error) {
      setError(error.message || "An error occurred during player signup.");
      setIsLoading(false);
      return { success: false };
    }
  };

  const resetState = () => {
    setError("");
    setSuccessMessage("");
    setShowVerificationModal(false);
    setUserEmail("");
  };

  return {
    signup,
    resetState,
    isLoading,
    error,
    successMessage,
    showVerificationModal,
    userEmail,
    setError,
    setSuccessMessage,
    setShowVerificationModal,
    setUserEmail
  };
};
