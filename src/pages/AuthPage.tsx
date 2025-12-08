import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { executeRecaptcha } from '../utils/recaptcha';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');

  // Password strength requirements
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const isPasswordStrong = !isLogin && Object.values(passwordRequirements).every(req => req);
  const showPasswordRequirements = !isLogin && password.length > 0;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('signup');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ email, password, name, recaptchaToken })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Show success message about email verification
      setModalType('success');
      setModalMessage(data.message || 'Account created successfully! Please check your email to verify your account before logging in.');
      setShowModal(true);
      
      // Reset form and switch to login
      setEmail('');
      setPassword('');
      setName('');
      setIsLogin(true);
      setIsForgotPassword(false);
    } catch (err) {
      setError('An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setModalType('error');
      setModalMessage('Please enter your email address.');
      setShowModal(true);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        setModalType('error');
        setModalMessage(`Failed to send reset email: ${error.message}`);
        setShowModal(true);
      } else {
        setModalType('success');
        setModalMessage('Password reset email sent successfully! Please check your inbox and follow the instructions to reset your password.');
        setShowModal(true);
        setIsLogin(true);
      }
    } catch (err) {
      setModalType('error');
      setModalMessage('An unexpected error occurred while sending the password reset email. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-center mb-6">
          {isForgotPassword ? 'Reset Password' : (isLogin ? 'Login to OnPlasy' : 'Create Account')}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Reset Password'}
            </button>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                  setError('');
                }}
                className="text-blue-600 hover:underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <>
            <form onSubmit={isLogin ? handleLogin : handleSignup}>
              {!isLogin && (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {showPasswordRequirements && (
                <div className="mb-4">
                  <div className={`flex items-center ${passwordRequirements.minLength ? 'text-green-500' : 'text-red-500'}`}>
                    <Check className="w-4 h-4 mr-2" />
                    At least 8 characters
                  </div>
                  <div className={`flex items-center ${passwordRequirements.hasUppercase ? 'text-green-500' : 'text-red-500'}`}>
                    <Check className="w-4 h-4 mr-2" />
                    At least one uppercase letter
                  </div>
                  <div className={`flex items-center ${passwordRequirements.hasLowercase ? 'text-green-500' : 'text-red-500'}`}>
                    <Check className="w-4 h-4 mr-2" />
                    At least one lowercase letter
                  </div>
                  <div className={`flex items-center ${passwordRequirements.hasNumber ? 'text-green-500' : 'text-red-500'}`}>
                    <Check className="w-4 h-4 mr-2" />
                    At least one number
                  </div>
                  <div className={`flex items-center ${passwordRequirements.hasSpecial ? 'text-green-500' : 'text-red-500'}`}>
                    <Check className="w-4 h-4 mr-2" />
                    At least one special character
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!isLogin && !isPasswordStrong)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-blue-600 hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
              </button>
            </div>

            {isLogin && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError('');
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <div className="mb-4">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                  modalType === 'success' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {modalType === 'success' ? (
                    <Check className="w-8 h-8 text-green-600" />
                  ) : (
                    <span className="text-red-600 text-3xl">✕</span>
                  )}
                </div>
              </div>
              <h3 className={`text-center mb-3 ${
                modalType === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {modalType === 'success' ? 'Success!' : 'Error'}
              </h3>
              <p className="text-center text-gray-700 mb-6">
                {modalMessage}
              </p>
              <button
                onClick={() => setShowModal(false)}
                className={`w-full py-3 rounded-lg text-white ${
                  modalType === 'success' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}