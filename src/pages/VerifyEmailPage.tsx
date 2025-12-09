import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    // Check URL hash for tokens
    const hash = window.location.hash;
    
    if (hash && hash.includes('access_token')) {
      // Email verification successful
      setStatus('success');
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else if (hash && hash.includes('error')) {
      // Verification failed
      setStatus('error');
    } else {
      // No hash, redirect to home
      navigate('/');
    }
  }, [navigate]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="mb-2">Verifying Email...</h1>
          <p className="text-gray-600">Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-green-600 mb-2">Email Verified!</h1>
          <p className="text-gray-600 mb-4">
            Your email has been successfully verified. You can now log in to your account.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to home page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
          <X className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-red-600 mb-2">Verification Failed</h1>
        <p className="text-gray-600 mb-6">
          We couldn't verify your email address. The link may have expired or is invalid.
        </p>
        <button
          onClick={() => navigate('/auth')}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
