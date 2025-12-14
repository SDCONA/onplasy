import { useState, useEffect } from 'react';
import { X, MessageCircle, Flag, Star, ArrowLeft, Heart, Share2, MapPin, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ImageWithFallback } from './figma/ImageWithFallback';
import ReportModal from './ReportModal';
import MakeOfferModal from './MakeOfferModal';
import { supabase } from '../utils/supabase/client';

interface ListingPreviewModalProps {
  listingId: string;
  onClose: () => void;
  user: any;
}

type ModalView = 
  | { type: 'listing'; listingId: string }
  | { type: 'profile'; profileId: string };

export default function ListingPreviewModal({ listingId, onClose, user }: ListingPreviewModalProps) {
  const navigate = useNavigate();
  const [viewStack, setViewStack] = useState<ModalView[]>([{ type: 'listing', listingId }]);
  const [listing, setListing] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileListings, setProfileListings] = useState<any[]>([]);
  const [profileReviews, setProfileReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('listings');
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showMakeOfferModal, setShowMakeOfferModal] = useState(false);

  const currentView = viewStack[viewStack.length - 1];

  // Get direct image URL (single URL system)
  const getImageUrl = (image: any) => {
    return image;  // Simply return the URL string
  };

  useEffect(() => {
    if (currentView.type === 'listing') {
      fetchListing();
    } else if (currentView.type === 'profile') {
      fetchProfile();
    }
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [currentView]);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings/${(currentView as any).listingId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      if (data.listing) {
        setListing(data.listing);
        
        // Check if listing is saved
        if (user) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (token) {
              const savedResponse = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/saved-listings/check/${data.listing.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }
              );
              if (savedResponse.ok) {
                const savedData = await savedResponse.json();
                setIsSaved(savedData.isSaved || false);
              }
            }
          } catch (error) {
            // Silently fail - saved listings feature not yet implemented
            console.log('Saved listings feature not available yet');
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const profileId = (currentView as any).profileId;
      const [profileRes, listingsRes, reviewsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/profile/${profileId}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings?userId=${profileId}&status=active`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/reviews/${profileId}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
      ]);
      
      const profileData = await profileRes.json();
      const listingsData = await listingsRes.json();
      const reviewsData = await reviewsRes.json();
      
      if (profileData.profile) {
        setProfile(profileData.profile);
        setProfileListings(listingsData.listings || []);
        setProfileReviews(reviewsData.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const conversationId = [user.id, listing.user_id].sort().join('-') + '-' + listing.id;
    navigate(`/messages/${conversationId}?listingId=${listing.id}&recipientId=${listing.user_id}`);
  };

  const handleMakeOffer = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowMakeOfferModal(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBack = () => {
    if (viewStack.length > 1) {
      setViewStack(viewStack.slice(0, -1));
    } else {
      onClose();
    }
  };

  const openProfile = (profileId: string) => {
    setViewStack([...viewStack, { type: 'profile', profileId }]);
  };

  const openListing = (listingId: string) => {
    setViewStack([...viewStack, { type: 'listing', listingId }]);
  };

  const handleSave = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (isSaved) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/saved-listings/${listing.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setIsSaved(false);
      } else {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/saved-listings`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ listing_id: listing.id })
          }
        );
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Failed to save listing:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/listing/${listing.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out this listing: ${listing.title}`,
          url: shareUrl
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        // Clipboard API blocked - silently fail
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {viewStack.length > 1 && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2>{currentView.type === 'listing' ? 'Listing Details' : 'Profile'}</h2>
            {currentView.type === 'listing' && listing && (
              <button
                onClick={() => navigate(`/listing/${listing.id}`)}
                className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 border border-blue-600 rounded-lg"
              >
                Open Full Page
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {currentView.type === 'listing' && listing && (
              <>
                <button
                  onClick={handleShare}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
                
                {user && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                    />
                  </button>
                )}
              </>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : currentView.type === 'listing' && listing ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Images */}
              <div>
                <div className="rounded-lg overflow-hidden mb-4 cursor-pointer" onClick={() => setShowFullscreenImage(true)}>
                  <div className="aspect-square">
                    {listing.images && listing.images.length > 0 ? (
                      <ImageWithFallback
                        src={getImageUrl(listing.images[selectedImage])}
                        alt={listing.title}
                        className="w-full h-full object-contain hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                </div>

                {listing.images && listing.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {listing.images.map((image: any, index: number) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(index);
                        }}
                        className={`w-16 h-16 rounded-lg overflow-hidden ${
                          selectedImage === index ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <ImageWithFallback
                          src={getImageUrl(image)}
                          alt={`${listing.title} ${index + 1}`}
                          className="w-full h-full object-contain bg-gray-100"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="mb-2">{listing.title}</h3>
                    <p className="text-blue-600">{formatPrice(listing.price)}</p>
                  </div>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                </div>

                {listing.categories && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {listing.categories.name}
                    </span>
                    {listing.subcategories && (
                      <span className="inline-block ml-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                        {listing.subcategories.name}
                      </span>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
                </div>

                {/* Location - Show for all listings */}
                {listing.zip_code && !listing.real_estate_details && (
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-gray-500 text-sm">Location</p>
                      <button
                        onClick={() => setShowMapModal(true)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>View Map</span>
                      </button>
                    </div>
                    <p className="text-sm">{listing.zip_code}</p>
                  </div>
                )}

                {listing.real_estate_details && (
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4>Property Details</h4>
                      <button
                        onClick={() => setShowMapModal(true)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>View Map</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Listing Type</p>
                        <p className="capitalize">
                          {listing.real_estate_details.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Property Type</p>
                        <p className="capitalize">{listing.real_estate_details.property_type}</p>
                      </div>
                      {listing.real_estate_details.bedrooms && (
                        <div>
                          <p className="text-gray-500">Bedrooms</p>
                          <p>{listing.real_estate_details.bedrooms}</p>
                        </div>
                      )}
                      {listing.real_estate_details.bathrooms && (
                        <div>
                          <p className="text-gray-500">Bathrooms</p>
                          <p>{listing.real_estate_details.bathrooms}</p>
                        </div>
                      )}
                      {listing.real_estate_details.square_feet && (
                        <div>
                          <p className="text-gray-500">Square Feet</p>
                          <p>{listing.real_estate_details.square_feet.toLocaleString()}</p>
                        </div>
                      )}
                      {listing.real_estate_details.lot_size && (
                        <div>
                          <p className="text-gray-500">Lot Size</p>
                          <p>{listing.real_estate_details.lot_size.toLocaleString()} sq ft</p>
                        </div>
                      )}
                      {listing.real_estate_details.year_built && (
                        <div>
                          <p className="text-gray-500">Year Built</p>
                          <p>{listing.real_estate_details.year_built}</p>
                        </div>
                      )}
                      {listing.real_estate_details.parking_spaces && (
                        <div>
                          <p className="text-gray-500">Parking Spaces</p>
                          <p>{listing.real_estate_details.parking_spaces}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Amenities */}
                    {listing.real_estate_details.amenities && listing.real_estate_details.amenities.length > 0 && (
                      <div className="mt-3">
                        <p className="text-gray-500 text-sm mb-2">Amenities</p>
                        <div className="flex flex-wrap gap-2">
                          {listing.real_estate_details.amenities.map((amenity: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <p className="text-gray-500 text-sm">Address</p>
                      <p className="text-sm">{listing.real_estate_details.address}</p>
                      <p className="text-sm">{listing.real_estate_details.city}, {listing.real_estate_details.state} {listing.real_estate_details.zip_code}</p>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <p className="text-gray-500 text-sm">Posted on {formatDate(listing.created_at)}</p>
                  <p className="text-gray-500 text-sm">{listing.views} views</p>
                </div>

                {/* Seller Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Seller Information</p>
                  <button
                    onClick={() => openProfile(listing.profiles.id)}
                    className="w-full flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {listing.profiles.avatar_url ? (
                        <ImageWithFallback
                          src={listing.profiles.avatar_url}
                          alt={listing.profiles.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-gray-500">{listing.profiles.name[0]}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm">{listing.profiles.name}</p>
                      {listing.profiles.rating_count > 0 && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-600">
                              {listing.profiles.rating_average?.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            ({listing.profiles.rating_count} reviews)
                          </span>
                        </div>
                      )}
                      {listing.profiles.created_at && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Registered {new Date(listing.profiles.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  </button>
                </div>

                {(!user || user?.id !== listing.user_id) && (
                  <div className="space-y-3">
                    <button
                      onClick={handleMakeOffer}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-5 h-5" />
                      <span>Make an Offer</span>
                    </button>
                    <button
                      onClick={handleContact}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Contact Seller</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : currentView.type === 'profile' && profile ? (
          <div className="p-6">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
              <div className="w-24 h-24 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {profile.avatar_url ? (
                  <ImageWithFallback
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500 text-3xl">{profile.name[0]}</span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="mb-2">{profile.name}</h3>
                    <p className="text-gray-600">Member since {formatDate(profile.created_at)}</p>
                  </div>
                </div>

                {profile.rating_count > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span>{profile.rating_average?.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-600">
                      ({profile.rating_count} {profile.rating_count === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab('listings')}
                  className={`pb-3 border-b-2 transition-colors ${
                    activeTab === 'listings'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Listings ({profileListings.length})
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-3 border-b-2 transition-colors ${
                    activeTab === 'reviews'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Reviews ({profileReviews.length})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'listings' ? (
              <div>
                {profileListings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active listings</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {profileListings.map((listing: any) => (
                      <button
                        key={listing.id}
                        onClick={() => openListing(listing.id)}
                        className="text-left group"
                      >
                        <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-square">
                            {listing.images && listing.images.length > 0 ? (
                              <ImageWithFallback
                                src={getImageUrl(listing.images[0])}
                                alt={listing.title}
                                className="w-full h-full object-contain bg-gray-100"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="line-clamp-1 mb-1 group-hover:text-blue-600">{listing.title}</h4>
                            <p className="text-blue-600">{formatPrice(listing.price)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {profileReviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No reviews yet</p>
                ) : (
                  profileReviews.map((review: any) => (
                    <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                      <p className="text-sm text-gray-500 mt-2">by {review.reviewer.name}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500">Content not found</p>
          </div>
        )}
      </div>

      {showReportModal && listing && (
        <ReportModal
          listingId={listing.id}
          onClose={() => setShowReportModal(false)}
          user={user}
        />
      )}

      {showFullscreenImage && listing?.images && listing.images.length > 0 && (
        <div 
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowFullscreenImage(false);
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFullscreenImage(false);
            }}
            className="absolute top-4 right-4 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-7xl max-h-full w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <ImageWithFallback
              src={getImageUrl(listing.images[selectedImage])}
              alt={listing.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {showMapModal && listing && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowMapModal(false);
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="mb-1">Location Map</h3>
                <p className="text-sm text-gray-600">
                  {listing.real_estate_details 
                    ? `${listing.real_estate_details.city}, ${listing.real_estate_details.state} ${listing.real_estate_details.zip_code}`
                    : listing.zip_code}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMapModal(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full h-[400px]">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  listing.real_estate_details 
                    ? `${listing.real_estate_details.address}, ${listing.real_estate_details.city}, ${listing.real_estate_details.state} ${listing.real_estate_details.zip_code}`
                    : listing.zip_code
                )}&output=embed`}
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {showMakeOfferModal && listing && (
        <MakeOfferModal
          listing={listing}
          user={user}
          onClose={() => setShowMakeOfferModal(false)}
          onSuccess={() => {
            setShowMakeOfferModal(false);
            // Could add a success message here
          }}
        />
      )}
    </div>
  );
}