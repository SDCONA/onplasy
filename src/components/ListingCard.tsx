import { useState } from 'react';
import { Heart, Star, Share2, Bed, Bath, Maximize, MapPin, MoreVertical, Edit, Archive, CheckSquare, Square } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import ListingPreviewModal from './ListingPreviewModal';
import { useTranslation, nameToSlug } from '../translations';

interface ListingCardProps {
  listing: any;
  user: any;
  onUpdate?: () => void;
  initialSaved?: boolean;
  viewMode?: 'grid' | 'list';
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onRenew?: (id: string) => void;
  onDelete?: (id: string) => void;
  isArchived?: boolean;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export default function ListingCard({ listing, user, onUpdate, initialSaved = false, viewMode = 'grid', showActions = false, onEdit, onArchive, onRenew, onDelete, isArchived = false, showCheckbox = false, isSelected = false, onToggleSelect }: ListingCardProps) {
  const { t } = useTranslation();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent modal from opening
    if (!user) {
      window.location.href = '/auth';
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
        
        // Track favorite interaction when saving
        if (listing && listing.category) {
          trackFavorite(listing.id, listing.category);
        }
      }
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to save listing:', error);
    } finally {
      setSaving(false);
    }
  };

  const trackFavorite = async (listingId: string, category: string) => {
    if (!user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/track-interaction`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            category,
            interactionType: 'favorite',
            listingId
          })
        }
      );
    } catch (error) {
      console.error('Failed to track favorite:', error);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent modal from opening
    
    const shareUrl = `${window.location.origin}/listing/${listing.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out this listing: ${listing.title}`,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        // Clipboard API blocked - silently fail
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getImageUrl = (listing: any) => {
    if (listing.images && listing.images.length > 0) {
      const firstImage = listing.images[0];
      // Simply return the first image URL
      return firstImage;
    }
    return null;
  };

  const getRealEstateDetails = (listing: any) => {
    // Check if details are attached directly (from single listing fetch) or in real_estate_details (from list fetch)
    const details = listing.real_estate_details 
      ? (Array.isArray(listing.real_estate_details) ? listing.real_estate_details[0] : listing.real_estate_details)
      : listing;
      
    // If we're falling back to 'listing' (legacy/direct props), ensure we don't return the listing object if it doesn't have the fields
    if (details === listing && !listing.bedrooms && !listing.bathrooms && !listing.square_feet) {
      return null;
    }
    
    return details;
  };

  const reDetails = getRealEstateDetails(listing);
  // Safely get category slug (can be object or array depending on Supabase query)
  const categorySlug = listing.categories?.slug || (Array.isArray(listing.categories) ? listing.categories[0]?.slug : null);

  return (
    <div className="group w-full">
      <div 
        className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full ${
          viewMode === 'list' ? 'flex' : ''
        }`}
        onClick={() => setShowPreview(true)}
      >
        <div className={`relative bg-gray-200 ${
          viewMode === 'list' ? 'w-32 aspect-square flex-shrink-0' : 'aspect-square'
        }`}>
          {getImageUrl(listing) ? (
            <ImageWithFallback
              src={getImageUrl(listing) || ''}
              alt={listing.title}
              className="w-full h-full object-cover bg-gray-100"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-gray-400 ${
              viewMode === 'list' ? 'text-xs' : ''
            }`}>
              {viewMode === 'grid' && 'No Image'}
            </div>
          )}
          
          {/* Action buttons - hide in list view */}
          {viewMode === 'grid' && (
            <>
              {/* Checkbox for selection in grid view */}
              {showCheckbox && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleSelect) onToggleSelect();
                  }}
                  className="absolute top-2 left-2 p-1 bg-white rounded shadow-md hover:bg-gray-50 z-10"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              )}
              
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  title="Share"
                >
                  <Share2 className="w-4 h-4 text-gray-700" />
                </button>
                {user && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    title={isSaved ? 'Unsave' : 'Save'}
                  >
                    <Heart 
                      className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
                    />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {viewMode === 'list' ? (
          // Compact list view
          <div className="p-3 flex-1 min-w-0 flex gap-3">
            {/* Checkbox for selection */}
            {showCheckbox && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSelect) onToggleSelect();
                }}
                className="flex-shrink-0 p-1 hover:bg-gray-50 rounded"
              >
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </button>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="truncate group-hover:text-blue-600 mb-1">
                    {listing.title}
                  </h3>
                  <p className="text-blue-600 truncate">
                    {formatPrice(listing.price)}
                  </p>
                </div>
              </div>
              {listing.location && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {listing.location}
                </p>
              )}
              
              {/* Action buttons - only show when showActions is true */}
              {showActions && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  {isArchived ? (
                    // Archived listing buttons
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onRenew) onRenew(listing.id);
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm"
                      >
                        <span>Renew</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDelete) onDelete(listing.id);
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                      >
                        <span>Delete</span>
                      </button>
                    </>
                  ) : (
                    // Active listing buttons
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEdit) onEdit(listing.id);
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm"
                      >
                        <span>{t.common.edit}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/listing/${listing.id}`;
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm"
                      >
                        Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onArchive) onArchive(listing.id);
                        }}
                        className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm"
                      >
                        <span>Archive</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Original grid view
          <div className="p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="line-clamp-1 flex-1 group-hover:text-blue-600">
                {listing.title}
              </h3>
            </div>
            
            <p className="text-blue-600 mb-2">
              {formatPrice(listing.price)}
              {reDetails?.listing_type === 'rent' && <span className="text-sm text-gray-500">/mo</span>}
            </p>

            {/* Real Estate Specific Details */}
            {categorySlug === 'real-estate' && reDetails && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  {reDetails.bedrooms > 0 && (
                    <div className="flex items-center gap-1" title="Bedrooms">
                      <Bed className="w-4 h-4" />
                      <span>{reDetails.bedrooms}</span>
                    </div>
                  )}
                  {reDetails.bathrooms > 0 && (
                    <div className="flex items-center gap-1" title="Bathrooms">
                      <Bath className="w-4 h-4" />
                      <span>{reDetails.bathrooms}</span>
                    </div>
                  )}
                  {reDetails.square_feet > 0 && (
                    <div className="flex items-center gap-1" title="Square Feet">
                      <Maximize className="w-4 h-4" />
                      <span>{reDetails.square_feet}</span>
                    </div>
                  )}
                </div>
                
                {(reDetails.city || reDetails.state) && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>
                      {[reDetails.address, reDetails.city, reDetails.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {listing.profiles && (
              <div className="flex items-center gap-2 text-gray-600">
                {listing.profiles.rating_count > 0 && (
                  <div className="flex items-center gap-1">
                  </div>
                )}
              </div>
            )}

            {listing.categories && (
              <div className="mt-2 hidden md:block">
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  {t.categories[nameToSlug(listing.categories.slug || listing.categories.name) as keyof typeof t.categories] || listing.categories.name}
                </span>
                {listing.subcategories && (
                  <span className="inline-block ml-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                    {t.categories[nameToSlug(listing.subcategories.slug || listing.subcategories.name) as keyof typeof t.categories] || listing.subcategories.name}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {showPreview && (
        <ListingPreviewModal
          listingId={listing.id}
          onClose={() => setShowPreview(false)}
          user={user}
        />
      )}
    </div>
  );
}