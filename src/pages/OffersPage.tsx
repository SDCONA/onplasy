import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Inbox } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import OfferCard from '../components/OfferCard';
import ListingOfferGroup from '../components/ListingOfferGroup';
import { useTranslation } from '../translations';

interface OffersPageProps {
  user: any;
}

export default function OffersPage({ user }: OffersPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received');
  const [sentOffers, setSentOffers] = useState<any[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOffers();
  }, [user]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.error('No access token available');
        setLoading(false);
        return;
      }

      // Fetch sent offers
      const sentResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/offers/sent`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const sentData = await sentResponse.json();
      if (sentData.offers) {
        setSentOffers(sentData.offers);
      }

      // Fetch received offers
      const receivedResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/offers/received`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const receivedData = await receivedResponse.json();
      if (receivedData.offers) {
        setReceivedOffers(receivedData.offers);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeOffers = activeTab === 'sent' ? sentOffers.filter(o => ['pending', 'countered'].includes(o.status)) : receivedOffers.filter(o => ['pending', 'countered'].includes(o.status));
  const pastOffers = activeTab === 'sent' ? sentOffers.filter(o => !['pending', 'countered'].includes(o.status)) : receivedOffers.filter(o => !['pending', 'countered'].includes(o.status));

  // Group received offers by listing
  const groupOffersByListing = (offers: any[]) => {
    const grouped = new Map<string, { listing: any; offers: any[] }>();
    
    offers.forEach(offer => {
      const listingId = offer.listing?.id;
      if (!listingId) return;
      
      if (!grouped.has(listingId)) {
        grouped.set(listingId, {
          listing: offer.listing,
          offers: []
        });
      }
      grouped.get(listingId)!.offers.push(offer);
    });
    
    // Convert to array and sort: unread listings first
    const groupsArray = Array.from(grouped.values());
    groupsArray.sort((a, b) => {
      const aHasUnread = a.offers.some(o => o.is_read === false);
      const bHasUnread = b.offers.some(o => o.is_read === false);
      
      // Unread listings come first
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;
      
      // Otherwise sort by latest offer
      const aLatest = new Date(a.offers[0]?.created_at || 0).getTime();
      const bLatest = new Date(b.offers[0]?.created_at || 0).getTime();
      return bLatest - aLatest;
    });
    
    return groupsArray;
  };

  const receivedActiveGroups = activeTab === 'received' ? groupOffersByListing(activeOffers) : [];
  const receivedPastGroups = activeTab === 'received' ? groupOffersByListing(pastOffers) : [];

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl">{t.offers.myOffers}</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'received'
                  ? 'bg-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.offers.received}
              {receivedOffers.filter(o => o.is_read === false).length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {receivedOffers.filter(o => o.is_read === false).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'sent'
                  ? 'bg-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.offers.sent}
              {sentOffers.filter(o => ['pending', 'countered'].includes(o.status)).length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {sentOffers.filter(o => ['pending', 'countered'].includes(o.status)).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'received' ? (
              /* RECEIVED TAB - Grouped by Listing */
              <>
                {/* Active Listings with Offers */}
                {receivedActiveGroups.length > 0 && (
                  <div>
                    <h2 className="text-lg mb-3">
                      Active Listings with Offers ({receivedActiveGroups.length})
                    </h2>
                    <div className="space-y-4">
                      {receivedActiveGroups.map((group) => (
                        <ListingOfferGroup
                          key={group.listing.id}
                          listing={group.listing}
                          offers={group.offers}
                          user={user}
                          onUpdate={fetchOffers}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Listings with Offers */}
                {receivedPastGroups.length > 0 && (
                  <div>
                    <h2 className="text-lg mb-3">
                      Past Listings ({receivedPastGroups.length})
                    </h2>
                    <div className="space-y-4">
                      {receivedPastGroups.map((group) => (
                        <ListingOfferGroup
                          key={group.listing.id}
                          listing={group.listing}
                          offers={group.offers}
                          user={user}
                          onUpdate={fetchOffers}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State for Received */}
                {receivedActiveGroups.length === 0 && receivedPastGroups.length === 0 && (
                  <div className="text-center py-12">
                    <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg text-gray-600 mb-2">
                      No Received Offers
                    </h3>
                    <p className="text-sm text-gray-500">
                      Offers from buyers will appear here
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* SENT TAB - Keep as Flat List */
              <>
                {/* Active Offers */}
                {activeOffers.length > 0 && (
                  <div>
                    <h2 className="text-lg mb-3">
                      Active Offers ({activeOffers.length})
                    </h2>
                    <div className="space-y-4">
                      {activeOffers.map((offer) => (
                        <OfferCard
                          key={offer.id}
                          offer={offer}
                          user={user}
                          type={activeTab}
                          onUpdate={fetchOffers}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Offers */}
                {pastOffers.length > 0 && (
                  <div>
                    <h2 className="text-lg mb-3">
                      Past Offers ({pastOffers.length})
                    </h2>
                    <div className="space-y-4">
                      {pastOffers.map((offer) => (
                        <OfferCard
                          key={offer.id}
                          offer={offer}
                          user={user}
                          type={activeTab}
                          onUpdate={fetchOffers}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State for Sent */}
                {activeOffers.length === 0 && pastOffers.length === 0 && (
                  <div className="text-center py-12">
                    <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg text-gray-600 mb-2">
                      No Sent Offers
                    </h3>
                    <p className="text-sm text-gray-500">
                      Make offers on listings to start negotiating
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}