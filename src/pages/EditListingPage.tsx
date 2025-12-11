import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, X, Upload } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import SearchableSelect from '../components/SearchableSelect';

interface EditListingPageProps {
  user: any;
}

export default function EditListingPage({ user }: EditListingPageProps) {
  const { id: listingId } = useParams();
  const navigate = useNavigate();
  
  console.log('=== EditListingPage RENDERED ===');
  console.log('listingId from URL:', listingId);
  console.log('user:', user);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingListing, setFetchingListing] = useState(true);
  const [error, setError] = useState('');
  
  // Real Estate specific fields
  const [propertyType, setPropertyType] = useState('residential');
  const [listingType, setListingType] = useState('sale');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [parkingSpaces, setParkingSpaces] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');
  
  const selectedCategory = categories.find(c => c.id === categoryId);
  const isRealEstate = selectedCategory?.slug === 'real-estate';
  const isServices = selectedCategory?.slug === 'services';
  const subcategories = selectedCategory?.subcategories || [];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

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
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchListing = async () => {
    setFetchingListing(true);
    setError('');
    console.log('Fetching listing:', listingId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      console.log('Session token:', token ? 'exists' : 'missing');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings/${listingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Listing data:', data);
      
      if (!response.ok) {
        setError(data.error || 'Failed to load listing');
        setFetchingListing(false);
        return;
      }
      
      if (data.listing) {
        const listing = data.listing;
        
        console.log('Listing user_id:', listing.user_id, 'Current user id:', user.id);
        
        // Check if user owns this listing
        if (listing.user_id !== user.id) {
          setError('You do not have permission to edit this listing');
          setFetchingListing(false);
          return;
        }

        // Populate form fields
        setTitle(listing.title || '');
        setDescription(listing.description || '');
        setPrice(listing.price?.toString() || '');
        setCategoryId(listing.category_id || '');
        setSubcategoryId(listing.subcategory_id || '');
        setImages(listing.images || []);
        setZipCode(listing.zip_code || ''); // Load zipcode from listing table

        // If real estate, populate additional fields
        if (listing.real_estate_details) {
          const re = listing.real_estate_details;
          setPropertyType(re.property_type || 'residential');
          setListingType(re.listing_type || 'sale');
          setBedrooms(re.bedrooms?.toString() || '');
          setBathrooms(re.bathrooms?.toString() || '');
          setSquareFeet(re.square_feet?.toString() || '');
          setLotSize(re.lot_size?.toString() || '');
          setYearBuilt(re.year_built?.toString() || '');
          setParkingSpaces(re.parking_spaces?.toString() || '');
          setAddress(re.address || '');
          setCity(re.city || '');
          setState(re.state || '');
          // Override zipcode with real estate zipcode if available
          if (re.zip_code) {
            setZipCode(re.zip_code);
          }
          setAmenities(re.amenities || []);
        }
        
        console.log('Listing loaded successfully');
      } else {
        setError('Listing not found');
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error);
      setError('Failed to load listing');
    } finally {
      setFetchingListing(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      for (let i = 0; i < files.length && images.length + i < 10; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/upload-image`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          }
        );

        const data = await response.json();
        
        console.log('Upload response:', data);
        
        if (response.ok && data.url) {
          setImages(prev => [...prev, data.url]);
        } else {
          setError(data.error || 'Failed to upload image');
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !amenities.includes(amenityInput.trim())) {
      setAmenities([...amenities, amenityInput.trim()]);
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (description.length > 500) {
      setError('Description must be 500 characters or less');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const listingData: any = {
        title,
        description,
        price: parseFloat(price),
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        images,
        zip_code: zipCode || null
      };

      // If real estate, include additional fields
      if (isRealEstate) {
        listingData.property_type = propertyType;
        listingData.listing_type = listingType;
        listingData.bedrooms = bedrooms ? parseInt(bedrooms) : null;
        listingData.bathrooms = bathrooms ? parseFloat(bathrooms) : null;
        listingData.square_feet = squareFeet ? parseInt(squareFeet) : null;
        listingData.lot_size = lotSize ? parseFloat(lotSize) : null;
        listingData.year_built = yearBuilt ? parseInt(yearBuilt) : null;
        listingData.parking_spaces = parkingSpaces ? parseInt(parkingSpaces) : null;
        listingData.address = address;
        listingData.city = city;
        listingData.state = state;
        listingData.amenities = amenities;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings/${listingId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(listingData)
        }
      );

      if (response.ok) {
        navigate('/my-listings');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update listing');
      }
    } catch (error) {
      console.error('Failed to update listing:', error);
      setError('Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingListing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/my-listings" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to My Listings</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="mb-8">Edit Listing</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Category */}
          <div>
            <label className="block text-gray-700 mb-2">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubcategoryId('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory - searchable for Services, regular dropdown for others */}
          {subcategories.length > 0 && (
            <div>
              <label className="block text-gray-700 mb-2">
                Subcategory {!isServices && '*'}
              </label>
              {isServices ? (
                <SearchableSelect
                  options={subcategories.map((sub: any) => ({
                    value: sub.id,
                    label: sub.name
                  }))}
                  value={subcategoryId}
                  onChange={setSubcategoryId}
                  placeholder="Search or select a service..."
                />
              ) : (
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required={!isServices}
                >
                  <option value="">Select a subcategory</option>
                  {subcategories.map((subcategory: any) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Real Estate Type Selection */}
          {isRealEstate && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Property Type *</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="land">Land</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Listing Type *</label>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                >
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-gray-700 mb-2">
              Price * {isRealEstate && listingType === 'rent' && '(per month)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required
            />
          </div>

          {/* Real Estate Details */}
          {isRealEstate && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Bedrooms</label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Bathrooms</label>
                  <input
                    type="number"
                    step="0.5"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Square Feet</label>
                  <input
                    type="number"
                    value={squareFeet}
                    onChange={(e) => setSquareFeet(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Lot Size (acres)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Year Built</label>
                  <input
                    type="number"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Parking Spaces</label>
                  <input
                    type="number"
                    value={parkingSpaces}
                    onChange={(e) => setParkingSpaces(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Zip Code</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Amenities</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                    placeholder="Add amenity..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddAmenity}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(amenity)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label className="block text-gray-700 mb-2">
              Description * ({description.length}/500)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Zip Code for non-real-estate listings */}
          {!isRealEstate && (
            <div>
              <label className="block text-gray-700 mb-2">Zip Code *</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                maxLength={5}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="Enter 5-digit zip code"
              />
              <p className="text-sm text-gray-500 mt-1">This helps buyers find your listing by location</p>
            </div>
          )}

          {/* Images */}
          <div>
            <label className="block text-gray-700 mb-2">
              Images ({images.length}/10)
            </label>
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploadingImage || images.length >= 10}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition ${
                    uploadingImage || images.length >= 10
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                      : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-600">
                    {uploadingImage ? 'Uploading...' : 'Upload Images'}
                  </span>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.slice(0, 4).map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Upload ${index + 1}`}
                        className="h-32 object-contain bg-gray-100 rounded-lg mx-auto"
                      />
                      {index === 3 && images.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center pointer-events-none">
                          <span className="text-white text-2xl font-bold">
                            +{images.length - 4}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Show skeleton loaders while uploading */}
              {uploadingImage && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[...Array(Math.min(4, 10 - images.length))].map((_, index) => (
                    <div 
                      key={`skeleton-${index}`} 
                      className="relative h-32 bg-gray-200 rounded-lg overflow-hidden animate-pulse"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Listing'}
            </button>
            <Link
              to="/my-listings"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}