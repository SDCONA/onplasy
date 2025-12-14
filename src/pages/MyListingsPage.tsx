import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, Edit, Trash2, Archive, Search, X, CheckSquare, Square, Grid, List } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { publicAnonKey } from '../utils/supabase/info';
import ListingCard from '../components/ListingCard';
import { useTranslation } from '../translations';

interface MyListingsPageProps {
  user: any;
}

export default function MyListingsPage({ user }: MyListingsPageProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [activeListings, setActiveListings] = useState<any[]>([]);
  const [archivedListings, setArchivedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Get initial active tab from location state, default to 'active'
  const [activeTab, setActiveTab] = useState((location.state as any)?.activeTab || 'active');
  const [hasMoreActive, setHasMoreActive] = useState(true);
  const [hasMoreArchived, setHasMoreArchived] = useState(true);
  const [activeOffset, setActiveOffset] = useState(0);
  const [archivedOffset, setArchivedOffset] = useState(0);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [listingToArchive, setListingToArchive] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkRenewModal, setShowBulkRenewModal] = useState(false);
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtered listings based on search query
  const filteredActiveListings = activeListings.filter(listing => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      listing.title?.toLowerCase().includes(query) ||
      listing.description?.toLowerCase().includes(query) ||
      listing.category?.toLowerCase().includes(query) ||
      listing.price?.toString().includes(query)
    );
  });

  const filteredArchivedListings = archivedListings.filter(listing => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      listing.title?.toLowerCase().includes(query) ||
      listing.description?.toLowerCase().includes(query) ||
      listing.category?.toLowerCase().includes(query) ||
      listing.price?.toString().includes(query)
    );
  });

  useEffect(() => {
    fetchActiveListings();
  }, [activeOffset, refreshTrigger]);

  useEffect(() => {
    fetchArchivedListings();
  }, [archivedOffset, refreshTrigger]);

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    const hasMore = activeTab === 'active' ? hasMoreActive : hasMoreArchived;
    
    if (currentRef && hasMore) {
      const currentObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !loadingMore) {
            setLoadingMore(true);
            if (activeTab === 'active') {
              setActiveOffset((prev) => prev + 30);
            } else {
              setArchivedOffset((prev) => prev + 30);
            }
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
  }, [activeTab, hasMoreActive, hasMoreArchived, loadingMore]);

  const fetchActiveListings = async () => {
    if (activeOffset === 0) {
      setLoading(true);
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings?userId=${user.id}&status=active&limit=30&offset=${activeOffset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      console.log('Active listings response:', data);
      if (data.listings) {
        if (activeOffset === 0) {
          setActiveListings(data.listings);
        } else {
          setActiveListings((prev) => [...prev, ...data.listings]);
        }
        setHasMoreActive(data.hasMore || false);
      }
    } catch (error) {
      console.error('Failed to fetch active listings:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchArchivedListings = async () => {
    if (archivedOffset === 0 && activeOffset > 0) {
      // Don't set loading on initial archived fetch if we already loaded active
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings?userId=${user.id}&status=archived&limit=30&offset=${archivedOffset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      console.log('Archived listings response:', data);
      if (data.listings) {
        if (archivedOffset === 0) {
          setArchivedListings(data.listings);
        } else {
          setArchivedListings((prev) => [...prev, ...data.listings]);
        }
        setHasMoreArchived(data.hasMore || false);
      }
    } catch (error) {
      console.error('Failed to fetch archived listings:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRenew = async (listingId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings/${listingId}/renew`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        // Reset and refetch both tabs
        setActiveListings([]);
        setArchivedListings([]);
        setActiveOffset(0);
        setArchivedOffset(0);
        setHasMoreActive(true);
        setHasMoreArchived(true);
        setRefreshTrigger(prev => prev + 1);
      } else {
        const errorText = await response.text();
        console.error('Renew failed:', response.status, errorText);
        alert('Failed to renew listing. Please try again.');
      }
    } catch (error) {
      console.error('Failed to renew listing:', error);
      alert('Failed to renew listing. Please try again.');
    }
  };

  const handleArchive = async (listingId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings/${listingId}/archive`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        // Reset and refetch both tabs
        setActiveListings([]);
        setArchivedListings([]);
        setActiveOffset(0);
        setArchivedOffset(0);
        setHasMoreActive(true);
        setHasMoreArchived(true);
        setShowArchiveModal(false);
        setListingToArchive(null);
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert('Failed to archive listing. Please try again.');
      }
    } catch (error) {
      console.error('Failed to archive listing:', error);
      alert('Failed to archive listing. Please try again.');
    }
  };

  const handleDelete = async (listingId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings/${listingId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        // Reset and refetch both tabs
        setActiveListings([]);
        setArchivedListings([]);
        setActiveOffset(0);
        setArchivedOffset(0);
        setHasMoreActive(true);
        setHasMoreArchived(true);
        setShowDeleteModal(false);
        setListingToDelete(null);
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert('Failed to delete listing. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete listing:', error);
      alert('Failed to delete listing. Please try again.');
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} ${diffDays !== 1 ? t.myListings.days : t.myListings.day} ${t.myListings.remaining}`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours !== 1 ? t.myListings.hours : t.myListings.hour} ${t.myListings.remaining}`;
    } else {
      return t.myListings.expiringSoon;
    }
  };

  const openArchiveModal = (listingId: string) => {
    setListingToArchive(listingId);
    setShowArchiveModal(true);
  };

  const confirmArchive = () => {
    if (listingToArchive) {
      handleArchive(listingToArchive);
    }
  };

  const cancelArchive = () => {
    setShowArchiveModal(false);
    setListingToArchive(null);
  };

  const openDeleteModal = (listingId: string) => {
    setListingToDelete(listingId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (listingToDelete) {
      handleDelete(listingToDelete);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setListingToDelete(null);
  };

  // Bulk selection functions
  const toggleSelectListing = (listingId: string) => {
    const newSelected = new Set(selectedListings);
    if (newSelected.has(listingId)) {
      newSelected.delete(listingId);
    } else {
      newSelected.add(listingId);
    }
    setSelectedListings(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedListings.size === filteredArchivedListings.length) {
      setSelectedListings(new Set());
    } else {
      setSelectedListings(new Set(filteredArchivedListings.map(l => l.id)));
    }
  };

  const handleBulkDelete = async () => {
    setBulkActionInProgress(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const deletePromises = Array.from(selectedListings).map(listingId =>
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings/${listingId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
      );

      const results = await Promise.all(deletePromises);
      const failedCount = results.filter(r => !r.ok).length;

      if (failedCount > 0) {
        alert(`Failed to delete ${failedCount} listing(s). Please try again.`);
      }

      // Reset and refetch
      setActiveListings([]);
      setArchivedListings([]);
      setActiveOffset(0);
      setArchivedOffset(0);
      setHasMoreActive(true);
      setHasMoreArchived(true);
      setSelectedListings(new Set());
      setShowBulkDeleteModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to bulk delete listings:', error);
      alert('Failed to delete listings. Please try again.');
    } finally {
      setBulkActionInProgress(false);
    }
  };

  const handleBulkRenew = async () => {
    setBulkActionInProgress(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const renewPromises = Array.from(selectedListings).map(listingId =>
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings/${listingId}/renew`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
      );

      const results = await Promise.all(renewPromises);
      const failedCount = results.filter(r => !r.ok).length;

      if (failedCount > 0) {
        alert(`Failed to renew ${failedCount} listing(s). Please try again.`);
      }

      // Reset and refetch
      setActiveListings([]);
      setArchivedListings([]);
      setActiveOffset(0);
      setArchivedOffset(0);
      setHasMoreActive(true);
      setHasMoreArchived(true);
      setSelectedListings(new Set());
      setShowBulkRenewModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to bulk renew listings:', error);
      alert('Failed to renew listings. Please try again.');
    } finally {
      setBulkActionInProgress(false);
    }
  };

  // Get the return path from location state, default to home
  const returnPath = (location.state as any)?.from === 'profile' ? `/profile/${user?.id}` : '/';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to={returnPath} className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5" />
              <span>{t.myListings.back}</span>
            </Link>
            <Link
              to="/create-listing"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              <span>{t.myListings.newListing}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="mb-6">{t.myListings.title}</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-3 ${
                  activeTab === 'active'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.myListings.active} ({activeListings.length})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`px-6 py-3 ${
                  activeTab === 'archived'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.myListings.archived} ({archivedListings.length})
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.myListings.searchPlaceholder}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex justify-end">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === 'active' ? (
          filteredActiveListings.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <p className="text-gray-500 mb-4">{t.myListings.noActive}</p>
              <Link
                to="/create-listing"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                <span>{t.myListings.createFirst}</span>
              </Link>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredActiveListings.map((listing) => (
                    <div key={listing.id} className="bg-white rounded-lg p-4 shadow-sm">
                      <ListingCard listing={listing} user={user} />
                      <div className="mt-4">
                        <div className="flex justify-between text-gray-600 mb-2">
                          <span>{listing.views} {t.myListings.views}</span>
                          <span>{getTimeRemaining(listing.expires_at)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Link
                            to={`/edit-listing/${listing.id}`}
                            className="px-3 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center justify-center"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => openArchiveModal(listing.id)}
                            className="px-3 py-3 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                          >
                            <Archive className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(listing.id)}
                            className="px-3 py-3 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center justify-center"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActiveListings.map((listing) => (
                    <div key={listing.id} className="flex">
                      <ListingCard 
                        listing={listing} 
                        user={user} 
                        viewMode="list" 
                        showActions={true}
                        onEdit={(id) => window.location.href = `/edit-listing/${id}`}
                        onArchive={(id) => openArchiveModal(id)}
                      />
                    </div>
                  ))}
                </div>
              )}
              {loadingMore && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}
              <div ref={loadMoreRef} className="h-10"></div>
            </>
          )
        ) : (
          filteredArchivedListings.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <p className="text-gray-500">{t.myListings.noArchived}</p>
            </div>
          ) : (
            <>
              {/* Bulk Actions Toolbar */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                  >
                    {selectedListings.size === filteredArchivedListings.length && filteredArchivedListings.length > 0 ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    <span>Select All</span>
                  </button>
                  {selectedListings.size > 0 && (
                    <span className="text-gray-600">
                      {selectedListings.size} selected
                    </span>
                  )}
                </div>
                {selectedListings.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBulkRenewModal(true)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm"
                    >
                      <span>Renew</span>
                    </button>
                    <button
                      onClick={() => setShowBulkDeleteModal(true)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                    >
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredArchivedListings.map((listing) => (
                    <div key={listing.id} className="bg-white rounded-lg p-4 shadow-sm relative">
                      <ListingCard 
                        listing={listing} 
                        user={user}
                        showCheckbox={true}
                        isSelected={selectedListings.has(listing.id)}
                        onToggleSelect={() => toggleSelectListing(listing.id)}
                      />
                      <div className="mt-4 space-y-2">
                        <p className="text-gray-600 text-center mb-2">
                          {t.myListings.archivedOn} {new Date(listing.archived_at).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => handleRenew(listing.id)}
                          className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>{t.myListings.renewFor7Days}</span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(listing.id)}
                          className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{t.myListings.deletePermanently}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArchivedListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      user={user}
                      viewMode="list"
                      showActions={true}
                      isArchived={true}
                      showCheckbox={true}
                      isSelected={selectedListings.has(listing.id)}
                      onToggleSelect={() => toggleSelectListing(listing.id)}
                      onRenew={(id) => handleRenew(id)}
                      onDelete={(id) => openDeleteModal(id)}
                    />
                  ))}
                </div>
              )}
              {loadingMore && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}
              <div ref={loadMoreRef} className="h-10"></div>
            </>
          )
        )}

        {/* Archive Modal */}
        {showArchiveModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4 relative z-10">
              <h2 className="mb-4">{t.myListings.archiveTitle}</h2>
              <p className="text-gray-600 mb-6">{t.myListings.archiveMessage}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelArchive}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={confirmArchive}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4 relative z-10">
              <h2 className="mb-4 text-red-600">{t.myListings.deleteTitle}</h2>
              <p className="text-gray-600 mb-6">{t.myListings.deleteMessage}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {t.myListings.deletePermanently}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Renew Modal */}
        {showBulkRenewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4">
              <h2 className="mb-4">Renew {selectedListings.size} Listing{selectedListings.size > 1 ? 's' : ''}?</h2>
              <p className="text-gray-600 mb-6">
                This will renew the selected listings for 7 more days and move them back to active status.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBulkRenewModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={bulkActionInProgress}
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleBulkRenew}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  disabled={bulkActionInProgress}
                >
                  {bulkActionInProgress && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>Renew All</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Modal */}
        {showBulkDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-4">
              <h2 className="mb-4 text-red-600">Delete {selectedListings.size} Listing{selectedListings.size > 1 ? 's' : ''}?</h2>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. The selected listings will be permanently deleted.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={bulkActionInProgress}
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  disabled={bulkActionInProgress}
                >
                  {bulkActionInProgress && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>Delete All</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}