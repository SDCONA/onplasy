import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { publicAnonKey } from '../utils/supabase/info';
import ListingCard from '../components/ListingCard';

interface SavedListingsPageProps {
  user: any;
}

export default function SavedListingsPage({ user }: SavedListingsPageProps) {
  const location = useLocation();
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSavedListings();
  }, [offset]);

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (currentRef) {
      const currentObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore) {
            setLoadingMore(true);
            setOffset((prevOffset) => prevOffset + 30);
          }
        },
        { threshold: 0.1 }
      );
      currentObserver.observe(currentRef);
      observerRef.current = currentObserver;
    }
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore]);

  const fetchSavedListings = async () => {
    if (offset === 0) {
      setLoading(true);
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/saved-listings?limit=30&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.savedListings) {
        if (offset === 0) {
          // Reset listings when fetching from beginning
          setSavedListings(data.savedListings);
        } else {
          // Append when loading more
          setSavedListings((prevListings) => [...prevListings, ...data.savedListings]);
        }
        // Set hasMore based on whether we received a full page
        setHasMore(data.savedListings.length === 30);
      } else {
        if (offset === 0) {
          setSavedListings([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to fetch saved listings:', error);
      if (offset === 0) {
        setSavedListings([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleUpdate = () => {
    // Reset and refetch
    setSavedListings([]);
    setOffset(0);
    setHasMore(true);
  };

  // Get the return path from location state, default to home
  const returnPath = (location.state as any)?.from === 'profile' ? `/profile/${user?.id}` : '/';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to={returnPath} className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="mb-6">Saved Listings</h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : savedListings.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No saved listings yet</p>
            <p className="text-gray-400 mt-2">Save items you like to view them later</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {savedListings.map((saved) => (
              <ListingCard 
                key={saved.id} 
                listing={saved.listings} 
                user={user} 
                onUpdate={handleUpdate}
                initialSaved={true}
              />
            ))}
          </div>
        )}

        {loadingMore && !loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        <div ref={loadMoreRef} className="h-10"></div>
      </main>
    </div>
  );
}