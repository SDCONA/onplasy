import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Heart, MessageSquare, User, LogOut, FileText, Shield, Settings, ShieldCheck, DollarSign } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useTranslation } from '../translations';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  user: any;
  unreadCount?: number;
  offersCount?: number;
}

export default function Header({ user, unreadCount = 0, offersCount = 0 }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Check if user is admin
  const isAdmin = user?.is_admin === true;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Navigate to home - auth state change listener will update user state
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, navigate away
      navigate('/', { replace: true });
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <h1>
              <span className="text-green-600 font-bold">On</span>
              <span className="text-blue-600 font-bold">Plasy</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/messages" className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/offers" className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                  <DollarSign className="w-5 h-5" />
                  <span>Offers</span>
                  {offersCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {offersCount > 9 ? '9+' : offersCount}
                    </span>
                  )}
                </Link>
                <Link to="/saved" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span>Saved</span>
                </Link>
                <Link to={`/profile/${user.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                  <User className="w-5 h-5" />
                  <span>My Profile</span>
                </Link>
                <Link to="/account" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                  <Settings className="w-5 h-5" />
                  <span>Account</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Admin</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : null}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2">
            {/* Mobile Quick Links */}
            {user && (
              <div className="md:hidden flex items-center gap-1.5">
                <Link to="/messages" className="relative flex items-center justify-center w-10 h-10 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all">
                  <MessageSquare className="w-6 h-6" strokeWidth={2.5} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/offers" className="relative flex items-center justify-center w-10 h-10 rounded-xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all">
                  <DollarSign className="w-6 h-6" strokeWidth={2.5} />
                  {offersCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                      {offersCount > 9 ? '9+' : offersCount}
                    </span>
                  )}
                </Link>
                <Link to="/saved" className="flex items-center justify-center w-10 h-10 rounded-xl text-pink-600 bg-pink-50 hover:bg-pink-100 transition-all">
                  <Heart className="w-6 h-6" strokeWidth={2.5} />
                </Link>
                <Link to={`/profile/${user.id}`} className="flex items-center justify-center w-10 h-10 rounded-xl text-green-600 bg-green-50 hover:bg-green-100 transition-all">
                  <User className="w-6 h-6" strokeWidth={2.5} />
                </Link>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : user?.avatar_url ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 shadow-lg">
                  <ImageWithFallback
                    src={user.avatar_url}
                    alt={user.name || 'User'}
                    className="w-full h-full object-contain bg-white"
                  />
                </div>
              ) : user ? (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 shadow-lg">
                  <span className="text-gray-600 text-lg">{user.name?.[0] || 'U'}</span>
                </div>
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 flex flex-col gap-3">
            {user ? (
              <>
                <Link to="/account" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 px-2 py-2">
                  <Settings className="w-5 h-5" />
                  <span>Account Settings</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-2 text-purple-600 hover:text-purple-700 px-2 py-2">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <div className="border-b border-gray-200 pb-3 mb-3">
                  <p className="text-gray-500 mb-2 px-2">Legals</p>
                  <Link to="/terms" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 px-2 py-2">
                    <FileText className="w-5 h-5" />
                    <span>Terms of Service</span>
                  </Link>
                  <Link to="/privacy" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 px-2 py-2">
                    <Shield className="w-5 h-5" />
                    <span>Privacy Policy</span>
                  </Link>
                </div>
                <div className="border-b border-gray-200 pb-3 mb-3">
                  <p className="text-gray-500 mb-2 px-2">Language</p>
                  <div className="px-2">
                    <LanguageSwitcher />
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 text-left px-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors mx-2">
                  <User className="w-5 h-5" />
                  <span>Sign In</span>
                </Link>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="text-gray-500 mb-2 px-2">Legals</p>
                  <Link to="/terms" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 px-2 py-2">
                    <FileText className="w-5 h-5" />
                    <span>Terms of Service</span>
                  </Link>
                  <Link to="/privacy" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 px-2 py-2">
                    <Shield className="w-5 h-5" />
                    <span>Privacy Policy</span>
                  </Link>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="text-gray-500 mb-2 px-2">Language</p>
                  <div className="px-2">
                    <LanguageSwitcher />
                  </div>
                </div>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}