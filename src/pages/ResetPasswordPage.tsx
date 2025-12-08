import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { Check } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');

  // Password strength requirements
  const passwordRequirements = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
  };

  const isPasswordStrong = Object.values(passwordRequirements).every(req => req);
  const showPasswordRequirements = newPassword.length > 0;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordStrong) {
      setModalType('error');
      setModalMessage('Password does not meet security requirements. Please ensure your password contains at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.');
      setShowModal(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalType('error');
      setModalMessage('Passwords do not match. Please make sure both password fields are identical.');
      setShowModal(true);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setModalType('error');
        setModalMessage(`Failed to reset password: ${error.message}`);
        setShowModal(true);
      } else {
        setModalType('success');
        setModalMessage('Password reset successfully! You will be redirected to the login page.');
        setShowModal(true);
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    } catch (err) {
      setModalType('error');
      setModalMessage('An unexpected error occurred while resetting your password. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-center mb-6">Reset Password</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleResetPassword}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
            />
          </div>

          {showPasswordRequirements && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">Password must contain:</p>
              <div className="space-y-1">
                <div className={`flex items-center text-sm ${passwordRequirements.minLength ? 'text-green-600' : 'text-red-500'}`}>
                  <Check className="w-4 h-4 mr-2" />
                  At least 8 characters
                </div>
                <div className={`flex items-center text-sm ${passwordRequirements.hasUppercase ? 'text-green-600' : 'text-red-500'}`}>
                  <Check className="w-4 h-4 mr-2" />
                  At least one uppercase letter
                </div>
                <div className={`flex items-center text-sm ${passwordRequirements.hasLowercase ? 'text-green-600' : 'text-red-500'}`}>
                  <Check className="w-4 h-4 mr-2" />
                  At least one lowercase letter
                </div>
                <div className={`flex items-center text-sm ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                  <Check className="w-4 h-4 mr-2" />
                  At least one number
                </div>
                <div className={`flex items-center text-sm ${passwordRequirements.hasSpecial ? 'text-green-600' : 'text-red-500'}`}>
                  <Check className="w-4 h-4 mr-2" />
                  At least one special character
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordStrong || newPassword !== confirmPassword}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>

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
  );
}
