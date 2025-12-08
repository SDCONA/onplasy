import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, ChevronDown, ChevronUp } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import SearchableSelect from '../components/SearchableSelect';

interface CreateListingPageProps {
  user: any;
}

export default function CreateListingPage({ user }: CreateListingPageProps) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Common fields for all listings
  const [listingZipCode, setListingZipCode] = useState('');
  
  // Real Estate specific fields
  const [listingType, setListingType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [parkingSpaces, setParkingSpaces] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');
  const [showExtraFields, setShowExtraFields] = useState(false);
  
  const selectedCategory = categories.find(c => c.id === categoryId);
  const isRealEstate = selectedCategory?.slug === 'real-estate';
  const isServices = selectedCategory?.slug === 'services';
  const subcategories = selectedCategory?.subcategories || [];

  useEffect(() => {
    fetchCategories();
  }, []);

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
        if (data.categories.length > 0) {
          setCategoryId(data.categories[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleAddImage = () => {
    if (imageUrl.trim() && images.length < 10) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
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

        if (!response.ok) {
          setError(data.error || 'Failed to upload image');
          continue;
        }

        setImages(prev => [...prev, data.url]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('An error occurred while uploading images');
    } finally {
      setUploadingImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5dec7914/listings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            description,
            price: parseFloat(price),
            category_id: categoryId,
            subcategory_id: subcategoryId,
            images,
            zip_code: listingZipCode,
            ...(isRealEstate && {
              listing_type: listingType,
              bedrooms: parseInt(bedrooms),
              bathrooms: parseInt(bathrooms),
              square_feet: parseInt(squareFeet),
              lot_size: parseInt(lotSize),
              year_built: parseInt(yearBuilt),
              parking_spaces: parseInt(parkingSpaces),
              address,
              city,
              state,
              amenities
            })
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create listing');
        setLoading(false);
        return;
      }

      navigate(`/listing/${data.listing.id}`);
    } catch (err) {
      setError('An error occurred while creating the listing');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="mb-6">Create New Listing</h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  if (e.target.value.length <= 70) {
                    setTitle(e.target.value);
                  }
                }}
                required
                maxLength={70}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., iPhone 13 Pro Max"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {subcategories.length > 0 && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Subcategory</label>
                <SearchableSelect
                  options={subcategories}
                  value={subcategoryId}
                  onChange={setSubcategoryId}
                  placeholder="Select a subcategory..."
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Price (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Description ({description.length}/500 characters)
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setDescription(e.target.value);
                  }
                }}
                required
                rows={6}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your item..."
              />
            </div>

            {!isRealEstate && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Zip Code</label>
                <input
                  type="text"
                  value={listingZipCode}
                  onChange={(e) => setListingZipCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                  required
                  maxLength={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter 5-digit zip code"
                />
                <p className="text-sm text-gray-500 mt-1">This helps buyers find your listing by location</p>
              </div>
            )}

            {isRealEstate && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Listing Type</label>
                  <select
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Listing Type</option>
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Zip Code</label>
                  <input
                    type="number"
                    value={listingZipCode}
                    onChange={(e) => setListingZipCode(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="00000"
                  />
                </div>

                {/* Collapsible Additional Details */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowExtraFields(!showExtraFields)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <span className="text-gray-700">Additional Property Details (Optional)</span>
                    {showExtraFields ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>

                {showExtraFields && (
                  <>
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Bedrooms</label>
                      <input
                        type="number"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Bathrooms</label>
                      <input
                        type="number"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Square Feet</label>
                      <input
                        type="number"
                        value={squareFeet}
                        onChange={(e) => setSquareFeet(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Lot Size (sq ft)</label>
                      <input
                        type="number"
                        value={lotSize}
                        onChange={(e) => setLotSize(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Year Built</label>
                      <input
                        type="number"
                        value={yearBuilt}
                        onChange={(e) => setYearBuilt(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Parking Spaces</label>
                      <input
                        type="number"
                        value={parkingSpaces}
                        onChange={(e) => setParkingSpaces(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="123 Main St"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="City"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="State"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Amenities</label>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={amenityInput}
                          onChange={(e) => setAmenityInput(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter amenity"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (amenityInput.trim() && !amenities.includes(amenityInput.trim())) {
                              setAmenities([...amenities, amenityInput.trim()]);
                              setAmenityInput('');
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>

                      {amenities.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {amenities.map((amenity, index) => (
                            <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              <p className="w-full h-full object-cover text-center py-2">{amenity}</p>
                              <button
                                type="button"
                                onClick={() => setAmenities(amenities.filter((_, i) => i !== index))}
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Images (up to 10)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploadingImage || images.length >= 10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              {uploadingImage && (
                <p className="text-blue-600 mt-2">Uploading images...</p>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {images.slice(0, 4).map((img, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-contain bg-gray-100" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {images.length > 4 && (
                    <div className="aspect-square bg-transparent rounded-lg flex items-center justify-center">
                      <p className="text-gray-600">+{images.length - 4} more</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                Your listing will be active for 7 days. After that, it will be archived and you can renew it from your listings page.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}