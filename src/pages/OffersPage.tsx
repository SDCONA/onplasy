import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Inbox } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import OfferCard from '../components/OfferCard';

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
      const session = await user?.getSession?.();
      const accessToken = session?.access_token;

      // Fetch sent offers
      const sentResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/offers/sent`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
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
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
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
            <h1 className="text-2xl">My Offers</h1>
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
              Received
              {receivedOffers.filter(o => ['pending', 'countered'].includes(o.status)).length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {receivedOffers.filter(o => ['pending', 'countered'].includes(o.status)).length}
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
              Sent
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

            {/* Empty State */}
            {activeOffers.length === 0 && pastOffers.length === 0 && (
              <div className="text-center py-12">
                <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg text-gray-600 mb-2">
                  No {activeTab === 'sent' ? 'Sent' : 'Received'} Offers
                </h3>
                <p className="text-sm text-gray-500">
                  {activeTab === 'sent'
                    ? 'Make offers on listings to start negotiating'
                    : 'Offers from buyers will appear here'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
