import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../shared/constants/config';
import ReCaptchaV3 from '../../../shared/ui/components/ReCaptchaV3';

const AdminSignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Execute reCAPTCHA v3 before submitting
    let recaptchaToken = "";
    if (recaptchaRef.current) {
      try {
        recaptchaToken = await recaptchaRef.current.executeRecaptcha();
        if (!recaptchaToken) {
          setError("reCAPTCHA verification failed. Please try again.");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("reCAPTCHA error:", error);
        setError("reCAPTCHA verification failed. Please try again.");
        setLoading(false);
        return;
      }
    }

    try {
      const response = await axios.post(`${API_URL}/auth/login`, { // Assuming an admin login endpoint
        email,
        password,
        role: 'Admin', // Added role for admin login
        recaptchaToken
      });

      if (response.data.success && response.data.user) { // Added check for response.data.user
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({ 
          fullName: response.data.user.fullName || 'Admin',
          email: response.data.user.email,
          role: response.data.user.role || 'Admin' // Ensure role is set
        }));
        
        // Dispatch a custom event to notify Navbar or other components of auth change
        window.dispatchEvent(new CustomEvent('authChange'));
        
        navigate('/dashboard'); // Redirect to dashboard or admin-specific area
      } else if (response.data.success && !response.data.user) {
        setError('Login successful, but user data is missing. Please contact support.');
        console.error('Admin login error: User data missing in response', response.data);
      } else {
        setError(response.data.msg || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred. Please try again.');
      console.error('Admin login error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020817] p-4">
      <div className="w-full max-w-md">
        <div className="p-6 sm:p-8 bg-[#0F172A] rounded-xl shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-6 sm:mb-8">
            Admin Sign In
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition duration-200"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition duration-200"
                placeholder="••••••••"
              />
            </div>            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 p-2.5 rounded-md text-center">
                {error}
              </p>
            )}

            {/* reCAPTCHA v3 (invisible) */}
            <ReCaptchaV3
              ref={recaptchaRef}
              siteKey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
              action="admin_login"
              onError={() => setError("reCAPTCHA verification failed. Please try again.")}
            />

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSignInPage;
