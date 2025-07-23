// User and role constants
export const USER_ROLES = {
  PLAYER: 'Player',
  MANAGER: 'Manager'
};

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  MANAGER_SIGNUP: '/auth/manager/signup',
  PLAYER_SIGNUP: '/verification/player-signup',
  VERIFY_EMAIL: '/verification/verify-email',
  RESEND_VERIFICATION: '/verification/resend-verification',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VALIDATE_RESET_TOKEN: '/auth/validate-reset-token',
  VERIFY_2FA: '/2fa/login-verify',
  ENABLE_2FA: '/2fa/enable',
  VERIFY_2FA_SETUP: '/2fa/verify'
};

// Error codes
export const ERROR_CODES = {
  ACCOUNT_NOT_VERIFIED: 'ACCOUNT_NOT_VERIFIED',
  TWO_FA_REQUIRED: '2FA required',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED'
};

// Form validation schemas
export const createLoginData = (email, password, role, recaptchaToken = null) => ({
  email,
  password,
  role,
  ...(recaptchaToken && { recaptchaToken })
});

export const createPlayerSignupData = ({
  fullName,
  email,
  password,
  confirmPassword,
  preferredSports,
  phoneNumber,
  position,
  agreeToTerms
}) => ({
  fullName,
  email,
  password,
  confirmPassword,
  preferredSports,
  phoneNumber,
  position,
  agreeToTerms
});

export const createEmailVerificationData = (email, verificationCode, role) => ({
  email,
  verificationCode,
  role
});

export const createPasswordResetRequest = (email, role) => ({
  email,
  role
});

export const createTwoFactorData = (email, code, tempToken) => ({
  email,
  code,
  tempToken
});

// Helper functions for validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateRole = (role) => {
  return role === USER_ROLES.PLAYER || role === USER_ROLES.MANAGER;
};
