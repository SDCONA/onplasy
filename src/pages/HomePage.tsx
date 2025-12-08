import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, SlidersHorizontal, Plus } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import ListingCard from '../components/ListingCard';
import { useNavigate } from 'react-router-dom';

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
  const [distance, setDistance] = useState(50);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Reset listings and offset when filters change
    setListings([]);
    setOffset(0);
    setHasMore(true);
  }, [selectedCategory, selectedSubcategory, searchQuery, sortBy, listingType, locationSearch, zipcode, distance]);

  useEffect(() => {
    // Fetch listings when offset changes or on initial load
    fetchListings();
  }, [offset, selectedCategory, selectedSubcategory, searchQuery, sortBy, listingType, locationSearch, zipcode, distance]);

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
        // Sort categories by sort_order field
        const sortedCategories = data.categories.sort((a: any, b: any) => {
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
        offset: offset.toString(),
        limit: '20'
      });

      console.log('Fetching listings with params:', params.toString());

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
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
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedSubcategory('all'); // Reset subcategory when category changes
    setListingType('all'); // Reset listing type when category changes
    setLocationSearch(''); // Reset location search when category changes
    setZipcode(''); // Reset zipcode when category changes
    setDistance(50); // Reset distance when category changes
  };

  const selectedCategoryObj = categories.find(c => c.slug === selectedCategory);
  const subcategories = selectedCategoryObj?.subcategories || [];
  const showSubcategories = selectedCategory !== 'all' && subcategories.length > 0;
  const isRealEstate = selectedCategoryObj?.slug === 'real-estate';
  const isServices = selectedCategoryObj?.slug === 'services';

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
              placeholder="Search for products..."
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
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>
            
            <div className="flex gap-2 ml-auto">
              {!user && (
                <button
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span>Login / Sign Up</span>
                </button>
              )}
              
              {user && (
                <button
                  onClick={() => navigate('/create-listing')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Listing</span>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="mt-4 space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="random">Random</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* Location Search - Zipcode & Distance */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Search by Location</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Zipcode Input */}
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">
                      Zipcode
                    </label>
                    <input
                      type="text"
                      placeholder="Enter zipcode..."
                      value={zipcode}
                      onChange={(e) => setZipcode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                      maxLength={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Distance Slider */}
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">
                      Distance: {distance} mile{distance !== 1 ? 's' : ''}
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
                        Clear
                      </button>
                    </div>
                  )}
                </div>
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
              All
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
                  {category.name}
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
                All {selectedCategoryObj?.name}
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
                  {subcategory.name}
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
              <span className="text-gray-700">Looking to:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setListingType('all')}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    listingType === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-green-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setListingType('sale')}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    listingType === 'sale'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-green-100'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setListingType('rent')}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    listingType === 'rent'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-green-100'
                  }`}
                >
                  Rent
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
          <p className="text-gray-600">
            {listings.length} {listings.length === 1 ? 'listing' : 'listings'} found
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No listings found</p>
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