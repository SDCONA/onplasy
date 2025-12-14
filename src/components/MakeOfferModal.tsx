import { useState } from 'react';
import { X } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface MakeOfferModalProps {
  listing: any;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MakeOfferModal({ listing, user, onClose, onSuccess }: MakeOfferModalProps) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const offerAmount = parseFloat(amount);

    if (isNaN(offerAmount) || offerAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (offerAmount > listing.price) {
      setError('Offer cannot exceed the asking price');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/offers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          },
          body: JSON.stringify({
            listing_id: listing.id,
            amount: offerAmount,
            message: message.trim() || null
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit offer');
        return;
      }

      // Track offer interaction
      if (listing && listing.category) {
        trackOffer(listing.id, listing.category);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Submit offer error:', err);
      setError('Failed to submit offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const trackOffer = async (listingId: string, category: string) => {
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
            interactionType: 'offer',
            listingId
          })
        }
      );
    } catch (error) {
      console.error('Failed to track offer:', error);
    }
  };

  const percentage = amount ? Math.round((parseFloat(amount) / listing.price) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Make an Offer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Asking Price</p>
          <p className="text-2xl text-blue-600">{formatPrice(listing.price)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">
              Your Offer Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                required
              />
            </div>
            {amount && percentage > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {percentage}% of asking price
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Max: {formatPrice(listing.price)}
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Add a note to the seller..."
              rows={3}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/100 characters
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Offer'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-600">
            💡 Your offer will expire in 48 hours if not responded to. You can only have one active offer per listing.
          </p>
        </div>
      </div>
    </div>
  );
}