import { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface InlineReviewCardProps {
  userName: string;
  revieweeId: string;
  conversationId: string;
  onSubmit: () => void;
  hasAlreadyReviewed: boolean;
}

export default function InlineReviewCard({
  userName,
  revieweeId,
  conversationId,
  onSubmit,
  hasAlreadyReviewed
}: InlineReviewCardProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reset submitted state when hasAlreadyReviewed changes
  useEffect(() => {
    if (hasAlreadyReviewed) {
      setSubmitted(false);
      setExpanded(false);
    }
  }, [hasAlreadyReviewed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            reviewee_id: revieweeId,
            conversation_id: conversationId,
            rating,
            comment: comment.trim() || null
          })
        }
      );

      if (response.ok) {
        setSubmitted(true);
        // Notify parent immediately so it can update the hasAlreadyReviewed status
        onSubmit();
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setLoading(false);
    }
  };

  if (hasAlreadyReviewed) {
    return (
      <div className="flex justify-center my-6">
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 max-w-md">
          <p className="text-green-700 text-center">
            ✓ You've already reviewed {userName}
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex justify-center my-6">
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 max-w-md">
          <p className="text-green-700 text-center">
            Thank you for your review!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center my-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md w-full shadow-sm">
        {!expanded ? (
          <div className="text-center">
            <p className="text-gray-700 mb-3">
              You've exchanged 10+ messages with <span className="font-semibold">{userName}</span>
            </p>
            <p className="text-gray-600 mb-3">
              Share your experience to help others!
            </p>
            <button
              onClick={() => setExpanded(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Leave a Review
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-700">
                Rate <span className="font-semibold">{userName}</span>
              </p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-gray-600">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Comment (optional)"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Later
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}