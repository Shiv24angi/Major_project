import React from 'react';
import { LoginPage } from '../components/ui/sign-in-page';

export default function AuthPage() {
  const isSignUp = typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('signup');

  return (
    <div className="min-h-screen w-full">
      <LoginPage defaultSignUp={isSignUp} />
    </div>
  );
}
