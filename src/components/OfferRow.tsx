import { useState } from 'react';
import { Clock, X, Check, ArrowRightLeft } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface OfferRowProps {
  offer: any;
  user: any;
  onUpdate: () => void;
}

export default function OfferRow({ offer, user, onUpdate }: OfferRowProps) {
  const [loading, setLoading] = useState(false);
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [error, setError] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getTimeRemaining = () => {
    const now = new Date().getTime();
    const expires = new Date(offer.expires_at).getTime();
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const getStatusBadge = () => {
    const badges = {
      pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
      accepted: { text: 'Accepted', color: 'bg-green-100 text-green-700' },
      declined: { text: 'Declined', color: 'bg-red-100 text-red-700' },
      countered: { text: 'Countered', color: 'bg-blue-100 text-blue-700' },
      expired: { text: 'Expired', color: 'bg-gray-100 text-gray-700' }
    };

    const badge = badges[offer.status as keyof typeof badges] || badges.pending;

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const handleAction = async (action: 'accept' | 'decline' | 'counter') => {
    if (action === 'counter') {
      if (!showCounterInput) {
        setShowCounterInput(true);
        return;
      }

      const amount = parseFloat(counterAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const minOffer = offer.listing.price * 0.1;
      if (amount < minOffer || amount > offer.listing.price) {
        setError(`Amount must be between ${formatPrice(minOffer)} and ${formatPrice(offer.listing.price)}`);
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const url = action === 'counter'
        ? `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/offers/${offer.id}/counter`
        : `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/offers/${offer.id}/${action}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: action === 'counter' ? JSON.stringify({ counter_amount: parseFloat(counterAmount) }) : undefined
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Failed to ${action} offer`);
        return;
      }

      onUpdate();
    } catch (err) {
      console.error(`${action} offer error:`, err);
      setError(`Failed to ${action} offer. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const isActive = ['pending', 'countered'].includes(offer.status);
  const isUnread = offer.is_read === false;

  return (
    <div className={`border-b border-gray-200 last:border-b-0 py-3 ${
      isUnread ? 'border-l-4 border-l-green-500 pl-3 -ml-4' : ''
    }`}>
      {/* Offer Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{offer.buyer?.name || 'Anonymous'}</span>
            {getStatusBadge()}
            {isActive && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getTimeRemaining()}
              </span>
            )}
          </div>
          
          {/* Offer Amount */}
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xs text-gray-600">Offer: </span>
              <span className="text-blue-600 font-medium">{formatPrice(offer.amount)}</span>
              <span className="text-xs text-gray-500 ml-1">
                ({Math.round((offer.amount / offer.listing.price) * 100)}%)
              </span>
            </div>

            {/* Counter Offer */}
            {offer.status === 'countered' && offer.counter_amount && (
              <>
                <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                <div>
                  <span className="text-xs text-blue-700">Counter: </span>
                  <span className="text-blue-700 font-medium">{formatPrice(offer.counter_amount)}</span>
                  <span className="text-xs text-blue-600 ml-1">
                    ({Math.round((offer.counter_amount / offer.listing.price) * 100)}%)
                  </span>
                </div>
              </>
            )}

            {offer.round > 1 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                R{offer.round}
              </span>
            )}
          </div>

          {/* Message */}
          {offer.message && (
            <p className="text-xs text-gray-600 italic mt-1">"{offer.message}"</p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Counter Input */}
      {showCounterInput && (
        <div className="mb-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter counter amount"
              min={offer.listing.price * 0.1}
              max={offer.listing.price}
              step="1"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isActive && (
        <div>
          {offer.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('accept')}
                disabled={loading}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                <Check className="w-3 h-3" />
                Accept
              </button>
              <button
                onClick={() => handleAction('counter')}
                disabled={loading || offer.round >= 3}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                <ArrowRightLeft className="w-3 h-3" />
                {showCounterInput ? 'Send' : 'Counter'}
              </button>
              <button
                onClick={() => handleAction('decline')}
                disabled={loading}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                <X className="w-3 h-3" />
                Decline
              </button>
            </div>
          )}

          {offer.status === 'countered' && offer.round < 3 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('accept')}
                disabled={loading}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                <Check className="w-3 h-3" />
                Accept
              </button>
              <button
                onClick={() => handleAction('counter')}
                disabled={loading}
                className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                <ArrowRightLeft className="w-3 h-3" />
                {showCounterInput ? 'Send' : 'Counter'}
              </button>
            </div>
          )}

          {showCounterInput && (
            <button
              onClick={() => {
                setShowCounterInput(false);
                setCounterAmount('');
                setError('');
              }}
              className="mt-2 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}