import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface ServiceCardProps {
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
  onBook?: (service: any) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  title,
  vendor,
  price,
  rating,
  reviews,
  image,
  location,
  category,
  availability,
  onBook
}) => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const handleBookNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    if (!user) {
      toast.error('Please login to book services');
      navigate('/login');
      return;
    }

    // Check if user is a vendor (vendors can't book)
    if (userData?.role === 'vendor') {
      toast.error('Vendors cannot book services. Switch to customer account.');
      return;
    }

    // If onBook prop is provided, use it (for modal)
    if (onBook) {
      onBook({
        id,
        title,
        vendor,
        price,
        image,
        category
      });
      return;
    }

    // Otherwise, create booking directly
    try {
      await addDoc(collection(db, 'bookings'), {
        customerId: user.uid,
        serviceId: id,
        serviceName: title,
        vendorName: vendor,
        price: price,
        status: 'pending',
        bookingDate: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      toast.success('Booking request sent! Check your dashboard for updates.');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking. Please try again.');
    }
  };

  return (
    <Link
      to={`/service/${id}`}
      className="block bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-800">
            {category}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
            <span className="text-xs font-semibold text-gray-800">{rating}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h3>
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <div className="text-sm text-gray-600">by</div>
          <div className="text-sm font-semibold text-blue-600">{vendor}</div>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-1 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{location}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{availability}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-semibold">{rating}</span>
          </div>
          <div className="text-sm text-gray-600">({reviews} reviews)</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">
            ₹{price.toLocaleString('en-IN')}
            <span className="text-sm text-gray-600 font-normal">/event</span>
          </div>
          <button
            onClick={handleBookNow}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-1 group shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Calendar className="h-4 w-4" />
            <span className="font-semibold">Book Now</span>
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard;