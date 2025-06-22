import { useState } from 'react';
import { AuthService } from '../services/authService';

export const usePlayerLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);

  const login = async (email, password) => {
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return { success: false };
    }

    try {
      const { response, data } = await AuthService.playerLogin(email, password);

      if (response.status === 401 && data.code === 'ACCOUNT_NOT_VERIFIED') {
        setError(data.msg || "Your account is not verified. Please check your email for the verification code.");
        setShowEmailVerificationModal(true);
        setIsLoading(false);
        return { success: false, requiresVerification: true };
      }

      if (response.status === 401 && (data.msg === '2FA required' || data.msg?.toLowerCase().includes('2fa')) && data.tempToken) {
        setIsLoading(false);
        return { 
          success: false, 
          requires2FA: true, 
          tempToken: data.tempToken 
        };
      }

      if (!response.ok) {
        throw new Error(data.msg || "Authentication failed");
      }

      // Handle login success
      const role = data.role || (data.user && data.user.role);
      const fullName = data.fullName || (data.user && data.user.fullName);
      const userEmail = data.email || (data.user && data.user.email);
      const token = data.token || (data.user && data.user.token);

      if (!role || typeof role !== "string") {
        setError("Access denied. User role is missing or invalid.");
        setIsLoading(false);
        return { success: false };
      }

      if (role.toLowerCase() !== "player") {
        setError("Access denied. This account is not a player account.");
        setIsLoading(false);
        return { success: false };
      }

      localStorage.setItem("token", token);
      const userDetails = {
        fullName: fullName,
        email: userEmail,
        role: role
      };
      localStorage.setItem("user", JSON.stringify(userDetails));

      window.dispatchEvent(new Event("authChange"));
      
      setIsLoading(false);
      return { success: true, data };

    } catch (error) {
      setError(error.message || "Sign in failed. Please check your credentials.");
      setIsLoading(false);
      return { success: false };
    }
  };

  return {
    login,
    isLoading,
    error,
    showEmailVerificationModal,
    setError,
    setShowEmailVerificationModal
  };
};
