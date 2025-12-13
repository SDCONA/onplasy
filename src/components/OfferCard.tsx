import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, X, Check, ArrowRightLeft } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import ConfirmModal from './ConfirmModal';
import { supabase } from '../utils/supabase/client';

interface OfferCardProps {
  offer: any;
  user: any;
  type: 'sent' | 'received';
  onUpdate: () => void;
}

export default function OfferCard({ offer, user, type, onUpdate }: OfferCardProps) {
  const [loading, setLoading] = useState(false);
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

    if (days > 0) return `${days}d ${hours % 24}h left`;
    return `${hours}h left`;
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
      <span className={`px-2 py-1 rounded-full text-xs ${badge.color}`}>
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
      const session = await user?.getSession?.();
      const accessToken = session?.access_token;

      const url = action === 'counter'
        ? `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/offers/${offer.id}/counter`
        : `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/offers/${offer.id}/${action}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || publicAnonKey}`
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

  const handleDelete = async () => {
    setError('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/offers/${offer.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete offer');
        return;
      }

      onUpdate();
    } catch (err) {
      console.error('Delete offer error:', err);
      setError('Failed to delete offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (images: any) => {
    if (!images || images.length === 0) return '';
    const firstImage = images[0];
    if (typeof firstImage === 'object' && firstImage.thumbnail) {
      return firstImage.thumbnail;
    }
    return firstImage;
  };

  const currentPrice = offer.status === 'countered' ? offer.counter_amount : offer.amount;
  const isActive = ['pending', 'countered'].includes(offer.status);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Listing Info */}
      <div className="flex gap-4 mb-4">
        <Link to={`/listings/${offer.listing.id}`} className="flex-shrink-0">
          <ImageWithFallback
            src={getImageUrl(offer.listing.images)}
            alt={offer.listing.title}
            className="w-20 h-20 object-cover rounded-lg"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={`/listings/${offer.listing.id}`}
            className="hover:text-blue-600 block mb-1"
          >
            <h3 className="truncate">{offer.listing.title}</h3>
          </Link>
          <p className="text-sm text-gray-600 mb-2">
            Asking: {formatPrice(offer.listing.price)}
          </p>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {isActive && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getTimeRemaining()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Offer Details */}
      <div className="space-y-3 mb-4">
        {/* Original Offer */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-600 mb-1">
              {type === 'sent' ? 'Your Offer' : `${offer.buyer?.name}'s Offer`}
            </p>
            <p className="text-lg text-blue-600">{formatPrice(offer.amount)}</p>
            <p className="text-xs text-gray-500">
              {Math.round((offer.amount / offer.listing.price) * 100)}% of asking
            </p>
          </div>
          {offer.round > 1 && (
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
              Round {offer.round}
            </span>
          )}
        </div>

        {/* Counter Offer */}
        {offer.status === 'countered' && offer.counter_amount && (
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <div className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 mb-1">Counter Offer</p>
              <p className="text-lg text-blue-700">{formatPrice(offer.counter_amount)}</p>
              <p className="text-xs text-blue-600">
                {Math.round((offer.counter_amount / offer.listing.price) * 100)}% of asking
              </p>
            </div>
          </div>
        )}

        {/* Message */}
        {offer.message && type === 'received' && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Buyer's Note:</p>
            <p className="text-sm text-gray-700 italic">"{offer.message}"</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {isActive && (
        <div className="space-y-3">
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Counter Input */}
          {showCounterInput && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Counter Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                  min={offer.listing.price * 0.1}
                  max={offer.listing.price}
                  step="1"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {type === 'received' && offer.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('accept')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => handleAction('counter')}
                disabled={loading || offer.round >= 3}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                <ArrowRightLeft className="w-4 h-4" />
                {showCounterInput ? 'Send Counter' : 'Counter'}
              </button>
              <button
                onClick={() => handleAction('decline')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                <X className="w-4 h-4" />
                Decline
              </button>
            </div>
          )}

          {type === 'sent' && offer.status === 'countered' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('accept')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                <Check className="w-4 h-4" />
                Accept Counter
              </button>
              <button
                onClick={() => handleAction('decline')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
              >
                <X className="w-4 h-4" />
                Decline
              </button>
            </div>
          )}

          {type === 'received' && offer.status === 'countered' && offer.round < 3 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('accept')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => handleAction('counter')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                <ArrowRightLeft className="w-4 h-4" />
                {showCounterInput ? 'Send Counter' : 'Counter Again'}
              </button>
            </div>
          )}

          {type === 'sent' && offer.status === 'pending' && (
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
            >
              <X className="w-4 h-4" />
              Cancel and Delete
            </button>
          )}

          {showCounterInput && (
            <button
              onClick={() => {
                setShowCounterInput(false);
                setCounterAmount('');
                setError('');
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel Counter
            </button>
          )}
        </div>
      )}

      {/* Accepted - Show Message Button and Cancel Option */}
      {offer.status === 'accepted' && (
        <div className="space-y-2">
          <Link
            to={`/messages`}
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Message {type === 'sent' ? 'Seller' : 'Buyer'}
          </Link>
          
          {/* Only sellers can cancel accepted offers */}
          {type === 'received' && (
            <button
              onClick={() => handleAction('decline')}
              className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Cancel Accepted Offer
            </button>
          )}
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Cancel and Delete Offer"
        message="Are you sure you want to cancel and delete this offer?"
        confirmText="Cancel and Delete"
        cancelText="Cancel"
      />
    </div>
  );
}