
import React, { useState } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

interface AuthProps {
  onLogin: (token: string) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password';

const Auth = ({ onLogin }: AuthProps) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleAuthSuccess = () => {
    // The useAuth hook will handle the actual authentication state
    // We just need to trigger the onLogin callback with a placeholder
    onLogin('authenticated');
  };

  const renderAuthForm = () => {
    switch (authMode) {
      case 'login':
        return (
          <LoginForm
            onSwitchToSignup={() => setAuthMode('signup')}
            onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
            onLoginSuccess={handleAuthSuccess}
          />
        );
      case 'signup':
        return (
          <SignupForm
            onLogin={handleAuthSuccess}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onBackToLogin={() => setAuthMode('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AuthLayout>
      {renderAuthForm()}
    </AuthLayout>
  );
};

export default Auth;
