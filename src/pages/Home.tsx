import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import ServiceGrid from '../components/ServiceGrid';
import TrendingServices from '../components/TrendingServices';
import WhyChooseUs from '../components/WhyChooseUs';
import Testimonials from '../components/Testimonials';
import ServiceMap from '../components/ServiceMap';
import { MapPin, Grid3X3, Loader } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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
  locationData?: {
    lat: number;
    lng: number;
    address: string;
  };
}

const Home: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'services'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData: Service[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Parse location data for map view
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
          locationData: data.locationData
        });
      });
      
      setServices(servicesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <Hero />
      
      {/* Trending Services */}
      <TrendingServices />
      
      {/* View Toggle */}
      <div className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                <span>Grid View</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span>Map View</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? <ServiceGrid /> : (
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Services Near You
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Explore services on the map and find vendors in your area.
              </p>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading services...</span>
              </div>
            ) : (
              <ServiceMap 
                services={services}
                height="400px"
                className="shadow-lg rounded-lg"
              />
            )}
          </div>
        </div>
      )}
      
      <WhyChooseUs />
      <Testimonials />
    </div>
  );
};

export default Home;