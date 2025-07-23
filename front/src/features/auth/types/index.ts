// User and role types
export type UserRole = 'Player' | 'Manager';

export interface User {
  id?: string;
  email: string;
  fullName: string;
  role: UserRole;
  isVerified?: boolean;
  has2FA?: boolean;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Login types
export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
  recaptchaToken?: string;
}

export interface LoginResponse {
  token?: string;
  user?: User;
  role?: UserRole;
  fullName?: string;
  email?: string;
  msg?: string;
  tempToken?: string;
  requires2FA?: boolean;
}

// Signup types
export interface PlayerSignupData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  preferredSports: string[];
  phoneNumber: string;
  position: string;
  agreeToTerms: boolean;
}

export interface ManagerSignupFormData extends FormData {
  // FormData for file uploads, contains:
  // fullName, email, companyName, cin, phoneNumber, attachment, agreeToTerms, recaptchaToken
}

// Verification types
export interface EmailVerificationData {
  email: string;
  verificationCode: string;
  role: UserRole;
}

export interface VerificationResponse {
  token?: string;
  user?: User;
  msg?: string;
}

// Password reset types
export interface PasswordResetRequest {
  email: string;
  role: UserRole;
}

export interface PasswordResetData {
  password: string;
}

export interface ResetTokenValidation {
  success: boolean;
  data?: {
    role?: UserRole;
  };
  msg?: string;
}

// 2FA types
export interface TwoFactorVerificationData {
  email: string;
  code: string;
  tempToken: string;
}

export interface TwoFactorSetupData {
  userId: string;
  verificationCode: string;
  secret: string;
}

export interface TwoFactorEnableData {
  userId: string;
}

export interface TwoFactorResponse {
  token?: string;
  secret?: string;
  qrCodeUrl?: string;
  recoveryCodes?: string[];
  msg?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  msg?: string;
  code?: string;
  errors?: Array<{
    msg: string;
    field?: string;
  }>;
}

// Hook return types
export interface UseManagerLoginReturn {
  login: (email: string, password: string, recaptchaToken?: string) => Promise<{
    success: boolean;
    requires2FA?: boolean;
    tempToken?: string;
    data?: LoginResponse;
  }>;
  isLoading: boolean;
  error: string;
  setError: (error: string) => void;
}

export interface UsePlayerLoginReturn {
  login: (email: string, password: string) => Promise<{
    success: boolean;
    requiresVerification?: boolean;
    requires2FA?: boolean;
    tempToken?: string;
    data?: LoginResponse;
  }>;
  isLoading: boolean;
  error: string;
  showEmailVerificationModal: boolean;
  setError: (error: string) => void;
  setShowEmailVerificationModal: (show: boolean) => void;
}

export interface UseEmailVerificationReturn {
  verifyEmail: (email: string, verificationCode: string, role: UserRole) => Promise<{
    success: boolean;
    data?: VerificationResponse;
  }>;
  resendVerificationCode: (email: string, role: UserRole) => Promise<{
    success: boolean;
    data?: ApiResponse;
  }>;
  isVerifying: boolean;
  verificationError: string;
  isResendingCode: boolean;
  resendStatus: { message: string; type: string };
  setVerificationError: (error: string) => void;
  setResendStatus: (status: { message: string; type: string }) => void;
}

export interface UsePasswordResetReturn {
  requestPasswordReset: (email: string, role: UserRole) => Promise<{
    success: boolean;
    data?: ApiResponse;
  }>;
  resetState: () => void;
  isLoading: boolean;
  status: { message: string; type: string };
  isEmailSent: boolean;
  setStatus: (status: { message: string; type: string }) => void;
  setIsEmailSent: (sent: boolean) => void;
}

export interface UseResetPasswordReturn {
  resetPassword: (password: string, confirmPassword: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  isLoading: boolean;
  error: string;
  isTokenValid: boolean | null;
  isCheckingToken: boolean;
  setError: (error: string) => void;
}

export interface UseTwoFactorAuthReturn {
  verify2FA: (email: string, code: string, tempToken: string) => Promise<{
    success: boolean;
    data?: TwoFactorResponse;
  }>;
  enable2FA: (userId: string) => Promise<{
    success: boolean;
    data?: TwoFactorResponse;
  }>;
  verify2FASetup: (userId: string, verificationCode: string, secret: string) => Promise<{
    success: boolean;
    data?: TwoFactorResponse;
  }>;
  isLoading: boolean;
  error: string;
  setError: (error: string) => void;
}

export interface UseManagerSignupReturn {
  signup: (formData: ManagerSignupFormData) => Promise<{
    success: boolean;
    data?: ApiResponse;
  }>;
  resetState: () => void;
  isLoading: boolean;
  error: string;
  successMessage: string;
  setError: (error: string) => void;
  setSuccessMessage: (message: string) => void;
}

export interface UsePlayerSignupReturn {
  signup: (userData: PlayerSignupData) => Promise<{
    success: boolean;
    data?: ApiResponse;
  }>;
  resetState: () => void;
  isLoading: boolean;
  error: string;
  successMessage: string;
  showVerificationModal: boolean;
  userEmail: string;
  setError: (error: string) => void;
  setSuccessMessage: (message: string) => void;
  setShowVerificationModal: (show: boolean) => void;
  setUserEmail: (email: string) => void;
}

// Component prop types
export interface AuthComponentProps {
  onClose?: () => void;
  onSwitchToManager?: () => void;
  onSwitchToPlayer?: () => void;
  onSwitchToSignUp?: () => void;
  onSwitchToSignIn?: () => void;
  onSwitchToPasswordReset?: () => void;
  onSwitchToForgotPassword?: () => void;
  on2FARequired?: (email: string, tempToken: string, onSuccess: (data: any) => void) => void;
}

// Error types
export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}
