import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import SearchableSelect from '../components/SearchableSelect';
import { processImage, formatBytes, getSizeReduction } from '../utils/imageProcessing';
import { useTranslation, nameToSlug } from '../translations';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface CreateListingPageProps {
  user: any;
}

export default function CreateListingPage({ user }: CreateListingPageProps) {
  const { t } = useTranslation();
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
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    // Remove from old position
    newImages.splice(draggedIndex, 1);
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage);
    
    setImages(newImages);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveImageUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
  };

  const moveImageDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setImages(newImages);
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
        
        // Process image on client side: resize, strip metadata, compress
        console.log(`Original image: ${formatBytes(file.size)}`);
        const processedFile = await processImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.92
        });
        console.log(`Processed image: ${formatBytes(processedFile.size)} (${getSizeReduction(file.size, processedFile.size)} reduction)`);
        
        const formData = new FormData();
        formData.append('file', processedFile);

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

        // Server returns single URL for listing images
        if (data.url) {
          setImages(prev => [...prev, data.url]);
        }
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

    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

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

      // Track create interaction
      if (data.listing && categoryId) {
        const categorySlug = categories.find(c => c.id === categoryId)?.slug;
        if (categorySlug) {
          trackCreate(data.listing.id, categorySlug);
        }
      }

      navigate(`/listing/${data.listing.id}`);
    } catch (err) {
      setError('An error occurred while creating the listing');
      setLoading(false);
    }
  };

  const trackCreate = async (listingId: string, category: string) => {
    if (!user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

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
            interactionType: 'create',
            listingId
          })
        }
      );
    } catch (error) {
      console.error('Failed to track create:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <ArrowLeft className="w-5 h-5" />
            <span>{t.common.back}</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="mb-6">{t.createListing.title}</h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">{t.createListing.listingTitle}</label>
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
                placeholder={t.createListing.titlePlaceholder}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">{t.createListing.category}</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {t.categories[category.slug as keyof typeof t.categories] || category.name}
                  </option>
                ))}
              </select>
            </div>

            {subcategories.length > 0 && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">{t.createListing.subcategory}</label>
                <SearchableSelect
                  options={subcategories}
                  value={subcategoryId}
                  onChange={setSubcategoryId}
                  placeholder={t.createListing.selectSubcategory}
                  getDisplayName={(option) => t.categories[option.slug as keyof typeof t.categories] || option.name}
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">{t.createListing.price} (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t.createListing.pricePlaceholder}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                {t.createListing.description} ({description.length}/500 characters)
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
                placeholder={t.createListing.descriptionPlaceholder}
              />
            </div>

            {!isRealEstate && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">{t.createListing.zipcode}</label>
                <input
                  type="text"
                  value={listingZipCode}
                  onChange={(e) => setListingZipCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                  required
                  maxLength={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t.createListing.zipcodePlaceholder}
                />
                <p className="text-sm text-gray-500 mt-1">This helps buyers find your listing by location</p>
              </div>
            )}

            {isRealEstate && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">{t.createListing.listingType}</label>
                  <select
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t.createListing.selectCondition}</option>
                    <option value="sale">{t.createListing.sale}</option>
                    <option value="rent">{t.createListing.rent}</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">{t.createListing.zipcode}</label>
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
              <label className="block text-gray-700 mb-2">
                Images (up to 10) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploadingImage || images.length >= 10}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 ${
                  error && images.length === 0
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {uploadingImage && (
                <p className="text-blue-600 mt-2">Uploading images...</p>
              )}
              {error && images.length === 0 && (
                <p className="text-red-500 text-sm mt-1">At least one image is required</p>
              )}

              {(images.length > 0 || uploadingImage) && (
                <>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {/* Show all uploaded images */}
                    {images.slice(0, 4).map((img, index) => (
                      <div 
                        key={index} 
                        onClick={() => {
                          setSelectedImageIndex(index);
                          setShowReorderModal(true);
                        }}
                        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer transition-all hover:opacity-80"
                      >
                        <img 
                          src={img} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-full object-contain pointer-events-none" 
                        />
                        {/* Show overlay on 4th image if there are more images */}
                        {index === 3 && images.length > 4 && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/50">
                            <p className="text-gray-900 text-lg font-medium">+{images.length - 4}</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 z-10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Show skeleton loaders while uploading */}
                    {uploadingImage && (
                      <>
                        {[...Array(Math.min(4 - images.length, 10 - images.length))].map((_, index) => (
                          <div 
                            key={`skeleton-${index}`} 
                            className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden animate-pulse"
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Reorder Button */}
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowReorderModal(true)}
                      className="mt-3 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ChevronUp className="w-4 h-4" />
                      <ChevronDown className="w-4 h-4" />
                      <span>Reorder Images</span>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                Your listing will be active for 7 days. After that, it will be archived and you can renew it from your listings page.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t.createListing.creating : t.createListing.submit}
            </button>
          </form>
        </div>
      </main>

      {/* Reorder Modal */}
      {showReorderModal && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                {selectedImageIndex + 1}
              </div>
              <span className="text-gray-700 text-sm">
                {selectedImageIndex === 0 ? 'Main Image' : `Image ${selectedImageIndex + 1} of ${images.length}`}
              </span>
            </div>
            <button
              onClick={() => setShowReorderModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Image Viewer */}
          <div className="flex-1 overflow-auto relative flex items-center justify-center p-4 bg-gray-50">
            <ImageWithFallback
              src={images[selectedImageIndex]}
              alt={`Image ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Thumbnail Navigation & Actions */}
          <div className="p-4 border-t border-gray-200 bg-white">
            {/* Action Buttons */}
            <div className="flex gap-2 justify-center mb-4">
              {selectedImageIndex !== 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const newImages = [...images];
                    const [movedImage] = newImages.splice(selectedImageIndex, 1);
                    newImages.unshift(movedImage);
                    setImages(newImages);
                    setSelectedImageIndex(0);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  <span>Make First</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  handleRemoveImage(selectedImageIndex);
                  if (selectedImageIndex >= images.length - 1) {
                    setSelectedImageIndex(Math.max(0, images.length - 2));
                  }
                  if (images.length === 1) {
                    setShowReorderModal(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                {images.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden relative ${
                      selectedImageIndex === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}