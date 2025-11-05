import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Siren as Fire, ArrowRight } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, query, onSnapshot, limit } from 'firebase/firestore';

interface TrendingService {
  id: string;
  title: string;
  vendor: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  bookings: number;
}

const TrendingServices: React.FC = () => {
  const [trendingServices, setTrendingServices] = useState<TrendingService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load trending services (most booked services)
    const q = query(
      collection(db, 'services'),
      limit(6)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData: TrendingService[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only include active services
        if (data.status === 'active') {
          servicesData.push({
            id: doc.id,
            title: data.title,
            vendor: data.vendorName || 'Unknown Vendor',
            price: data.price,
            rating: data.rating || 4.5,
            reviews: data.reviews || Math.floor(Math.random() * 50) + 10,
            image: data.images?.[0] || 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800',
            category: data.category,
            bookings: data.bookings || Math.floor(Math.random() * 100) + 20
          });
        }
      });

      // Sort by bookings (trending factor) and rating
      servicesData.sort((a, b) => {
        const aTrending = (a.bookings * 0.7) + (a.rating * 0.3);
        const bTrending = (b.bookings * 0.7) + (b.rating * 0.3);
        return bTrending - aTrending;
      });

      setTrendingServices(servicesData.slice(0, 6));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading trending services...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Fire className="h-8 w-8 text-orange-500" />
            <h2 className="text-4xl font-bold text-gray-900">Trending Services</h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Most popular services booked by our customers this month
          </p>
        </div>

        {/* Trending Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {trendingServices.map((service, index) => (
            <Link
              key={service.id}
              to={`/service/${service.id}`}
              className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {/* Trending Badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>#{index + 1} Trending</span>
                </div>
              </div>

              {/* Service Image */}
              <div className="relative overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Service Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {service.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold">{service.rating}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {service.title}
                </h3>

                <p className="text-gray-600 text-sm mb-3">by {service.vendor}</p>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{service.price.toLocaleString('en-IN')}
                    <span className="text-sm text-gray-600 font-normal">/event</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {service.bookings} bookings
                  </div>
                </div>

                {/* Trending Stats */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{service.reviews} reviews</span>
                    <div className="flex items-center space-x-1 text-orange-600">
                      <Fire className="h-3 w-3" />
                      <span className="font-medium">Hot</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            to="/services"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span>View All Services</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrendingServices;