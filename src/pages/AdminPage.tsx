import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Package, AlertTriangle, MessageSquare, Star, TrendingUp, FileText, Shield, Database, Scale, Ban, CheckCircle, XCircle, Trash2, Eye, Mail, Calendar, MapPin, Search, Grid, List, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { publicAnonKey } from '../utils/supabase/info';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Pagination } from '../components/Pagination';

interface AdminPageProps {
  user: any;
}

export default function AdminPage({ user }: AdminPageProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [reportStatus, setReportStatus] = useState('pending');
  const [userFilter, setUserFilter] = useState('all');
  const [listingFilter, setListingFilter] = useState('all');
  const [listingSort, setListingSort] = useState('newest');
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showListingPreview, setShowListingPreview] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [listingSearch, setListingSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [usersViewMode, setUsersViewMode] = useState<'list' | 'grid'>('list');
  const [listingsViewMode, setListingsViewMode] = useState<'list' | 'grid'>('list');
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [showBulkResultModal, setShowBulkResultModal] = useState(false);
  const [bulkRenewalResult, setBulkRenewalResult] = useState<{ success: number; failed: number } | null>(null);
  
  // Pagination states
  const [reportsPage, setReportsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [listingsPage, setListingsPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [categoriesTotal, setCategoriesTotal] = useState(0);
  
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    checkAdminStatus();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setReportsPage(1);
  }, [reportStatus]);

  useEffect(() => {
    setUsersPage(1);
  }, [userFilter, userSearch]);

  useEffect(() => {
    setListingsPage(1);
    setSelectedListings([]); // Clear selections when filter changes
  }, [listingFilter, listingSort, listingSearch]);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'analytics') {
        fetchAnalytics();
      } else if (activeTab === 'reports') {
        fetchReports();
      } else if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'listings') {
        fetchListings();
      } else if (activeTab === 'categories') {
        fetchCategories();
      }
    }
  }, [activeTab, reportStatus, userFilter, listingFilter, listingSort, isAdmin, reportsPage, usersPage, listingsPage, categoriesPage, listingSearch, userSearch]);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.profile?.is_admin) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Failed to check admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/analytics`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const offset = (reportsPage - 1) * ITEMS_PER_PAGE;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/reports?status=${reportStatus}&limit=${ITEMS_PER_PAGE}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.reports) {
        setReports(data.reports);
        setReportsTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const offset = (usersPage - 1) * ITEMS_PER_PAGE;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/users?filter=${userFilter}&search=${encodeURIComponent(userSearch)}&limit=${ITEMS_PER_PAGE}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
        setUsersTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const offset = (listingsPage - 1) * ITEMS_PER_PAGE;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/listings?filter=${listingFilter}&sort=${listingSort}&search=${encodeURIComponent(listingSearch)}&limit=${ITEMS_PER_PAGE}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.listings) {
        setListings(data.listings);
        setListingsTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const offset = (categoriesPage - 1) * ITEMS_PER_PAGE;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/categories?limit=${ITEMS_PER_PAGE}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
        setCategoriesTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllListings = () => {
    if (selectedListings.length === listings.length) {
      // Deselect all
      setSelectedListings([]);
    } else {
      // Select all current page listings
      setSelectedListings(listings.map(l => l.id));
    }
  };

  const handleToggleListingSelection = (listingId: string) => {
    setSelectedListings(prev => {
      if (prev.includes(listingId)) {
        return prev.filter(id => id !== listingId);
      } else {
        return [...prev, listingId];
      }
    });
  };

  const showBulkRenewConfirm = () => {
    if (selectedListings.length === 0) {
      return;
    }
    setShowBulkConfirmModal(true);
  };

  const handleBulkRenewListings = async () => {
    setShowBulkConfirmModal(false);
    setBulkActionLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setBulkActionLoading(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const listingId of selectedListings) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/listings/${listingId}/renew`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to renew listing ${listingId}`);
        }
      } catch (error) {
        failCount++;
        console.error(`Error renewing listing ${listingId}:`, error);
      }
    }

    setBulkActionLoading(false);
    setSelectedListings([]);
    
    // Show result modal
    setBulkRenewalResult({ success: successCount, failed: failCount });
    setShowBulkResultModal(true);
    
    // Refresh listings
    fetchListings();
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed', adminNotes: string, restoreListing: boolean = false) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/reports/${reportId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status,
            admin_notes: adminNotes,
            restore_listing: restoreListing
          })
        }
      );

      if (response.ok) {
        await fetchReports();
      }
    } catch (error) {
      console.error('Failed to resolve report:', error);
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    if (!confirm('Are you sure you want to ban this user? They will no longer be able to access the marketplace.')) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/users/${userId}/ban`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason })
        }
      );

      if (response.ok) {
        alert('User banned successfully');
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to ban user:', error);
      alert('Failed to ban user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unban this user?')) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/users/${userId}/unban`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        alert('User unbanned successfully');
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to unban user:', error);
      alert('Failed to unban user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to permanently delete this listing? This action cannot be undone.')) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/listings/${listingId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        await onResolve(report.id, 'resolved', adminNotes || 'Listing deleted by admin', false);
      }
    } catch (error) {
      console.error('Failed to delete listing:', error);
      alert('Failed to delete listing. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You do not have permission to access this page.</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Go back to home
          </Link>
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> To set up an admin user, you need to update the user's is_admin field to true in the Supabase database profiles table.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="mb-6">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-3 whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Reports
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('listings')}
                className={`px-6 py-3 whitespace-nowrap ${
                  activeTab === 'listings'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Listings
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-3 whitespace-nowrap ${
                  activeTab === 'categories'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setActiveTab('policies')}
                className={`px-6 py-3 whitespace-nowrap ${
                  activeTab === 'policies'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Policy & Data
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'analytics' ? (
          loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : analytics ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">Total Users</p>
                      <p className="text-blue-600">{analytics.totalUsers}</p>
                    </div>
                    <Users className="w-10 h-10 text-blue-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">Total Listings</p>
                      <p className="text-blue-600">{analytics.totalListings}</p>
                    </div>
                    <Package className="w-10 h-10 text-blue-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">Active Listings</p>
                      <p className="text-blue-600">{analytics.activeListings}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-blue-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">Pending Reports</p>
                      <p className="text-blue-600">{analytics.pendingReports}</p>
                    </div>
                    <AlertTriangle className="w-10 h-10 text-red-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">Total Messages</p>
                      <p className="text-blue-600">{analytics.totalMessages}</p>
                    </div>
                    <MessageSquare className="w-10 h-10 text-blue-600 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">Total Reviews</p>
                      <p className="text-blue-600">{analytics.totalReviews}</p>
                    </div>
                    <Star className="w-10 h-10 text-blue-600 opacity-20" />
                  </div>
                </div>
              </div>

              {/* Category Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="mb-4">Listings by Category</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {analytics.categoryStats && Object.entries(analytics.categoryStats).map(([category, count]: [string, any]) => (
                    <div key={category} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-600 mb-1">{category}</p>
                      <p className="text-blue-600">{count} listings</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subcategory Counts */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="mb-4">Subcategories per Category</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {analytics.categorySubcategoryCounts && analytics.categorySubcategoryCounts.map((item: any) => (
                    <div key={item.name} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <p className="text-gray-700 mb-1">{item.name}</p>
                      <p className="text-blue-600">{item.subcategoryCount} subcategories</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Total:</strong> {analytics.categorySubcategoryCounts?.reduce((sum: number, item: any) => sum + item.subcategoryCount, 0)} subcategories across all categories
                  </p>
                </div>
              </div>
            </>
          ) : null
        ) : activeTab === 'reports' ? (
          <>
            {/* Report Status Filter */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setReportStatus('pending')}
                  className={`px-4 py-2 rounded-lg ${
                    reportStatus === 'pending'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setReportStatus('resolved')}
                  className={`px-4 py-2 rounded-lg ${
                    reportStatus === 'resolved'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Resolved
                </button>
                <button
                  onClick={() => setReportStatus('dismissed')}
                  className={`px-4 py-2 rounded-lg ${
                    reportStatus === 'dismissed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Dismissed
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500">No {reportStatus} reports</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onResolve={handleResolveReport}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={reportsPage}
                  totalItems={reportsTotal}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setReportsPage}
                />
              </>
            )}
          </>
        ) : activeTab === 'users' ? (
          <>
            {/* User Search */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* User Filter */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setUserFilter('all')}
                    className={`px-4 py-2 rounded-lg ${
                      userFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setUserFilter('active')}
                    className={`px-4 py-2 rounded-lg ${
                      userFilter === 'active'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setUserFilter('banned')}
                    className={`px-4 py-2 rounded-lg ${
                      userFilter === 'banned'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Banned
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUsersViewMode('list')}
                    className={`p-2 rounded-lg ${
                      usersViewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title="List View"
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setUsersViewMode('grid')}
                    className={`p-2 rounded-lg ${
                      usersViewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <>
                <div className={usersViewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-4'}>
                  {users.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onRefresh={fetchUsers}
                      viewMode={usersViewMode}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={usersPage}
                  totalItems={usersTotal}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setUsersPage}
                />
              </>
            )}
          </>
        ) : activeTab === 'listings' ? (
          <>
            {/* Listing Search */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search listings by title, description, seller name, or email..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Listing Filter */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setListingFilter('all')}
                    className={`px-4 py-2 rounded-lg ${
                      listingFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setListingFilter('active')}
                    className={`px-4 py-2 rounded-lg ${
                      listingFilter === 'active'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setListingFilter('disabled')}
                    className={`px-4 py-2 rounded-lg ${
                      listingFilter === 'disabled'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Disabled
                  </button>
                  <button
                    onClick={() => setListingFilter('archived')}
                    className={`px-4 py-2 rounded-lg ${
                      listingFilter === 'archived'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Archived
                  </button>

                  {/* Bulk Selection Controls - Only show for archived filter */}
                  {listingFilter === 'archived' && listings.length > 0 && (
                    <>
                      <div className="w-px bg-gray-300 mx-2" />
                      <button
                        onClick={handleSelectAllListings}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        {selectedListings.length === listings.length ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                        {selectedListings.length === listings.length ? 'Deselect All' : 'Select All'}
                      </button>
                      
                      {selectedListings.length > 0 && (
                        <button
                          onClick={showBulkRenewConfirm}
                          disabled={bulkActionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {bulkActionLoading ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              Renewing {selectedListings.length}...
                            </>
                          ) : (
                            <>
                              <Calendar className="w-5 h-5" />
                              Renew Selected ({selectedListings.length})
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setListingsViewMode('list')}
                    className={`p-2 rounded-lg ${
                      listingsViewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title="List View"
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setListingsViewMode('grid')}
                    className={`p-2 rounded-lg ${
                      listingsViewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Listing Sort */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setListingSort('newest')}
                  className={`px-4 py-2 rounded-lg ${
                    listingSort === 'newest'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setListingSort('oldest')}
                  className={`px-4 py-2 rounded-lg ${
                    listingSort === 'oldest'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Oldest
                </button>
                <button
                  onClick={() => setListingSort('price_asc')}
                  className={`px-4 py-2 rounded-lg ${
                    listingSort === 'price_asc'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Price (Low to High)
                </button>
                <button
                  onClick={() => setListingSort('price_desc')}
                  className={`px-4 py-2 rounded-lg ${
                    listingSort === 'price_desc'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Price (High to Low)
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500">No listings found</p>
              </div>
            ) : (
              <>
                <div className={listingsViewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-4'}>
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onPreview={setSelectedListing}
                      onShowPreview={setShowListingPreview}
                      onRefresh={fetchListings}
                      viewMode={listingsViewMode}
                      showCheckbox={listingFilter === 'archived'}
                      isSelected={selectedListings.includes(listing.id)}
                      onToggleSelection={handleToggleListingSelection}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={listingsPage}
                  totalItems={listingsTotal}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setListingsPage}
                />
              </>
            )}
          </>
        ) : activeTab === 'categories' ? (
          <>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500">No categories found</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {categories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onShowModal={setShowCategoryModal}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={categoriesPage}
                  totalItems={categoriesTotal}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCategoriesPage}
                />
              </>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {/* Policy Management */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2>Legal Documents</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Manage your marketplace's legal documents and policies.
              </p>
              <div className="space-y-3">
                <Link
                  to="/terms"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Scale className="w-5 h-5 text-gray-600" />
                    <div>
                      <p>Terms of Service</p>
                      <p className="text-gray-500 text-sm">Last updated: System default</p>
                    </div>
                  </div>
                  <span className="text-blue-600">View →</span>
                </Link>
                <Link
                  to="/privacy"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <p>Privacy Policy</p>
                      <p className="text-gray-500 text-sm">Last updated: System default</p>
                    </div>
                  </div>
                  <span className="text-blue-600">View →</span>
                </Link>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-blue-600" />
                <h2>Data Management</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Access your Supabase database and manage platform data directly.
              </p>
              <div className="space-y-4">
                <a
                  href={`https://supabase.com/dashboard/project/${projectId}/editor`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p>Database Editor</p>
                    <p className="text-gray-500 text-sm">Manage tables and data in Supabase</p>
                  </div>
                  <span className="text-blue-600">Open ↗</span>
                </a>
                <a
                  href={`https://supabase.com/dashboard/project/${projectId}/database/tables`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p>Table Structure</p>
                    <p className="text-gray-500 text-sm">View and modify table schemas</p>
                  </div>
                  <span className="text-blue-600">Open ↗</span>
                </a>
                <a
                  href={`https://supabase.com/dashboard/project/${projectId}/storage/buckets`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p>Storage Buckets</p>
                    <p className="text-gray-500 text-sm">Manage uploaded images and files</p>
                  </div>
                  <span className="text-blue-600">Open ↗</span>
                </a>
                <a
                  href={`https://supabase.com/dashboard/project/${projectId}/auth/users`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p>User Management</p>
                    <p className="text-gray-500 text-sm">View and manage user accounts</p>
                  </div>
                  <span className="text-blue-600">Open ↗</span>
                </a>
              </div>
            </div>

            {/* Compliance Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-yellow-900 mb-2">Data Protection Notice</p>
                  <p className="text-yellow-800 text-sm">
                    As an administrator, you have access to sensitive user data. Please ensure compliance with GDPR, CCPA, and other applicable data protection regulations. Always handle user data responsibly and maintain appropriate security measures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bulk Renewal Confirmation Modal */}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl text-white">Renew Listings</h3>
                  <p className="text-purple-100 text-sm">Bulk Action Confirmation</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                You are about to renew <strong className="text-purple-600">{selectedListings.length} listing{selectedListings.length !== 1 ? 's' : ''}</strong>.
              </p>
              <p className="text-gray-600 text-sm">
                All selected listings will be:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Set to <strong>active</strong> status</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Extended for another <strong>7 days</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Visible to all users</span>
                </li>
              </ul>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowBulkConfirmModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkRenewListings}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg shadow-purple-500/30"
              >
                Confirm Renewal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Renewal Result Modal */}
      {showBulkResultModal && bulkRenewalResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className={`p-6 ${
              bulkRenewalResult.failed === 0 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                : 'bg-gradient-to-r from-purple-600 to-violet-600'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  {bulkRenewalResult.failed === 0 ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl text-white">
                    {bulkRenewalResult.failed === 0 ? 'Renewal Complete!' : 'Renewal Finished'}
                  </h3>
                  <p className="text-white/90 text-sm">Bulk action results</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* Success Count */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-green-900">Successfully Renewed</p>
                      <p className="text-green-700 text-sm">Listings are now active</p>
                    </div>
                  </div>
                  <div className="text-2xl text-green-600">
                    {bulkRenewalResult.success}
                  </div>
                </div>

                {/* Failed Count */}
                {bulkRenewalResult.failed > 0 && (
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-red-900">Failed to Renew</p>
                        <p className="text-red-700 text-sm">Check console for details</p>
                      </div>
                    </div>
                    <div className="text-2xl text-red-600">
                      {bulkRenewalResult.failed}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-600 text-sm text-center">
                    Total: {bulkRenewalResult.success + bulkRenewalResult.failed} listing{(bulkRenewalResult.success + bulkRenewalResult.failed) !== 1 ? 's' : ''} processed
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => {
                  setShowBulkResultModal(false);
                  setBulkRenewalResult(null);
                }}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg shadow-purple-500/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ReportCardProps {
  report: any;
  onResolve: (reportId: string, status: 'resolved' | 'dismissed', adminNotes: string, restoreListing: boolean) => void;
}

function ReportCard({ report, onResolve }: ReportCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [restoreListing, setRestoreListing] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getImageUrl = (listing: any) => {
    if (listing?.images && listing.images.length > 0) {
      return listing.images[0];
    }
    return null;
  };

  const handleDeleteListing = async () => {
    if (!confirm('Are you sure you want to permanently delete this listing? This action cannot be undone.')) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/listings/${report.listing_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        await onResolve(report.id, 'resolved', adminNotes || 'Listing deleted by admin', false);
      }
    } catch (error) {
      console.error('Failed to delete listing:', error);
      alert('Failed to delete listing. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async () => {
    const userId = report.listing?.user_id || report.reported_user_id;
    if (!userId) return;

    if (!confirm('Are you sure you want to ban this user? They will no longer be able to access the marketplace.')) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/users/${userId}/ban`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason: adminNotes || 'Banned for policy violation' })
        }
      );

      if (response.ok) {
        await onResolve(report.id, 'resolved', adminNotes || 'User banned by admin', false);
      }
    } catch (error) {
      console.error('Failed to ban user:', error);
      alert('Failed to ban user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Report Header */}
      <div className="bg-red-50 border-b border-red-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="px-2 py-1 bg-red-600 text-white rounded text-sm">
                {report.listing_id ? 'Listing Report' : 'User Report'}
              </span>
              <span className="text-gray-600 text-sm">{formatDate(report.created_at)}</span>
            </div>
            <div className="mt-2">
              <p className="text-gray-700">
                <strong>Reporter:</strong> {report.reporter?.name} ({report.reporter?.email})
              </p>
              <p className="text-red-700 mt-1">
                <strong>Reason:</strong> {report.reason}
              </p>
            </div>
          </div>
          {report.status === 'pending' && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-4"
            >
              {showDetails ? 'Hide Actions' : 'Review'}
            </button>
          )}
        </div>
      </div>

      {/* Listing Preview (if listing report) */}
      {report.listing && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="mb-4">Reported Listing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Listing Image */}
            <div className="md:col-span-1">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                {getImageUrl(report.listing) ? (
                  <ImageWithFallback
                    src={getImageUrl(report.listing)}
                    alt={report.listing.title}
                    className="w-full h-full object-contain bg-gray-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            </div>

            {/* Listing Details */}
            <div className="md:col-span-2">
              <Link 
                to={`/listing/${report.listing.id}`}
                target="_blank"
                className="text-blue-600 hover:underline flex items-center gap-2 mb-3"
              >
                <h2>{report.listing.title}</h2>
                <Eye className="w-5 h-5" />
              </Link>
              <p className="text-blue-600 mb-3">{formatPrice(report.listing.price)}</p>
              <p className="text-gray-700 mb-3 line-clamp-3">{report.listing.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {report.listing.categories && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {report.listing.categories.name}
                  </span>
                )}
                {report.listing.subcategories && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                    {report.listing.subcategories.name}
                  </span>
                )}
                {report.listing.status && (
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    report.listing.status === 'active' ? 'bg-green-100 text-green-700' : 
                    report.listing.status === 'disabled' ? 'bg-red-100 text-red-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {report.listing.status}
                  </span>
                )}
              </div>
              
              {report.listing.profiles && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Seller Information</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-800">{report.listing.profiles.name}</p>
                    <span className="text-gray-400">•</span>
                    <p className="text-gray-600 text-sm">{report.listing.profiles.email}</p>
                    {report.listing.profiles.rating_count > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{report.listing.profiles.rating_average?.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">({report.listing.profiles.rating_count})</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Report Preview */}
      {report.reported_user && !report.listing && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="mb-3">Reported User</h3>
          <div className="flex items-center gap-3">
            {report.reported_user.avatar_url ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
                <ImageWithFallback
                  src={report.reported_user.avatar_url}
                  alt={report.reported_user.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                <Users className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div>
              <p className="text-gray-800 mb-1">{report.reported_user.name}</p>
              <p className="text-gray-600 text-sm flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {report.reported_user.email}
              </p>
              {report.reported_user.created_at && (
                <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDate(report.reported_user.created_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Actions */}
      {showDetails && report.status === 'pending' && (
        <div className="p-6 bg-gray-50">
          <h3 className="mb-4">Admin Actions</h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes about this report (optional)..."
            />
          </div>

          {report.listing_id && report.listing?.status === 'disabled' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm mb-2">
                <strong>Note:</strong> This listing is currently disabled (likely due to reaching 3 reports).
              </p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={restoreListing}
                  onChange={(e) => setRestoreListing(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Restore listing to active status</span>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {report.listing_id && (
              <button
                onClick={handleDeleteListing}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
                Delete Listing
              </button>
            )}
            
            <button
              onClick={handleBanUser}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Ban className="w-5 h-5" />
              Ban User
            </button>
            
            <button
              onClick={() => onResolve(report.id, 'dismissed', adminNotes, false)}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-5 h-5" />
              Dismiss Report
            </button>
            
            <button
              onClick={() => onResolve(report.id, 'resolved', adminNotes, restoreListing)}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              Mark Resolved
            </button>
          </div>
        </div>
      )}

      {/* Resolved/Dismissed Status */}
      {report.status !== 'pending' && (
        <div className="p-6 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            {report.status === 'resolved' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-600" />
            )}
            <p className="text-gray-800">
              <strong>Status:</strong> {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </p>
          </div>
          {report.admin_notes && (
            <p className="text-gray-700 mt-2">
              <strong>Admin Notes:</strong> {report.admin_notes}
            </p>
          )}
          {report.resolved_at && (
            <p className="text-gray-500 text-sm mt-2">
              Resolved on {formatDate(report.resolved_at)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface UserCardProps {
  user: any;
  onRefresh: () => void;
  viewMode?: 'list' | 'grid';
}

function UserCard({ user, onRefresh, viewMode = 'list' }: UserCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleBanUser = async () => {
    if (!confirm('Are you sure you want to ban this user? They will no longer be able to access the marketplace.')) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/users/${user.id}/ban`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason: adminNotes || 'Banned for policy violation' })
        }
      );

      if (response.ok) {
        alert('User banned successfully');
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to ban user:', error);
      alert('Failed to ban user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!confirm('Are you sure you want to unban this user?')) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/users/${user.id}/unban`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        alert('User unbanned successfully');
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to unban user:', error);
      alert('Failed to unban user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const isBanned = user.is_banned === true;

  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* Grid Card Content */}
        <div className={`p-4 ${isBanned ? 'bg-red-50' : 'bg-gray-50'}`}>
          <div className="flex flex-col items-center text-center">
            {user.avatar_url ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 mb-3">
                <ImageWithFallback
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 mb-3">
                <Users className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <p className="text-gray-800 mb-1 truncate w-full">{user.name}</p>
            <p className="text-gray-600 text-sm truncate w-full">{user.email}</p>
            {isBanned ? (
              <span className="mt-2 px-2 py-1 bg-red-600 text-white rounded text-xs inline-flex items-center gap-1">
                <Ban className="w-3 h-3" />
                Banned
              </span>
            ) : (
              <span className="mt-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Active
              </span>
            )}
          </div>
        </div>
        <div className="p-4 border-t">
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div>
              <p className="text-gray-500">Listings</p>
              <p className="text-blue-600">{user.listing_count || 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Reports</p>
              <p className={user.report_count > 0 ? 'text-red-600' : 'text-gray-600'}>
                {user.report_count || 0}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
        
        {/* Admin Actions in Grid View */}
        {showDetails && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="space-y-2">
              <Link
                to={`/profile/${user.id}`}
                target="_blank"
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
              >
                <Eye className="w-4 h-4" />
                Profile
              </Link>
              {isBanned ? (
                <button
                  onClick={handleUnbanUser}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Unban
                </button>
              ) : (
                <button
                  onClick={handleBanUser}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  Ban
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* User Header */}
      <div className={`border-b p-4 ${isBanned ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isBanned ? (
                <span className="px-2 py-1 bg-red-600 text-white rounded text-sm flex items-center gap-1">
                  <Ban className="w-4 h-4" />
                  Banned User
                </span>
              ) : (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Active User
                </span>
              )}
              <span className="text-gray-600 text-sm">Joined {formatDate(user.created_at)}</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              {user.avatar_url ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300">
                  <ImageWithFallback
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                  <Users className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div>
                <p className="text-gray-800 mb-1">{user.name}</p>
                <p className="text-gray-600 text-sm flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-4"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>
      </div>

      {/* User Stats */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Total Listings</p>
            <p className="text-blue-600">{user.listing_count || 0}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Reports Received</p>
            <p className={`${user.report_count > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {user.report_count || 0}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Average Rating</p>
            <p className="text-gray-800">
              {user.rating_average ? user.rating_average.toFixed(1) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">City</p>
            <p className="text-gray-800">{user.city || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {showDetails && (
        <div className="p-6 bg-gray-50">
          <h3 className="mb-4">Admin Actions</h3>
          
          {!isBanned && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Ban Reason</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Reason for banning this user (optional)..."
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              to={`/profile/${user.id}`}
              target="_blank"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              <Eye className="w-5 h-5" />
              View Profile
            </Link>
            
            {isBanned ? (
              <button
                onClick={handleUnbanUser}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                Unban User
              </button>
            ) : (
              <button
                onClick={handleBanUser}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Ban className="w-5 h-5" />
                Ban User
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ban Status */}
      {isBanned && (
        <div className="p-6 bg-red-50 border-t border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <Ban className="w-5 h-5 text-red-600" />
            <p className="text-red-800">
              <strong>Status:</strong> Banned
            </p>
          </div>
          {user.ban_reason && (
            <p className="text-red-700 mt-2">
              <strong>Reason:</strong> {user.ban_reason}
            </p>
          )}
          {user.banned_at && (
            <p className="text-red-600 text-sm mt-2">
              Banned on {formatDate(user.banned_at)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface ListingCardProps {
  listing: any;
  onPreview: (listing: any) => void;
  onShowPreview: (show: boolean) => void;
  onRefresh?: () => void;
  viewMode?: 'list' | 'grid';
  showCheckbox?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

function ListingCard({ listing, onPreview, onShowPreview, onRefresh, viewMode = 'list', showCheckbox = false, isSelected = false, onToggleSelection }: ListingCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'disable' | 'enable' | 'ban';
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getImageUrl = (listing: any) => {
    if (listing?.images && listing.images.length > 0) {
      return listing.images[0];
    }
    return null;
  };

  const showDisableConfirm = () => {
    setConfirmAction({
      type: 'disable',
      title: 'Disable Listing',
      message: 'Are you sure you want to disable this listing? It will be hidden from public view.',
      onConfirm: executeDisableListing
    });
    setShowConfirmModal(true);
  };

  const executeDisableListing = async () => {
    setShowConfirmModal(false);
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('You must be logged in');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/listings/${listing.id}/disable`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: 'Disabled by admin' })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Disable listing error response:', errorText);
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('Disable listing success:', result);
      onShowPreview(false);
      onPreview(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to disable listing:', error);
      alert(`Failed to disable listing: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const showEnableConfirm = () => {
    setConfirmAction({
      type: 'enable',
      title: 'Enable Listing',
      message: 'Are you sure you want to enable this listing? It will be visible to the public.',
      onConfirm: executeEnableListing
    });
    setShowConfirmModal(true);
  };

  const executeEnableListing = async () => {
    setShowConfirmModal(false);
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('You must be logged in');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/listings/${listing.id}/enable`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Enable listing error response:', errorText);
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('Enable listing success:', result);
      onShowPreview(false);
      onPreview(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to enable listing:', error);
      alert(`Failed to enable listing: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const showRenewConfirm = () => {
    setConfirmAction({
      type: 'renew',
      title: 'Renew Listing',
      message: 'Are you sure you want to renew this listing? It will be set to active status and extended for another 7 days.',
      onConfirm: executeRenewListing
    });
    setShowConfirmModal(true);
  };

  const executeRenewListing = async () => {
    setShowConfirmModal(false);
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('You must be logged in');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/listings/${listing.id}/renew`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Renew listing error response:', errorText);
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('Renew listing success:', result);
      onShowPreview(false);
      onPreview(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to renew listing:', error);
      alert(`Failed to renew listing: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const showBanConfirm = () => {
    setConfirmAction({
      type: 'ban',
      title: 'Ban User',
      message: 'Are you sure you want to ban this user? They will no longer be able to access the marketplace, and all their active listings will be disabled.',
      onConfirm: executeBanUser
    });
    setShowConfirmModal(true);
  };

  const executeBanUser = async () => {
    setShowConfirmModal(false);
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('You must be logged in');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/admin/users/${listing.user_id}/ban`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: 'Banned by admin from listing management' })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ban user error response:', errorText);
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('Ban user success:', result);
      onShowPreview(false);
      onPreview(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to ban user:', error);
      alert(`Failed to ban user: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = () => {
    window.open(`/messages?userId=${listing.user_id}`, '_blank');
  };

  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* Grid Card Content */}
        <div className="aspect-square bg-gray-200 overflow-hidden relative">
          {getImageUrl(listing) ? (
            <ImageWithFallback
              src={getImageUrl(listing)}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="w-12 h-12" />
            </div>
          )}
          {showCheckbox && onToggleSelection && (
            <div className="absolute top-2 left-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelection(listing.id);
                }}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-50"
              >
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-purple-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded text-xs ${
              listing.status === 'active' ? 'bg-green-600 text-white' : 
              listing.status === 'disabled' ? 'bg-red-600 text-white' : 
              'bg-gray-600 text-white'
            }`}>
              {listing.status}
            </span>
          </div>
        </div>
        <div className="p-4">
          <p className="text-gray-800 mb-1 truncate">{listing.title}</p>
          <p className="text-blue-600 mb-2">{formatPrice(listing.price)}</p>
          <p className="text-gray-600 text-sm truncate mb-2">{listing.profiles?.name}</p>
          <p className="text-gray-500 text-xs mb-3">{listing.categories?.name}</p>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>

        {/* Admin Actions in Grid View */}
        {showDetails && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="space-y-2">
              <Link
                to={`/listing/${listing.id}`}
                target="_blank"
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
              >
                <Eye className="w-4 h-4" />
                View
              </Link>
              
              {listing.status === 'active' ? (
                <button
                  onClick={showDisableConfirm}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Disable
                </button>
              ) : (
                <button
                  onClick={showEnableConfirm}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Enable
                </button>
              )}

              {listing.status === 'archived' && (
                <button
                  onClick={showRenewConfirm}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4" />
                  Renew
                </button>
              )}

              <button
                onClick={showBanConfirm}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                Ban User
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Listing Header */}
      <div className={`bg-gray-50 border-b border-gray-200 p-4 border-l-4 ${listing.status === 'active' ? 'border-l-green-600' : 'border-l-blue-600'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {showCheckbox && onToggleSelection && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelection(listing.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              )}
              <Package className="w-5 h-5 text-blue-600" />
              <div className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${listing.status === 'active' ? 'border-green-600' : 'border-blue-600'}`}>
                {getImageUrl(listing) ? (
                  <ImageWithFallback
                    src={getImageUrl(listing)}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <span className="text-gray-600 text-sm">{formatDate(listing.created_at)}</span>
            </div>
            <div className="mt-2">
              <p className="text-gray-700">
                <strong>Seller:</strong> {listing.profiles?.name} ({listing.profiles?.email})
              </p>
              <p className="text-gray-500 mt-1">
                <strong>Category:</strong> {listing.categories?.name}
              </p>
              <p className="text-gray-500 mt-1">
                <strong>Subcategory:</strong> {listing.subcategories?.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-4"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>
      </div>

      {/* Listing Preview */}
      {showDetails && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="mb-4">Listing Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Listing Image */}
            <div className="md:col-span-1">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                {getImageUrl(listing) ? (
                  <ImageWithFallback
                    src={getImageUrl(listing)}
                    alt={listing.title}
                    className="w-full h-full object-contain bg-gray-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            </div>

            {/* Listing Details */}
            <div className="md:col-span-2">
              <Link 
                to={`/listing/${listing.id}`}
                target="_blank"
                className="text-blue-600 hover:underline flex items-center gap-2 mb-3"
              >
                <h2>{listing.title}</h2>
                <Eye className="w-5 h-5" />
              </Link>
              <p className="text-blue-600 mb-3">{formatPrice(listing.price)}</p>
              <p className="text-gray-700 mb-3 line-clamp-3">{listing.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {listing.categories && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {listing.categories.name}
                  </span>
                )}
                {listing.subcategories && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                    {listing.subcategories.name}
                  </span>
                )}
                {listing.status && (
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    listing.status === 'active' ? 'bg-green-100 text-green-700' : 
                    listing.status === 'disabled' ? 'bg-red-100 text-red-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {listing.status}
                  </span>
                )}
              </div>
              
              {listing.profiles && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Seller Information</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-800">{listing.profiles.name}</p>
                    <span className="text-gray-400">•</span>
                    <p className="text-gray-600 text-sm">{listing.profiles.email}</p>
                    {listing.profiles.rating_count > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{listing.profiles.rating_average?.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">({listing.profiles.rating_count})</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Actions */}
      {showDetails && (
        <div className="p-6 bg-gray-50">
          <h3 className="mb-4">Admin Actions</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              to={`/listing/${listing.id}`}
              target="_blank"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              <Eye className="w-5 h-5" />
              View Listing
            </Link>

            <Link
              to={`/edit-listing/${listing.id}`}
              target="_blank"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
            >
              <FileText className="w-5 h-5" />
              Edit Listing
            </Link>
            
            {listing.status === 'active' ? (
              <button
                onClick={showDisableConfirm}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-5 h-5" />
                Disable Listing
              </button>
            ) : (
              <button
                onClick={showEnableConfirm}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                Enable Listing
              </button>
            )}

            {listing.status === 'archived' && (
              <button
                onClick={showRenewConfirm}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="w-5 h-5" />
                Renew Listing
              </button>
            )}

            <button
              onClick={showBanConfirm}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Ban className="w-5 h-5" />
              Ban User
            </button>

            <button
              onClick={handleSendMessage}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
            >
              <MessageSquare className="w-5 h-5" />
              Send Message
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border-2 border-gray-300">
            <div className="p-6">
              <h3 className="mb-4 text-red-600">{confirmAction.title}</h3>
              <p className="text-gray-700 mb-6">{confirmAction.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction.onConfirm}
                  className={`px-4 py-2 text-white rounded-lg ${
                    confirmAction.type === 'ban' || confirmAction.type === 'disable'
                      ? 'bg-red-600 hover:bg-red-700'
                      : confirmAction.type === 'renew'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

interface CategoryCardProps {
  category: any;
  onShowModal: (show: boolean) => void;
}

function CategoryCard({ category, onShowModal }: CategoryCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Category Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="px-2 py-1 bg-blue-600 text-white rounded text-sm">
                {category.name}
              </span>
              <span className="text-gray-600 text-sm">{formatDate(category.created_at)}</span>
            </div>
            <div className="mt-2">
              <p className="text-gray-700">
                <strong>Description:</strong> {category.description}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-4"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>
      </div>

      {/* Category Preview */}
      {showDetails && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="mb-4">Category Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Image */}
            <div className="md:col-span-1">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                {category.image_url ? (
                  <ImageWithFallback
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-full object-contain bg-gray-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            </div>

            {/* Category Details */}
            <div className="md:col-span-2">
              <Link 
                to={`/category/${category.id}`}
                target="_blank"
                className="text-blue-600 hover:underline flex items-center gap-2 mb-3"
              >
                <h2>{category.name}</h2>
                <Eye className="w-5 h-5" />
              </Link>
              <p className="text-gray-700 mb-3 line-clamp-3">{category.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {category.subcategories && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                    {category.subcategories.length} subcategories
                  </span>
                )}
              </div>
              
              {category.profiles && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Admin Information</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-800">{category.profiles.name}</p>
                    <span className="text-gray-400">•</span>
                    <p className="text-gray-600 text-sm">{category.profiles.email}</p>
                    {category.profiles.rating_count > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{category.profiles.rating_average?.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">({category.profiles.rating_count})</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Actions */}
      {showDetails && (
        <div className="p-6 bg-gray-50">
          <h3 className="mb-4">Admin Actions</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              to={`/category/${category.id}`}
              target="_blank"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              <Eye className="w-5 h-5" />
              View Category
            </Link>
            
            <button
              onClick={() => onShowModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="w-5 h-5" />
              Edit Category
            </button>
          </div>
        </div>
      )}
    </div>
  );
}