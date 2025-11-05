import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Grid3X3, Map } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import ServiceMap from '../components/ServiceMap';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Service {
  id: string;
  title: string;
  vendor: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  location: string;
  category: string;
  availability: string;
  description: string;
  features: string[];
  locationData?: {
    lat: number;
    lng: number;
    address: string;
  };
}

const Services: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const categories = [
    'All Categories',
    'Catering',
    'Photography', 
    'Decoration',
    'Music',
    'Venue',
    'Planning',
    'Transportation'
  ];

  const priceRanges = [
    'Any Price',
    '₹0 - ₹40,000',
    '₹40,000 - ₹80,000', 
    '₹80,000 - ₹2,00,000',
    '₹2,00,000 - ₹4,00,000',
    '₹4,00,000+'
  ];

  // Load services from Firebase
  useEffect(() => {
    const q = query(
      collection(db, 'services')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData: Service[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only include active services
        if (data.status === 'active') {
          // Parse location data if it exists (required for map view)
          let locationData;
          if (data.locationData) {
            locationData = {
              lat: parseFloat(data.locationData.lat),
              lng: parseFloat(data.locationData.lng),
              address: data.locationData.address || data.location || ''
            };
          }

          servicesData.push({
            id: doc.id,
            title: data.title,
            vendor: data.vendorName || 'Unknown Vendor',
            price: data.price,
            rating: data.rating || 4.5,
            reviews: data.reviews || Math.floor(Math.random() * 50) + 10,
            image: data.images?.[0] || 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800',
            location: data.location || 'Location not specified',
            category: data.category,
            availability: data.availability || 'Available',
            description: data.description || 'No description available',
            features: data.features || [],
            locationData // Add parsed location data for map view
          });
        }
      });
      
      // Sort by createdAt on client side if available
      servicesData.sort((a, b) => {
        const aData = (a as any).createdAt;
        const bData = (b as any).createdAt;
        if (!aData || !bData) return 0;
        const aTime = aData.toMillis?.() || 0;
        const bTime = bData.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      setServices(servicesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter services based on search criteria
  useEffect(() => {
    let filtered = [...services];

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'All Categories') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Price range filter
    if (priceRange && priceRange !== 'Any Price') {
      const [min, max] = priceRange.replace(/₹|,/g, '').split(' - ').map(Number);
      filtered = filtered.filter(service => {
        if (max) {
          return service.price >= min && service.price <= max;
        } else {
          return service.price >= min;
        }
      });
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(service =>
        service.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Rating filter
    if (ratingFilter) {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter(service => service.rating >= minRating);
    }

    setFilteredServices(filtered);
  }, [services, searchQuery, selectedCategory, priceRange, locationFilter, ratingFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange('');
    setLocationFilter('');
    setRatingFilter('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Browse <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Services</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover amazing vendors and services for your perfect event
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {/* Main Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for services, vendors, or locations..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
                className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {viewMode === 'grid' ? <Map className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}
                <span>{viewMode === 'grid' ? 'Map View' : 'Grid View'}</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category === 'All Categories' ? '' : category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priceRanges.map((range) => (
                  <option key={range} value={range === 'Any Price' ? '' : range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Enter location"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredServices.length} Services Found
            </h2>
            {(selectedCategory || searchQuery) && (
              <p className="text-gray-600 mt-1">
                {searchQuery && `Searching for "${searchQuery}"`}
                {searchQuery && selectedCategory && ' in '}
                {selectedCategory && `${selectedCategory} category`}
              </p>
            )}
          </div>
        </div>

        {/* Services Display */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading services...</span>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No services found matching your criteria</div>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters to see all services
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} {...service} />
            ))}
          </div>
        ) : (
          <ServiceMap 
            services={filteredServices.filter(s => s.locationData?.lat && s.locationData?.lng)}
            height="600px"
            className="shadow-lg rounded-2xl overflow-hidden"
          />
        )}
      </div>
    </div>
  );
};

export default Services;