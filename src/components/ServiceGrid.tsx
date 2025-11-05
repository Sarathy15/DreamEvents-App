import React, { useState, useEffect } from 'react';
import ServiceCard from './ServiceCard';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Loader } from 'lucide-react';

const ServiceGrid: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all active services from Firebase
  useEffect(() => {
    const q = query(
      collection(db, 'services'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        servicesData.push({
          id: doc.id,
          title: data.title,
          vendor: data.vendorName || 'Unknown Vendor',
          price: data.price,
          rating: data.rating || 4.5,
          reviews: data.bookings || 0,
          image: data.images?.[0] || 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800',
          location: data.location || 'Location not specified',
          category: data.category,
          availability: data.availability || 'Available',
          createdAt: data.createdAt
        });
      });
      
      // Sort by createdAt on client side
      servicesData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      
      setServices(servicesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Featured Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover top-rated vendors and services for your perfect event. From catering to photography, we have everything you need.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading services...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No services available at the moment</div>
            <p className="text-gray-400">Check back later for new services!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <ServiceCard 
                key={service.id} 
                {...service}
                onBook={user ? undefined : undefined} // Let ServiceCard handle booking logic
              />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            View All Services
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceGrid;