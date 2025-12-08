import { useState } from 'react';
import { X } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { publicAnonKey } from '../utils/supabase/info';

interface ReportModalProps {
  listingId?: string;
  userId?: string;
  onClose: () => void;
  user: any;
}

export default function ReportModal({ listingId, userId, onClose, user }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to report');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('You must be logged in to report');
        setLoading(false);
        return;
      }

      console.log('Submitting report with data:', {
        listing_id: listingId || null,
        user_id: userId || null,
        reason
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/reports`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            listing_id: listingId || null,
            user_id: userId || null,
            reason
          })
        }
      );

      const data = await response.json();
      console.log('Report response:', response.status, data);

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      setError('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2>Report {listingId ? 'Listing' : 'User'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <p className="text-green-600 mb-2">Report submitted successfully</p>
            <p className="text-gray-600">Thank you for helping keep OnPlasy safe.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Please describe the issue
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe why you're reporting this..."
              />
            </div>

            {error && (
              <div className="mb-4 text-red-500">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}