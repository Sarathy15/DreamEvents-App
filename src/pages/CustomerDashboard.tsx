import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Star, MapPin, Filter, Search, Heart, Baseline as Timeline, Plus, Edit } from 'lucide-react';
import { Loader } from 'lucide-react';
import ServiceSearch from '../components/ServiceSearch';
import { BookingModal } from '../components/BookingModal';
import { useAuth } from '../contexts/AuthContext';
import CustomerProfileModal from '../components/CustomerProfileModal';
import QRCodeModal from '../components/QRCodeModal';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

const CustomerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { user, userData } = useAuth();

  // Real-time stats and bookings
  const [bookings, setBookings] = useState<any[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [reviewsGiven, setReviewsGiven] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const q = query(collection(db, 'bookings'), where('customerId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let bookingsArr: any[] = [];
        let bookingsCount = 0;
        let upcomingCount = 0;
        let spent = 0;
        let reviews = 0;
        const now = new Date();

        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          bookingsArr.push({
            id: docSnap.id,
            ...data
          });
          bookingsCount++;
          if (data.status === 'completed' && data.reviewGiven) reviews++;
          if (data.status === 'confirmed' && data.eventDate) {
            const eventDate = new Date(data.eventDate);
            if (!isNaN(eventDate.getTime()) && eventDate >= now) upcomingCount++;
          }
          if (typeof data.price === 'number') spent += data.price;
        });

        setBookings(bookingsArr);
        setTotalBookings(bookingsCount);
        setUpcomingEvents(upcomingCount);
        setTotalSpent(spent);
        setReviewsGiven(reviews);
        setLoading(false);
      },
      (err) => {
        setError('You do not have permission to view bookings or there was a network error.');
        setLoading(false);
        console.error('Firestore error:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Real-time available services
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'services'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        servicesData.push({
          id: doc.id,
          title: data.title,
          vendor: data.vendorName || 'Unknown Vendor',
          vendorId: data.vendorId,
          price: data.price,
          rating: data.rating || 4.5,
          reviews: data.bookings || 0,
          image: data.images?.[0] || 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=300',
          category: data.category,
          createdAt: data.createdAt
        });
      });
      servicesData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      setAvailableServices(servicesData);
      setServicesLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Dummy favorites and packages (customize as needed)
  const favorites = [
    {
      id: '1',
      title: 'Elegant Floral Decoration',
      vendor: 'Bloom & Beauty',
      price: 1200,
      image: 'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg?auto=compress&cs=tinysrgb&w=300'
    }
  ];

  const packages = [
    {
      id: '1',
      name: 'Complete Wedding Package',
      services: ['Catering', 'Photography', 'Decoration', 'Music'],
      totalPrice: 8500,
      savings: 1500
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = filterStatus === 'all'
    ? bookings
    : bookings.filter(booking => booking.status === filterStatus);

  const handleBookService = (service: any) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  // BookingModal expects onBook prop for confirming booking
  // Preserved for future implementation and integration
  const handleSearch = (query: string, filters: any) => {
    // This empty implementation is intentional
    // The search functionality is handled by the ServiceSearch component internally
    console.log('Search params:', { query, filters });
  };

  if (!user) {
    return <div className="text-center py-10">Please log in to view your dashboard.</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading your dashboard...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header: show customer profile at top similar to vendor */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white rounded-full overflow-hidden shadow-sm flex items-center justify-center">
                <img
                  src={userData?.profileImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={userData?.name || user?.email || 'Customer'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{userData?.name || user?.email || 'Your Name'}</h1>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    title="Edit profile"
                    className="p-1 rounded-md hover:bg-gray-100"
                  >
                    <Edit className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">{(userData as any)?.bio || userData?.email}</p>
                {userData && !userData.profileCompleted && (
                  <p className="text-xs text-yellow-700 mt-1">Profile incomplete — please complete your profile to get personalized recommendations.</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {!userData?.profileCompleted && (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                >
                  Complete Profile
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Upcoming Events</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingEvents}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalSpent.toLocaleString('en-IN')}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Reviews Given</p>
                  <p className="text-2xl font-bold text-gray-900">{reviewsGiven}</p>
                </div>
                <Star className="h-8 w-8 text-teal-600" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'bookings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Bookings
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'services'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Book Services
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'favorites'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Favorites
                </button>
                <button
                  onClick={() => setActiveTab('packages')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'packages'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Packages
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'timeline'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Event Timeline
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'reviews'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Reviews
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'bookings' && (
                <div>
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search bookings..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Bookings List */}
                  <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <img
                            src={booking.image || 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=300'}
                            alt={booking.serviceName || 'Service'}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{booking.serviceName}</h3>
                            <p className="text-gray-600">by {booking.vendorName}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-1 text-gray-500">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">{booking.eventDate}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-500">
                                <MapPin className="h-4 w-4" />
                                <span className="text-sm">{booking.eventLocation || 'Event Venue'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">₹{booking.servicePrice?.toLocaleString('en-IN') || booking.price?.toLocaleString('en-IN')}</div>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-100">
                          <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                            View Details
                          </button>
                          {booking.status === 'completed' && (
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                              Write Review
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => setShowQRCode(booking.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Show QR Ticket
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'services' && (
                <div>
                  <ServiceSearch 
                    onSearch={(query, filters) => {
                      // Preserve the empty implementation but use the parameters
                      handleSearch(query, filters);
                    }} 
                  />

                  {servicesLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading services...</span>
                    </div>
                  ) : availableServices.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-500 mb-4">No services available</div>
                      <p className="text-gray-400">Check back later for new services!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {availableServices.map((service) => (
                        <div key={service.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                            <p className="text-gray-600 mb-2">by {service.vendor}</p>
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-semibold">{service.rating}</span>
                              </div>
                              <span className="text-sm text-gray-600">({service.reviews} reviews)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-gray-900">₹{service.price.toLocaleString('en-IN')}</span>
                              <button
                                onClick={() => handleBookService(service)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Book Now
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">My Favorites</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((favorite) => (
                      <div key={favorite.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                        <img
                          src={favorite.image}
                          alt={favorite.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{favorite.title}</h3>
                          <p className="text-gray-600 mb-3">by {favorite.vendor}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-gray-900">₹{favorite.price.toLocaleString('en-IN')}</span>
                            <div className="flex space-x-2">
                              <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Heart className="h-4 w-4 fill-current" />
                              </button>
                              <button
                                onClick={() => handleBookService(favorite)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Book
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'packages' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Service Packages</h3>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Create Package</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="border border-gray-200 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                            <div className="flex flex-wrap gap-2">
                              {pkg.services.map((service, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">₹{pkg.totalPrice.toLocaleString('en-IN')}</div>
                            <div className="text-sm text-green-600">Save ₹{pkg.savings.toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Book Package
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            Customize
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Event Timeline Planner</h3>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Create Timeline
                    </button>
                  </div>
                  <div className="bg-gray-50 p-8 rounded-xl text-center">
                    <Timeline className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No timelines created yet</h3>
                    <p className="text-gray-600 mb-4">Create a timeline to organize your event planning process.</p>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Get Started
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-600">Complete your bookings to leave reviews for vendors.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && selectedService && (
          <BookingModal
            isOpen={showBookingModal}
            onClose={() => setShowBookingModal(false)}
            service={selectedService}
          />
        )}

{/* QR Code Modal */}
        {showQRCode && (
          <QRCodeModal
            isOpen={!!showQRCode}
            onClose={() => setShowQRCode(null)}
            eventDetails={{
              bookingId: showQRCode,
              eventId: bookings.find(b => b.id === showQRCode)?.serviceId || '',
              name: bookings.find(b => b.id === showQRCode)?.serviceName || 'Event',
              location: bookings.find(b => b.id === showQRCode)?.eventLocation || 'TBA',
              locationLink: `https://maps.google.com/?q=${encodeURIComponent(bookings.find(b => b.id === showQRCode)?.eventLocation || '')}`,
              date: bookings.find(b => b.id === showQRCode)?.eventDate || 'TBA',
              timing: bookings.find(b => b.id === showQRCode)?.eventTime || 'TBA',
              specialInstructions: bookings.find(b => b.id === showQRCode)?.specialInstructions || '',
              contactInfo: bookings.find(b => b.id === showQRCode)?.vendorName || ''
            }}
          />
        )}

        {/* Customer Profile Modal */}
        {showProfileModal && (
          <CustomerProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            onProfileSaved={() => {
              setShowProfileModal(false);
              toast.success('Profile updated');
            }}
          />
        )}
      </div>
    </>
  );
};

export default CustomerDashboard;