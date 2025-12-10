import { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Flag, Heart, FileText, Archive } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import ListingCard from '../components/ListingCard';
import ReportModal from '../components/ReportModal';

interface ProfilePageProps {
  currentUser: any;
}

export default function ProfilePage({ currentUser }: ProfilePageProps) {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  const [showReportModal, setShowReportModal] = useState(false);

  // Get the return path from location state, default to home
  const returnPath = (location.state as any)?.from || '/';

  useEffect(() => {
    fetchProfile();
    fetchListings();
    fetchReviews();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/profile/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings?userId=${userId}&status=active`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      if (data.listings) {
        setListings(data.listings);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/reviews/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      if (data.reviews) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Profile not found</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to={returnPath} className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Avatar in top-left corner */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <ImageWithFallback
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-full h-full object-contain bg-white"
                  />
                ) : (
                  <span className="text-gray-500 text-3xl">{profile.name[0]}</span>
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="mb-2">{profile.name}</h1>
                  
                  {/* Rating and registration date */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {profile.rating_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{profile.rating_average?.toFixed(1)}</span>
                        <span className="text-gray-400">({profile.rating_count})</span>
                      </div>
                    )}
                    <p className="text-gray-500">
                      Registered {formatDate(profile.created_at)}
                    </p>
                  </div>
                </div>
                {currentUser && currentUser.id !== userId && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                <div className="text-gray-600">
                  {listings.length} active listings
                </div>
              </div>

              {/* Quick Action Buttons - only show if viewing own profile */}
              {currentUser && currentUser.id === userId && (
                <div className="flex flex-wrap gap-3 mt-4">
                  <Link 
                    to="/my-listings"
                    state={{ from: 'profile' }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>My Listings</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('listings')}
                className={`px-6 py-3 ${
                  activeTab === 'listings'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Listings ({listings.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3 ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Reviews ({reviews.length})
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'listings' ? (
          listings.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <p className="text-gray-500">No active listings</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} user={currentUser} />
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            {reviews.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">No reviews yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {reviews.map((review) => (
                  <div key={review.id} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        {review.reviewer.avatar_url ? (
                          <ImageWithFallback
                            src={review.reviewer.avatar_url}
                            alt={review.reviewer.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-gray-500">{review.reviewer.name[0]}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p>{review.reviewer.name}</p>
                          <span className="text-gray-400 text-sm">
                            {formatDate(review.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>

                        {review.comment && (
                          <p className="text-gray-600">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showReportModal && (
        <ReportModal
          userId={userId}
          onClose={() => setShowReportModal(false)}
          user={currentUser}
        />
      )}
    </div>
  );
}