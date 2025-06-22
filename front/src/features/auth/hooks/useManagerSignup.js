import { useState } from 'react';
import { AuthService } from '../services/authService';

export const useManagerSignup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const signup = async (formData) => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const { response, data } = await AuthService.managerSignup(formData);

      if (!response.ok) {
        const errorMessage = data.msg || 
          (data.errors && data.errors[0].msg) || 
          "Manager registration failed";
        throw new Error(errorMessage);
      }

      setSuccessMessage(data.msg || "Manager registration successful! Please check your email to verify your account.");
      setIsLoading(false);
      return { success: true, data };

    } catch (error) {
      setError(error.message || "An error occurred during manager registration.");
      setIsLoading(false);
      return { success: false };
    }
  };

  const resetState = () => {
    setError("");
    setSuccessMessage("");
  };

  return {
    signup,
    resetState,
    isLoading,
    error,
    successMessage,
    setError,
    setSuccessMessage
  };
};
