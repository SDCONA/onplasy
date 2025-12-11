import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, User, Lock, MapPin, Mail, Check, Bell } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import ImageCropperModal from '../components/ImageCropperModal';

interface AccountPageProps {
  user: any;
  onUserUpdate: (user: any) => void;
}

export default function AccountPage({ user, onUserUpdate }: AccountPageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const hasFetchedProfile = useRef(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification preferences
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [prefsLoading, setPrefsLoading] = useState(false);

  // Modal state for password change feedback
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');

  // Image cropper modal state
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');

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

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Reset the fetch flag when user changes
    hasFetchedProfile.current = false;
    
    // Fetch profile when user is available
    if (!hasFetchedProfile.current) {
      hasFetchedProfile.current = true;
      fetchProfile();
      fetchNotificationPreferences();
    }
  }, [user?.id]); // Re-run when user ID changes

  const fetchProfile = async () => {
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        navigate('/auth');
        return;
      }

      console.log('Fetching profile for user:', user.id, 'Session user:', session.user.id);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/profile`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      
      if (!response.ok) {
        console.error('Profile fetch failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        // Set a basic profile so the page can still load
        setProfile({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          city: '',
          zipcode: '',
          avatar_url: session.user.user_metadata?.avatar_url || ''
        });
        setName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User');
        setEmail(session.user.email || '');
        setCity('');
        setZipcode('');
        setAvatarUrl(session.user.user_metadata?.avatar_url || '');
        toast.error('Failed to load profile data');
        return;
      }
      
      const data = await response.json();
      console.log('Profile fetched:', data.profile);
      if (data.profile) {
        setProfile(data.profile);
        setName(data.profile.name || '');
        setEmail(data.profile.email || '');
        setCity(data.profile.city || '');
        setZipcode(data.profile.zipcode || '');
        setAvatarUrl(data.profile.avatar_url || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Try to get whatever session data we have
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Set a basic profile so the page can still load
        setProfile({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          city: '',
          zipcode: '',
          avatar_url: session.user.user_metadata?.avatar_url || ''
        });
        setName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User');
        setEmail(session.user.email || '');
        setCity('');
        setZipcode('');
        setAvatarUrl(session.user.user_metadata?.avatar_url || '');
      } else {
        navigate('/auth');
      }
      toast.error('Failed to load profile');
    }
  };

  const fetchNotificationPreferences = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to fetch notification preferences');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/notification-preferences`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        console.error('Notification preferences fetch failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        toast.error('Failed to load notification preferences');
        return;
      }

      const data = await response.json();
      console.log('Notification preferences fetched:', data.preferences);
      if (data.preferences) {
        setEmailNotificationsEnabled(data.preferences.email_notifications_enabled);
      }
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      toast.error('Failed to load notification preferences');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create temporary URL for cropper
    const imageUrl = URL.createObjectURL(file);
    setTempImageUrl(imageUrl);
    setShowCropper(true);
  };

  const handleCroppedImageSave = async (croppedBlob: Blob) => {
    setUploading(true);
    setShowCropper(false);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to upload images');
        return;
      }

      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.jpg');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/upload-image?type=avatar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        }
      );

      const data = await response.json();
      if (data.url) {
        console.log('Avatar uploaded, URL:', data.url);
        setAvatarUrl(data.url);
        toast.success('Avatar uploaded successfully');
      } else {
        console.error('No URL in response:', data);
        toast.error('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
      // Clean up temporary URL
      if (tempImageUrl) {
        URL.revokeObjectURL(tempImageUrl);
        setTempImageUrl('');
      }
    }
  };

  const handleCropperCancel = () => {
    setShowCropper(false);
    // Clean up temporary URL
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl('');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalType('error');
      setModalMessage('Name is required. Please enter your name to continue.');
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setModalType('error');
        setModalMessage('Please sign in to update your profile.');
        setShowModal(true);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/profile`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            city,
            zipcode,
            avatar_url: avatarUrl
          })
        }
      );

      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
        setModalType('success');
        setModalMessage('Profile updated successfully! Your changes have been saved.');
        setShowModal(true);
        // Update the user in parent component
        onUserUpdate(data.profile);
      } else {
        setModalType('error');
        setModalMessage(`Failed to update profile: ${data.error || 'Unknown error occurred. Please try again.'}`);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setModalType('error');
      setModalMessage('An unexpected error occurred while updating your profile. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setModalType('error');
      setModalMessage('Please fill in all password fields');
      setShowModal(true);
      return;
    }

    if (!isPasswordStrong) {
      setModalType('error');
      setModalMessage('Password does not meet security requirements. Please ensure your password contains at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.');
      setShowModal(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalType('error');
      setModalMessage('New passwords do not match. Please make sure both password fields are identical.');
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setModalType('error');
        setModalMessage('Please sign in to change your password.');
        setShowModal(true);
        setLoading(false);
        return;
      }

      // First verify the old password by trying to sign in with it
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword
      });

      if (verifyError) {
        setModalType('error');
        setModalMessage('Current password is incorrect. Please enter your current password correctly.');
        setShowModal(true);
        setLoading(false);
        return;
      }

      // Update password through Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setModalType('error');
        setModalMessage(`Failed to change password: ${error.message}`);
        setShowModal(true);
      } else {
        setModalType('success');
        setModalMessage('Password changed successfully! Your password has been updated.');
        setShowModal(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Change password error:', error);
      setModalType('error');
      setModalMessage('An unexpected error occurred while changing your password. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmailNotifications = async () => {
    setPrefsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to update notification preferences');
        setPrefsLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/notification-preferences`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email_notifications_enabled: !emailNotificationsEnabled
          })
        }
      );

      const data = await response.json();
      if (data.preferences) {
        setEmailNotificationsEnabled(data.preferences.email_notifications_enabled);
        toast.success(
          data.preferences.email_notifications_enabled 
            ? 'Email notifications enabled' 
            : 'Email notifications disabled'
        );
      } else {
        toast.error(`Failed to update preferences: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update notification preferences error:', error);
      toast.error('Failed to update notification preferences');
    } finally {
      setPrefsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1>My Account</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-3 flex items-center gap-2 ${
                  activeTab === 'security'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Lock className="w-4 h-4" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-6 py-3 flex items-center gap-2 ${
                  activeTab === 'notifications'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </button>
            </div>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleUpdateProfile}>
              {/* Avatar Upload */}
              <div className="mb-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Avatar failed to load:', avatarUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Avatar loaded successfully:', avatarUrl);
                        }}
                      />
                    ) : (
                      <span className="text-gray-400 text-5xl uppercase">{name[0] || 'U'}</span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-colors">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {uploading && (
                  <p className="text-sm text-blue-600">Uploading avatar...</p>
                )}
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                  required
                />
              </div>

              {/* Email (read-only) */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* City */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your city"
                />
              </div>

              {/* Zipcode */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  Zipcode
                </label>
                <input
                  type="text"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your zipcode"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="mb-6">Change Password</h2>
            <form onSubmit={handleChangePassword}>
              {/* Current Password */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                />
              </div>

              {/* New Password */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
              </div>

              {/* Password Requirements */}
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

              {/* Confirm Password */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading || (newPassword.length > 0 && !isPasswordStrong) || newPassword !== confirmPassword}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="mb-6">Notification Preferences</h2>
            
            <div className="space-y-4">
              {/* Email Notifications Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <h3 className="text-gray-900">Email Notifications</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Receive email notifications when you have new unread messages
                  </p>
                </div>
                <button
                  onClick={handleToggleEmailNotifications}
                  disabled={prefsLoading}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  } ${prefsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      emailNotificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Email notifications are sent every 30 minutes if you have new unread messages. You will only be notified once per message.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Password Change Modal */}
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

      {/* Image Cropper Modal */}
      {showCropper && tempImageUrl && (
        <ImageCropperModal
          imageUrl={tempImageUrl}
          onSave={handleCroppedImageSave}
          onCancel={handleCropperCancel}
        />
      )}
    </div>
  );
}