import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import OfferRow from './OfferRow';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface ListingOfferGroupProps {
  listing: any;
  offers: any[];
  user: any;
  onUpdate: () => void;
}

export default function ListingOfferGroup({ listing, offers, user, onUpdate }: ListingOfferGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort offers: unread first, then by created_at
  const sortedOffers = [...offers].sort((a, b) => {
    const aUnread = a.is_read === false;
    const bUnread = b.is_read === false;
    
    // Unread offers come first
    if (aUnread && !bUnread) return -1;
    if (!aUnread && bUnread) return 1;
    
    // Otherwise sort by created_at (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Calculate summary stats
  const activeOffers = sortedOffers.filter(o => ['pending', 'countered'].includes(o.status));
  const highestOffer = Math.max(...sortedOffers.map(o => o.amount), 0);
  const latestOffer = sortedOffers[0]; // Already sorted by created_at desc
  const timeSince = getTimeSince(latestOffer?.created_at);
  
  // Check if there are any unread offers
  const hasUnread = sortedOffers.some(o => o.is_read === false);
  const unreadCount = sortedOffers.filter(o => o.is_read === false).length;

  async function handleExpand() {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Mark as read when expanding
    if (newExpandedState && hasUnread) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/offers/mark-read/${listing.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        // Refresh offers to update UI
        onUpdate();
      } catch (error) {
        console.error('Failed to mark offers as read:', error);
      }
    }
  }

  function getTimeSince(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}hr ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  const firstImage = listing.images?.[0];

  return (
    <div className={`border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow ${
      hasUnread ? 'border-l-4 border-l-green-500 border-r border-r-gray-200 border-t border-t-gray-200 border-b border-b-gray-200' : 'border-gray-200'
    }`}>
      {/* Listing Header - Always Visible */}
      <button
        onClick={handleExpand}
        className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Listing Image */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {firstImage ? (
            <img
              src={firstImage}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>

        {/* Listing Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate mb-1">
            {listing.title}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            Your price: ${listing.price?.toLocaleString()}
          </p>
          
          {/* Summary Stats */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {activeOffers.length} {activeOffers.length === 1 ? 'offer' : 'offers'}
            </span>
            {highestOffer > 0 && (
              <span className="text-gray-600">
                Highest: <span className="font-medium">${highestOffer.toLocaleString()}</span>
              </span>
            )}
            {latestOffer && (
              <span className="text-gray-500">
                Latest: {timeSince}
              </span>
            )}
            {hasUnread && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        {/* Expand Icon */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Offers List - Shown When Expanded */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white">
          <div className="px-4">
            {sortedOffers.map((offer) => (
              <OfferRow
                key={offer.id}
                offer={offer}
                user={user}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}