import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../../core/layout/Navbar';
import { Footer } from '../../../core/layout/Footer';
import { PlayerResetPassword } from './PlayerResetPassword';
import { ManagerResetPassword } from './ManagerResetPassword';

const PasswordResetPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();  const [tokenValid, setTokenValid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Validate the reset token when component mounts
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/auth/validate-reset-token/${token}`);
        const data = await response.json();
          if (data.success) {
          setTokenValid(true);
          setUserRole(data.data?.role);
        } else {
          setTokenValid(false);
        }
      } catch (error) {
        console.error('Error validating token:', error);
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSuccess = () => {
    // Redirect to home page after successful password reset
    navigate('/', { replace: true });
  };

  const handleCancel = () => {
    // Redirect to home page if user cancels
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Validating reset token...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
              <p className="text-gray-400 mb-6">
                This password reset link is invalid or has expired. Please request a new password reset.
              </p>
              <button
                onClick={handleCancel}
                className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-md transition-colors duration-300"
              >
                Return to Home
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12">        <div className="w-full max-w-md">
          {userRole === 'Manager' ? (
            <ManagerResetPassword
              token={token}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          ) : (
            <PlayerResetPassword
              token={token}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PasswordResetPage;
