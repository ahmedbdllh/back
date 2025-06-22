import { useState } from 'react';
import { AuthService } from '../services/authService';

export const useManagerLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (email, password, recaptchaToken) => {
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return { success: false };
    }

    if (process.env.NODE_ENV === 'production' && !recaptchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      setIsLoading(false);
      return { success: false };
    }

    try {
      const { response, data } = await AuthService.managerLogin(email, password, recaptchaToken);

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
      }      // Handle login success
      const role = data.role || (data.user && data.user.role);
      const fullName = data.fullName || (data.user && data.user.fullName);
      const userEmail = data.email || (data.user && data.user.email);
      const token = data.token || (data.user && data.user.token);

      if (!role || typeof role !== "string") {
        setError("Access denied. User role is missing or invalid.");
        setIsLoading(false);
        return { success: false };
      }

      if (role.toLowerCase() !== "manager") {
        setError("Access denied. This account is not a manager account.");
        setIsLoading(false);
        return { success: false };
      }      localStorage.setItem("token", token);
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
    setError
  };
};
