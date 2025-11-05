import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Users, Calendar, ArrowLeft, Heart, Share2, Phone, Mail, Globe, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { BookingModal } from '../components/BookingModal';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  location: string;
  features: string[];
  vendorId: string;
  vendorName: string;
  rating: number;
  reviews: number;
  availability: string;
  locationData?: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface VendorProfile {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  website?: string;
  description?: string;
  yearsOfExperience?: string;
  teamSize?: string;
  specialties?: string[];
}

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const loadService = async () => {
      if (!id) return;

      try {
        const serviceDoc = await getDoc(doc(db, 'services', id));
        if (serviceDoc.exists()) {
          const serviceData = serviceDoc.data();
          const serviceInfo: Service = {
            id: serviceDoc.id,
            title: serviceData.title,
            description: serviceData.description,
            price: serviceData.price,
            category: serviceData.category,
            images: serviceData.images || [],
            location: serviceData.location,
            features: serviceData.features || [],
            vendorId: serviceData.vendorId,
            vendorName: serviceData.vendorName,
            rating: serviceData.rating || 4.5,
            reviews: serviceData.bookings || 0,
            availability: serviceData.availability || 'Available',
            locationData: serviceData.locationData
          };
          setService(serviceInfo);

          // Load vendor profile
          if (serviceData.vendorId) {
            const vendorDoc = await getDoc(doc(db, 'users', serviceData.vendorId));
            if (vendorDoc.exists()) {
              setVendorProfile(vendorDoc.data() as VendorProfile);
            }
          }
        } else {
          toast.error('Service not found');
          navigate('/services');
        }
      } catch (error) {
        console.error('Error loading service:', error);
        toast.error('Failed to load service details');
      }
      setLoading(false);
    };

    loadService();
  }, [id, navigate]);

  const handleBookNow = () => {
    if (!user) {
      toast.error('Please login to book services');
      navigate('/login');
      return;
    }

    if (userData?.role === 'vendor') {
      toast.error('Vendors cannot book services. Switch to customer account.');
      return;
    }

    setShowBookingModal(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service?.title,
          text: `Check out this amazing service: ${service?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading service details...</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h2>
          <button
            onClick={() => navigate('/services')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative">
                <img
                  src={service.images[selectedImageIndex] || service.images[0]}
                  alt={service.title}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={toggleFavorite}
                    className={`p-2 rounded-full ${
                      isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-600'
                    } hover:scale-110 transition-all shadow-lg`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 bg-white text-gray-600 rounded-full hover:scale-110 transition-all shadow-lg"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {service.images.length > 1 && (
                <div className="p-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {service.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${service.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                    {service.category}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.title}</h1>
                  <p className="text-gray-600">by {service.vendorName}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">₹{service.price.toLocaleString('en-IN')}</div>
                  <div className="text-gray-600">per event</div>
                </div>
              </div>

              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(service.rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{service.rating}</span>
                  <span className="text-gray-600">({service.reviews} reviews)</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{service.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{service.availability}</span>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">About This Service</h3>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>

              {service.features.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">What's Included</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vendor Profile */}
            {vendorProfile && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">About the Vendor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{vendorProfile.businessName}</h4>
                    <p className="text-gray-600 mb-4">{vendorProfile.description}</p>
                    
                    {vendorProfile.specialties && vendorProfile.specialties.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Specialties</h5>
                        <div className="flex flex-wrap gap-2">
                          {vendorProfile.specialties.map((specialty, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="space-y-3">
                      {vendorProfile.yearsOfExperience && (
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{vendorProfile.yearsOfExperience} years experience</span>
                        </div>
                      )}
                      {vendorProfile.teamSize && (
                        <div className="flex items-center space-x-3">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Team of {vendorProfile.teamSize}</span>
                        </div>
                      )}
                      {vendorProfile.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{vendorProfile.phone}</span>
                        </div>
                      )}
                      {vendorProfile.email && (
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{vendorProfile.email}</span>
                        </div>
                      )}
                      {vendorProfile.website && (
                        <div className="flex items-center space-x-3">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a
                            href={vendorProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">₹{service.price.toLocaleString('en-IN')}</div>
                <div className="text-gray-600">per event</div>
              </div>

              <button
                onClick={handleBookNow}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 mb-4"
              >
                🎉 Book This Service
              </button>

              <div className="text-center text-sm text-gray-600 mb-6">
                No payment required until vendor confirms
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Response time</span>
                  <span className="font-medium">Within 24 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cancellation</span>
                  <span className="font-medium">48 hours notice</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment</span>
                  <span className="font-medium">After confirmation</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Verified vendor</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Secure booking</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>24/7 support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          service={{
            ...service,
            location: service.locationData
              ? service.locationData
              : { lat: 0, lng: 0, address: service.location }
          }}
        />
      )}
    </div>
  );
};

export default ServiceDetail;