import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Filter, X, ChevronDown, ChevronUp, MapPin, Search, SlidersHorizontal, Plus } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import ListingCard from '../components/ListingCard';
import { useTranslation, nameToSlug } from '../translations';

interface HomePageProps {
  user: any;
}

export default function HomePage({ user }: HomePageProps) {
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('random');
  const [listingType, setListingType] = useState<'all' | 'sale' | 'rent'>('all');
  const [locationSearch, setLocationSearch] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [distance, setDistance] = useState(1);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('all');
  const [datePosted, setDatePosted] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Scroll restoration
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);

  // Helper function to get translated category name
  const getCategoryName = (categorySlug: string) => {
    return t.categories[categorySlug as keyof typeof t.categories] || categorySlug;
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Reset listings and offset when filters change
    setListings([]);
    setOffset(0);
    setHasMore(true);
  }, [selectedCategory, selectedSubcategory, searchQuery, sortBy, listingType, locationSearch, zipcode, distance, minPrice, maxPrice, condition, datePosted]);

  useEffect(() => {
    // Fetch listings when offset changes or on initial load
    fetchListings();
  }, [offset, selectedCategory, selectedSubcategory, searchQuery, sortBy, listingType, locationSearch, zipcode, distance, minPrice, maxPrice, condition, datePosted]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/categories`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      if (data.categories) {
        // Sort categories by sort_order field and add slug from name
        const sortedCategories = data.categories.map((cat: any) => ({
          ...cat,
          slug: cat.slug || nameToSlug(cat.name),
          subcategories: cat.subcategories?.map((sub: any) => ({
            ...sub,
            slug: sub.slug || nameToSlug(sub.name)
          })) || []
        })).sort((a: any, b: any) => {
          return (a.sort_order || 999) - (b.sort_order || 999);
        });
        setCategories(sortedCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      // Check if filters are active (no personalization with filters)
      const hasActiveFilters = selectedCategory !== 'all' || 
                               selectedSubcategory !== 'all' || 
                               searchQuery || 
                               zipcode || 
                               listingType !== 'all' ||
                               condition !== 'all' ||
                               datePosted !== 'all' ||
                               minPrice ||
                               maxPrice;

      const params = new URLSearchParams({
        status: 'active',
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedSubcategory !== 'all' && { subcategory: selectedSubcategory }),
        ...(searchQuery && { search: searchQuery }),
        ...(sortBy && { sort: sortBy }),
        ...(listingType !== 'all' && { type: listingType }),
        ...(locationSearch && { location: locationSearch }),
        ...(zipcode && { zipcode }),
        ...(zipcode && { distance: distance.toString() }),
        ...(minPrice && { minPrice: minPrice }),
        ...(maxPrice && { maxPrice: maxPrice }),
        ...(condition !== 'all' && { condition }),
        ...(datePosted !== 'all' && { datePosted }),
        offset: offset.toString(),
        limit: '20',
        // Enable personalization when browsing without filters and user is logged in
        ...(!hasActiveFilters && user && { personalized: 'true' })
      });

      console.log('Fetching listings with params:', params.toString());

      const headers: any = {
        'Authorization': `Bearer ${publicAnonKey}`
      };
      
      // Add user token if logged in for personalization
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings?${params}`,
        { headers }
      );
      const data = await response.json();
      console.log('Listings response:', data);
      if (data.listings) {
        setListings((prevListings) => {
          // Filter out duplicates by checking if listing id already exists
          const existingIds = new Set(prevListings.map(l => l.id));
          const newListings = data.listings.filter((listing: any) => !existingIds.has(listing.id));
          return [...prevListings, ...newListings];
        });
        setHasMore(data.hasMore ?? false); // Use backend's hasMore value
      }
      
      // Track search if user searched for something
      if (searchQuery && user) {
        trackSearch(searchQuery);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const trackSearch = async (query: string) => {
    if (!user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Determine category from search or selected category
      const category = selectedCategory !== 'all' ? selectedCategory : 'general';

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
            interactionType: 'search',
            listingId: null
          })
        }
      );
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedSubcategory('all'); // Reset subcategory when category changes
    setListingType('all'); // Reset listing type when category changes
    setLocationSearch(''); // Reset location search when category changes
    setZipcode(''); // Reset zipcode when category changes
    setDistance(50); // Reset distance when category changes
    setMinPrice(''); // Reset min price when category changes
    setMaxPrice(''); // Reset max price when category changes
    setCondition('all'); // Reset condition when category changes
    setDatePosted('all'); // Reset date posted when category changes
  };

  const selectedCategoryObj = categories.find(c => c.slug === selectedCategory);
  const subcategories = selectedCategoryObj?.subcategories || [];
  const showSubcategories = selectedCategory !== 'all' && subcategories.length > 0;
  const isRealEstate = selectedCategoryObj?.slug === 'real-estate';
  const isServices = selectedCategoryObj?.slug === 'services';

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSearchQuery('');
    setSortBy('random');
    setListingType('all');
    setLocationSearch('');
    setZipcode('');
    setDistance(1);
    setMinPrice('');
    setMaxPrice('');
    setCondition('all');
    setDatePosted('all');
  };

  const hasActiveFilters = 
    selectedCategory !== 'all' ||
    selectedSubcategory !== 'all' ||
    searchQuery !== '' ||
    sortBy !== 'random' ||
    listingType !== 'all' ||
    locationSearch !== '' ||
    zipcode !== '' ||
    distance !== 1 ||
    minPrice !== '' ||
    maxPrice !== '' ||
    condition !== 'all' ||
    datePosted !== 'all';

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (currentRef && !loadingMore) {
      const currentObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore) {
            setLoadingMore(true);
            setOffset((prevOffset) => prevOffset + 20);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t.header.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="mt-3 flex gap-2 justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{showFilters ? t.home.hideFilters : t.home.showFilters}</span>
            </button>
            
            <div className="flex gap-2 ml-auto">
              {!user && (
                <button
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span>{t.home.loginSignup}</span>
                </button>
              )}
              
              {user && (
                <button
                  onClick={() => navigate('/create-listing')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.header.createListing}</span>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="mt-4 space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              {/* Clear All Filters Button */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear All Filters</span>
                  </button>
                </div>
              )}

              {/* Sort By */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">{t.home.sortBy}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="random">{t.sorting.random}</option>
                  <option value="newest">{t.sorting.newest}</option>
                  <option value="oldest">{t.sorting.oldest}</option>
                  <option value="price_low">{t.sorting.priceAsc}</option>
                  <option value="price_high">{t.sorting.priceDesc}</option>
                </select>
              </div>

              {/* Location Search - Zipcode & Distance */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">{t.home.searchByLocation}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Zipcode Input */}
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">
                      {t.home.zipcode}
                    </label>
                    <input
                      type="text"
                      placeholder={t.home.enterZipcode}
                      value={zipcode}
                      onChange={(e) => setZipcode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                      maxLength={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Distance Slider */}
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">
                      {t.home.distance}: {distance} {distance !== 1 ? t.home.miles : t.home.mile}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="500"
                        step="1"
                        value={distance}
                        onChange={(e) => setDistance(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                        disabled={!zipcode}
                      />
                      <span className="text-sm text-gray-500 w-16 text-right">{distance}mi</span>
                    </div>
                  </div>

                  {/* Clear Button */}
                  {zipcode && (
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setZipcode('');
                          setDistance(50);
                        }}
                        className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg whitespace-nowrap"
                      >
                        {t.home.clear}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">{t.home.priceRange}</label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder={t.home.minPrice}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder={t.home.maxPrice}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">{t.home.condition}</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">{t.home.all}</option>
                  <option value="new">{t.home.new}</option>
                  <option value="like-new">{t.home.likeNew}</option>
                  <option value="good">{t.home.good}</option>
                  <option value="fair">{t.home.fair}</option>
                  <option value="poor">{t.home.poor}</option>
                </select>
              </div>

              {/* Date Posted */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">{t.home.datePosted}</label>
                <select
                  value={datePosted}
                  onChange={(e) => setDatePosted(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">{t.home.allTime}</option>
                  <option value="24h">{t.home.last24Hours}</option>
                  <option value="week">{t.home.last7Days}</option>
                  <option value="month">{t.home.last30Days}</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.home.all}
            </button>
            {(() => {
              // Priority categories in specific order
              const priorityOrder = ['cars', 'real-estate', 'services'];
              const priorityCategories = priorityOrder
                .map(slug => categories.find(cat => cat.slug === slug))
                .filter(Boolean);
              const otherCategories = categories.filter(
                cat => !priorityOrder.includes(cat.slug) && cat.slug !== 'other'
              );
              const otherCategory = categories.find(cat => cat.slug === 'other');
              const sortedCategories = [
                ...priorityCategories, 
                ...otherCategories,
                ...(otherCategory ? [otherCategory] : [])
              ];
              
              return sortedCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    selectedCategory === category.slug
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getCategoryName(category.slug)}
                </button>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Subcategories */}
      {showSubcategories && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-blue-100 [&::-webkit-scrollbar-thumb]:bg-blue-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-blue-400">
              <button
                onClick={() => setSelectedSubcategory('all')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm ${
                  selectedSubcategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-blue-100'
                }`}
              >
                {t.home.allCategories} {getCategoryName(selectedCategoryObj?.slug || '')}
              </button>
              {subcategories.map((subcategory: any) => (
                <button
                  key={subcategory.id}
                  onClick={() => setSelectedSubcategory(subcategory.slug)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm ${
                    selectedSubcategory === subcategory.slug
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-blue-100'
                  }`}
                >
                  {getCategoryName(subcategory.slug)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real Estate Buy/Rent Filter */}
      {isRealEstate && (
        <div className="bg-green-50 border-b border-green-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <span className="text-gray-700">{t.home.lookingTo}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setListingType('all')}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    listingType === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-green-100'
                  }`}
                >
                  {t.home.all}
                </button>
                <button
                  onClick={() => setListingType('sale')}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    listingType === 'sale'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-green-100'
                  }`}
                >
                  {t.home.buy}
                </button>
                <button
                  onClick={() => setListingType('rent')}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    listingType === 'rent'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-green-100'
                  }`}
                >
                  {t.home.rent}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-0 py-8">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 ml-4">
            {listings.length} {listings.length === 1 ? t.home.listingFound : t.home.listingsFound}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">{t.home.noListingsFound}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} user={user} />
            ))}
          </div>
        )}

        {loadingMore && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        <div ref={loadMoreRef} className="h-10"></div>
      </main>
    </div>
  );
}