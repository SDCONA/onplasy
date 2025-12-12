import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Heart, MapPin, Star, Flag, MessageCircle, X, ZoomIn, ZoomOut, DollarSign } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import ReportModal from '../components/ReportModal';
import MakeOfferModal from '../components/MakeOfferModal';

interface ListingDetailPageProps {
  user: any;
}

export default function ListingDetailPage({ user }: ListingDetailPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMakeOfferModal, setShowMakeOfferModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Helper functions to get correct image URLs
  const getMediumUrl = (image: any) => {
    if (typeof image === 'object' && image.medium) {
      return image.medium;
    }
    return image;
  };

  const getThumbnailUrl = (image: any) => {
    if (typeof image === 'object' && image.thumbnail) {
      return image.thumbnail;
    }
    return image;
  };
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [swipeStart, setSwipeStart] = useState({ x: 0, y: 0 });
  const [swipeDistance, setSwipeDistance] = useState(0);

  // Get the "from" location if navigated from conversation
  const fromLocation = (location.state as any)?.from;

  // Redirect to sign-in if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      if (data.listing) {
        setListing(data.listing);
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Create conversation ID
    const conversationId = [user.id, listing.user_id].sort().join('-') + '-' + listing.id;
    navigate(`/messages/${conversationId}?listingId=${listing.id}&recipientId=${listing.user_id}`);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Listing not found</p>
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
          {fromLocation ? (
            <Link to={fromLocation} className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to conversation</span>
            </Link>
          ) : (
            <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to listings</span>
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="bg-white rounded-lg overflow-hidden mb-4 cursor-pointer" onClick={() => setShowImageViewer(true)}>
              <div className="aspect-square bg-gray-200">
                {listing.images && listing.images.length > 0 ? (
                  <ImageWithFallback
                    src={getMediumUrl(listing.images[selectedImage])}
                    alt={listing.title}
                    className="w-full h-full object-contain bg-gray-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            </div>

            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                {listing.images.map((image: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gray-200 rounded-lg overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-blue-600' : ''
                    }`}
                  >
                    <ImageWithFallback
                      src={getThumbnailUrl(image)}
                      alt={`${listing.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="bg-white rounded-lg p-6 mb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="mb-2">{listing.title}</h1>
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
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                    {listing.categories.name}
                  </span>
                  {listing.subcategories && (
                    <span className="inline-block ml-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
                      {listing.subcategories.name}
                    </span>
                  )}
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 mb-4">
                <h3 className="mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
              </div>

              {listing.real_estate_details && (
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h3 className="mb-4">Property Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500">Listing Type</p>
                      <p className="capitalize font-semibold">
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
                        <p className="text-gray-500">Parking</p>
                        <p>{listing.real_estate_details.parking_spaces} spaces</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-500">Address</p>
                    <p>{listing.real_estate_details.address}</p>
                    <p>{listing.real_estate_details.city}, {listing.real_estate_details.state} {listing.real_estate_details.zip_code}</p>
                  </div>
                  {listing.real_estate_details.amenities && listing.real_estate_details.amenities.length > 0 && (
                    <div className="mt-4">
                      <p className="text-gray-500 mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {listing.real_estate_details.amenities.map((amenity: string, index: number) => (
                          <span key={index} className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 mb-4">
                <p className="text-gray-500">Posted on {formatDate(listing.created_at)}</p>
                <p className="text-gray-500">{listing.views} views</p>
              </div>

              {/* Debug info - remove after testing */}
              {user && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-3 text-xs">
                  <p>Debug Info:</p>
                  <p>Current User ID: {user?.id}</p>
                  <p>Listing Owner ID: {listing.user_id}</p>
                  <p>Listing Status: {listing.status}</p>
                  <p>Same User: {user?.id === listing.user_id ? 'YES' : 'NO'}</p>
                  <p>Should Show Button: {user?.id !== listing.user_id && listing.status === 'active' ? 'YES' : 'NO'}</p>
                </div>
              )}

              {user?.id !== listing.user_id && listing.status === 'active' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowMakeOfferModal(true)}
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

            {/* Seller Info */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="mb-4">Seller Information</h3>
              
              <Link
                to={`/profile/${listing.profiles.id}`}
                className="flex items-center gap-4 hover:bg-gray-50 p-3 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {listing.profiles.avatar_url ? (
                    <ImageWithFallback
                      src={listing.profiles.avatar_url}
                      alt={listing.profiles.name}
                      className="w-full h-full object-contain bg-white"
                    />
                  ) : (
                    <span className="text-gray-500">{listing.profiles.name[0]}</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <p>{listing.profiles.name}</p>
                  {listing.profiles.rating_count > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-gray-600">
                          {listing.profiles.rating_average?.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        ({listing.profiles.rating_count} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {showReportModal && (
        <ReportModal
          listingId={listing.id}
          onClose={() => setShowReportModal(false)}
          user={user}
        />
      )}

      {showMakeOfferModal && (
        <MakeOfferModal
          listing={listing}
          user={user}
          onClose={() => setShowMakeOfferModal(false)}
          onSuccess={() => {
            // Optionally show success message
            fetchListing();
          }}
        />
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && listing.images && listing.images.length > 0 && (
        <div 
          className="fixed inset-0 bg-black z-50 flex flex-col"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${Math.max(0.5, 0.95 - swipeDistance / 400)})`,
            transform: swipeDistance > 0 && zoom === 1 ? `translateY(${swipeDistance}px)` : 'none',
            transition: swipeDistance === 0 ? 'all 0.2s ease-out' : 'none'
          }}
          onClick={() => {
            if (zoom === 1) {
              setShowImageViewer(false);
              setZoom(1);
              setPosition({ x: 0, y: 0 });
              setSwipeDistance(0);
            }
          }}
          onTouchStart={(e) => {
            if (e.touches.length === 1 && zoom === 1) {
              setSwipeStart({ x: e.touches[0].clientY, y: e.touches[0].clientY });
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 1 && zoom === 1) {
              const distance = e.touches[0].clientY - swipeStart.y;
              if (distance > 0) {
                setSwipeDistance(distance);
              }
            }
          }}
          onTouchEnd={() => {
            if (swipeDistance > 100 && zoom === 1) {
              setShowImageViewer(false);
              setZoom(1);
              setPosition({ x: 0, y: 0 });
              setSwipeDistance(0);
            } else {
              setSwipeDistance(0);
            }
          }}
        >
          {/* Header with close button and zoom controls */}
          <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.max(0.5, zoom - 0.25));
                }}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-white">{Math.round(zoom * 100)}%</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.min(4, zoom + 0.25));
                }}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowImageViewer(false);
                setZoom(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white ml-auto"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Image container */}
          <div 
            className="flex-1 overflow-auto touch-pan-x touch-pan-y relative"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const delta = e.deltaY * -0.001;
              setZoom(Math.min(4, Math.max(0.5, zoom + delta)));
            }}
            onMouseDown={(e) => {
              if (zoom > 1) {
                setIsDragging(true);
                setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
              }
            }}
            onMouseMove={(e) => {
              if (isDragging && zoom > 1) {
                setPosition({
                  x: e.clientX - dragStart.x,
                  y: 0
                });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchStart={(e) => {
              if (e.touches.length === 1 && zoom > 1) {
                const touch = e.touches[0];
                setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
              } else if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.sqrt(
                  Math.pow(touch2.clientX - touch1.clientX, 2) +
                  Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                setLastTouchDistance(distance);
                setSwipeStart({ x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 });
                setSwipeDistance(0);
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 1 && zoom > 1) {
                const touch = e.touches[0];
                setPosition({
                  x: touch.clientX - dragStart.x,
                  y: 0
                });
              } else if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.sqrt(
                  Math.pow(touch2.clientX - touch1.clientX, 2) +
                  Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                const delta = distance - lastTouchDistance;
                setZoom(Math.min(4, Math.max(0.5, zoom + delta * 0.01)));
                setLastTouchDistance(distance);
                const currentSwipeStart = { x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 };
                setSwipeDistance(
                  Math.sqrt(
                    Math.pow(currentSwipeStart.x - swipeStart.x, 2) +
                    Math.pow(currentSwipeStart.y - swipeStart.y, 2)
                  )
                );
              }
            }}
          >
            <div className="min-h-full flex items-center justify-center p-4">
              <ImageWithFallback
                src={getMediumUrl(listing.images[selectedImage])}
                alt={listing.title}
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
              />
            </div>
          </div>

          {/* Thumbnail navigation */}
          {listing.images.length > 1 && (
            <div className="p-4 bg-black bg-opacity-50">
              <div className="flex gap-2 overflow-x-auto pb-2 justify-center [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-700 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full">
                {listing.images.map((image: any, index: number) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(index);
                      setZoom(1);
                      setPosition({ x: 0, y: 0 });
                    }}
                    className={`flex-shrink-0 w-16 h-16 bg-gray-800 rounded-lg overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <ImageWithFallback
                      src={getThumbnailUrl(image)}
                      alt={`${listing.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}