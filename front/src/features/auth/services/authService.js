const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export class AuthService {
  // Manager login
  static async managerLogin(email, password, recaptchaToken) {
    const requestBody = { 
      email, 
      password, 
      role: "Manager",
      recaptchaToken 
    };
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return { response, data };
  }

  // Player login
  static async playerLogin(email, password) {
    const requestBody = { email, password, role: "Player" };
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return { response, data };
  }

  // Manager signup
  static async managerSignup(formData) {
    const response = await fetch(`${API_BASE_URL}/auth/manager/signup`, {
      method: "POST",
      body: formData, // FormData for file upload
    });

    const data = await response.json();
    return { response, data };
  }

  // Player signup
  static async playerSignup(userData) {
    const response = await fetch(`${API_BASE_URL}/verification/player-signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    return { response, data };
  }

  // Email verification
  static async verifyEmail(email, verificationCode, role) {
    const response = await fetch(`${API_BASE_URL}/verification/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        verificationCode,
        role,
      }),
    });

    const data = await response.json();
    return { response, data };
  }

  // Resend verification code
  static async resendVerificationCode(email, role) {
    const response = await fetch(`${API_BASE_URL}/verification/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, role }),
    });

    const data = await response.json();
    return { response, data };
  }

  // Forgot password
  static async forgotPassword(email, role) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, role }),
    });

    const data = await response.json();
    return { response, data };
  }

  // Reset password
  static async resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: newPassword }),
    });

    const data = await response.json();
    return { response, data };
  }

  // Validate reset token
  static async validateResetToken(token) {
    const response = await fetch(`${API_BASE_URL}/auth/validate-reset-token/${token}`);
    const data = await response.json();
    return { response, data };
  }

  // 2FA login verification
  static async verify2FA(email, code, tempToken) {
    const response = await fetch(`${API_BASE_URL}/2fa/login-verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code, tempToken }),
    });

    const data = await response.json();
    return { response, data };
  }

  // 2FA enable
  static async enable2FA(userId) {
    const response = await fetch(`${API_BASE_URL}/2fa/enable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    return { response, data };
  }

  // 2FA verify setup
  static async verify2FASetup(userId, verificationCode, secret) {
    const response = await fetch(`${API_BASE_URL}/2fa/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ userId, verificationCode, secret }),
    });

    const data = await response.json();
    return { response, data };
  }
}
