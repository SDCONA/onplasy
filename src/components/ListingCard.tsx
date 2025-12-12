import { useState } from 'react';
import { Heart, Star, Share2 } from 'lucide-react';
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
}

export default function ListingCard({ listing, user, onUpdate, initialSaved = false }: ListingCardProps) {
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
      }
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to save listing:', error);
    } finally {
      setSaving(false);
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
        console.log('Share cancelled or failed');
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
      console.log('[ListingCard] Image data:', { listingId: listing.id, images: listing.images, firstImage });
      // Simply return the first image URL
      console.log('[ListingCard] Using URL:', firstImage);
      return firstImage;
    }
    console.log('[ListingCard] No images found for listing:', listing.id);
    return null;
  };

  return (
    <div className="group">
      <div 
        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowPreview(true)}
      >
        <div className="relative aspect-square bg-gray-200">
          {getImageUrl(listing) ? (
            <ImageWithFallback
              src={getImageUrl(listing) || ''}
              alt={listing.title}
              className="w-full h-full object-cover bg-gray-100"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
          
          {/* Action buttons */}
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
        </div>

        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="line-clamp-1 flex-1 group-hover:text-blue-600">
              {listing.title}
            </h3>
          </div>
          
          <p className="text-blue-600 mb-2">
            {formatPrice(listing.price)}
          </p>

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