import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './utils/supabase/client';
import { projectId, publicAnonKey } from './utils/supabase/info';
import Header from './components/Header';

// Pages
import HomePage from './pages/HomePage';
import ListingDetailPage from './pages/ListingDetailPage';
import CreateListingPage from './pages/CreateListingPage';
import EditListingPage from './pages/EditListingPage';
import MessagesPage from './pages/MessagesPage';
import ConversationPage from './pages/ConversationPage';
import ProfilePage from './pages/ProfilePage';
import AccountPage from './pages/AccountPage';
import SavedListingsPage from './pages/SavedListingsPage';
import MyListingsPage from './pages/MyListingsPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import OffersPage from './pages/OffersPage';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [offersCount, setOffersCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    // Set a timeout to force loading to complete after 5 seconds
    const timeout = setTimeout(() => {
      if (mounted) {
        console.log('Loading timeout reached, forcing load complete');
        setLoading(false);
      }
    }, 5000);
    
    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      if (session?.user) {
        // Fetch full profile data
        const token = session.access_token;
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/profile`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          const data = await response.json();
          if (response.ok && data.profile) {
            setUser({ ...session.user, ...data.profile });
          } else {
            setUser(session.user);
          }
        } catch (error) {
          console.error('Profile fetch error:', error);
          // Silently handle profile fetch errors
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      clearTimeout(timeout);
    }).catch(error => {
      console.error('Session fetch error:', error);
      if (mounted) {
        setUser(null);
        setLoading(false);
        clearTimeout(timeout);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        // Fetch full profile data
        const token = session.access_token;
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/profile`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          const data = await response.json();
          if (response.ok && data.profile) {
            setUser({ ...session.user, ...data.profile });
          } else {
            setUser(session.user);
          }
        } catch (error) {
          console.error('Profile fetch error on auth change:', error);
          // Silently handle profile fetch errors
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Fetch unread message count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/unread-count`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        const data = await response.json();
        if (response.ok) {
          setUnreadCount(data.unread_count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();

    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Fetch offers count
  useEffect(() => {
    if (!user) {
      setOffersCount(0);
      return;
    }

    const fetchOffersCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/offers/count`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        const data = await response.json();
        if (response.ok) {
          setOffersCount(data.count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch offers count:', error);
      }
    };

    fetchOffersCount();

    // Poll for new offers every 30 seconds
    const interval = setInterval(fetchOffersCount, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleUserUpdate = (updatedUser: any) => {
    // Update user state when profile is updated
    setUser((prev: any) => ({ ...prev, ...updatedUser }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Header user={user} unreadCount={unreadCount} offersCount={offersCount} />
      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/signin" element={<Navigate to="/auth" replace />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/listing/:id" element={<ListingDetailPage user={user} />} />
        <Route 
          path="/create-listing" 
          element={user ? <CreateListingPage user={user} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/edit-listing/:id" 
          element={user ? <EditListingPage user={user} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/messages" 
          element={user ? <MessagesPage user={user} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/messages/:conversationId" 
          element={user ? <ConversationPage user={user} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/profile/:userId" 
          element={<ProfilePage currentUser={user} />} 
        />
        <Route 
          path="/account" 
          element={user ? <AccountPage user={user} onUserUpdate={handleUserUpdate} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/saved" 
          element={user ? <SavedListingsPage user={user} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/my-listings" 
          element={user ? <MyListingsPage user={user} /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/admin" 
          element={user ? <AdminPage user={user} /> : <Navigate to="/auth" />} 
        />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/offers" element={user ? <OffersPage user={user} /> : <Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
}