  import React, { useState, useEffect } from 'react';
import { Plus, Calendar, DollarSign, Star, Users, Check, X, BarChart3, TrendingUp, Edit, Trash2, Save, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, updateDoc, collection, addDoc, deleteDoc, query, where, serverTimestamp, onSnapshot, getDoc } from 'firebase/firestore';
import { uploadImage } from '../services/imageKit';
import { sendNotification } from '../services/fcm';
import { emailService } from '../services/emailService';
import toast from 'react-hot-toast';
import LocationPicker from '../components/LocationPicker';
import VendorProfileModal from '../components/VendorProfileModal';
// OTP verification UI removed (handled via environment or backend).
import PackageModal from '../components/PackageModal';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  availability: string;
  location: string;
  features: string[];
  status: 'active' | 'inactive';
  bookings: number;
  rating: number;
  createdAt: any;
  locationData?: {
    address?: string;
    lat?: number;
    lng?: number;
    placeId?: string;
  };
}

const VendorDashboard: React.FC = () => {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // OTP modals removed
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  interface NewService {
    title: string;
    description: string;
    price: string;
    category: string;
    images: string[];
    availability: string;
    location: string;
    features: string[];
    locationData?: {
      address?: string;
      lat?: number;
      lng?: number;
      placeId?: string;
    };
  }

  const [newService, setNewService] = useState<NewService>({
    title: '',
    description: '',
    price: '',
    category: 'Catering',
    images: [''],
    availability: 'Available',
    location: '',
    features: ['']
  });

  // Load vendor's services from Firebase
  useEffect(() => {
    if (!user) return;

    // Check if profile is completed
    if (userData && !userData.profileCompleted) {
      setShowProfileModal(true);
    }

    const q = query(
      collection(db, 'services'),
      where('vendorId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData: Service[] = [];
      snapshot.forEach((doc) => {
        servicesData.push({
          id: doc.id,
          ...doc.data()
        } as Service);
      });
      setServices(servicesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]);

  // Load vendor packages
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'packages'),
      where('vendorId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const packagesData: any[] = [];
      snapshot.forEach((doc) => {
        packagesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setPackages(packagesData);
    });

    return () => unsubscribe();
  }, [user]);

  // Load booking requests
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('vendorId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData: any[] = [];
      snapshot.forEach((doc) => {
        bookingsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      // Sort by createdAt on client side
      bookingsData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      setBookingRequests(bookingsData);
    });

    return () => unsubscribe();
  }, [user]);
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'bookings'), where('vendorId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let revenue = 0;
      let bookingsCount = 0;
      let ratings: number[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        bookingsCount++;
        if (typeof data.price === 'number' && data.status === 'completed') {
          revenue += data.price;
        }
        if (typeof data.rating === 'number') {
          ratings.push(data.rating);
        }
      });

      setTotalRevenue(revenue);
      setTotalBookings(bookingsCount);
      setAverageRating(ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0);
    });

    return () => unsubscribe();
  }, [user]);

  const categories = ['Catering', 'Photography', 'Decoration', 'Music', 'Venue', 'Planning', 'Transportation'];

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'reject') => {
    const toastId = toast.loading(`${action === 'accept' ? 'Accepting' : 'Rejecting'} booking...`);
    
    try {
      // Pass the toastId to dismiss it later
      toast.dismiss(toastId);
      console.log(`Starting booking ${action} process for booking ID:`, bookingId);
      
      // Step 1: Validate booking exists and vendor has permission
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingDoc = await getDoc(bookingRef);
      
      if (!bookingDoc.exists()) {
        throw new Error('Booking not found');
      }
      
      const booking = bookingDoc.data();
      
      if (booking.vendorId !== user?.uid) {
        throw new Error('Unauthorized to modify this booking');
      }
      
      // Step 2: Update booking status
      const newStatus = action === 'accept' ? 'confirmed' : 'cancelled';
      const updateTime = serverTimestamp();
      
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: updateTime,
        updatedBy: user?.uid,
        actionTimestamp: updateTime
      });
      
      console.log('Booking status updated successfully');
      
      if (!booking) {
        throw new Error('Booking data not found');
      }

      console.log('Retrieved booking data:', {
        serviceName: booking.serviceName,
        customerId: booking.customerId,
        eventDate: booking.eventDate
      });
      
      // Step 3: Get customer details
      const customerDoc = await getDoc(doc(db, 'users', booking.customerId));
      const customer = customerDoc.data();
      
      if (!customer) {
        console.error('Customer data not found for ID:', booking.customerId);
      }
      
      const message = action === 'accept' 
        ? `Your booking for ${booking.serviceName} has been confirmed!`
        : `Your booking for ${booking.serviceName} has been cancelled.`;
      
      // Step 4: Send push notification
      try {
        const notificationId = await sendNotification(
          booking.customerId,
          action === 'accept' ? 'Booking Confirmed' : 'Booking Cancelled',
          message,
          {
            type: action === 'accept' ? 'booking_confirmed' : 'booking_cancelled',
            bookingId,
            serviceId: booking.serviceId,
            eventDate: booking.eventDate,
            serviceName: booking.serviceName,
            priority: 'high'
          }
        );
        console.log('Push notification sent successfully, ID:', notificationId);
      } catch (notifError) {
        console.error('Failed to send push notification:', notifError);
        // Continue execution - don't block on notification failure
      }
      
      // Step 5: Send email notification
      if (customer?.email) {
        try {
          await emailService.sendBookingNotification(
            customer.email,
            customer.name || 'Customer',
            booking.serviceName,
            booking.eventDate,
            action === 'accept' ? 'confirmed' : 'rejected'
          );
          console.log('Email notification sent successfully');
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Continue execution - don't block on email failure
        }
      } else {
        console.log('No email address found for customer');
      }

      toast.success(`Booking ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error in handleBookingAction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update booking status');
      throw error; // Re-throw to allow parent components to handle if needed
    }
  };

  const handleAddService = async () => {
    // NOTE: removed email OTP gating so vendors can add services directly.

    // Validate all required fields
    const validationErrors = [];
    
    if (!newService.title.trim()) {
      validationErrors.push('Service title');
    }
    if (!newService.description.trim()) {
      validationErrors.push('Description');
    }
    if (!newService.price || parseFloat(newService.price) <= 0) {
      validationErrors.push('Valid price');
    }
    if (!newService.location.trim()) {
      validationErrors.push('Service location');
    }
    if (!newService.images[0]) {
      validationErrors.push('At least one image');
    }

    if (validationErrors.length > 0) {
      toast.error(`Please provide: ${validationErrors.join(', ')}`);
      return;
    }

    try {
      const vendorName = userData?.businessName || userData?.name;
      const serviceData = {
        title: newService.title.trim(),
        description: newService.description.trim(),
        price: parseFloat(newService.price),
        category: newService.category,
        location: newService.location.trim(),
        vendorId: user?.uid,
        vendorName,
        features: newService.features.filter(f => f.trim() !== ''),
        images: newService.images.filter(img => img && img.trim() !== ''),
        availability: newService.availability,
        status: 'active' as 'active',
        bookings: 0,
        rating: 0,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'services'), serviceData);
      
      const newServiceWithId = {
        ...serviceData,
        id: docRef.id,
        createdAt: new Date()
      };

      setServices([...services, newServiceWithId]);
      setShowAddServiceModal(false);
      setNewService({
        title: '',
        description: '',
        price: '',
        category: 'Catering',
        images: [''], // Keep one empty image slot for next upload
        availability: 'Available',
        location: '',
        features: [''] // Keep one empty feature slot
      });
      
      // Reset form fields
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => {
        const inputElement = input as HTMLInputElement;
        inputElement.value = '';
      });
      
      toast.success('Service added successfully!');
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    }
  };

  const handleEditPackage = (pkg: any) => {
    // Implementation for editing packages
    console.log('Edit package:', pkg);
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      await deleteDoc(doc(db, 'packages', packageId));
      setPackages(packages.filter(p => p.id !== packageId));
      toast.success('Package deleted successfully!');
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
    }
  };

  // Phone/email OTP handlers removed (OTP flow disabled)

  const handleProfileComplete = () => {
    setShowProfileModal(false);
    toast.success('Profile completed successfully!');
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowAddServiceModal(true);
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    try {
      await updateDoc(doc(db, 'services', editingService.id), {
        ...editingService,
        updatedAt: serverTimestamp()
      });

      setServices(services.map(s => s.id === editingService.id ? editingService : s));
      setEditingService(null);
      setShowAddServiceModal(false);
      toast.success('Service updated successfully!');
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await deleteDoc(doc(db, 'services', serviceId));
      setServices(services.filter(s => s.id !== serviceId));
      toast.success('Service deleted successfully!');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const addFeature = () => {
    if (editingService) {
      setEditingService({
        ...editingService,
        features: [...editingService.features, '']
      });
    } else {
      setNewService({
        ...newService,
        features: [...newService.features, '']
      });
    }
  };

  const removeFeature = (index: number) => {
    if (editingService) {
      setEditingService({
        ...editingService,
        features: editingService.features.filter((_, i) => i !== index)
      });
    } else {
      setNewService({
        ...newService,
        features: newService.features.filter((_, i) => i !== index)
      });
    }
  };

  const addImage = () => {
    if (editingService) {
      setEditingService({
        ...editingService,
        images: [...editingService.images, '']
      });
    } else {
      setNewService({
        ...newService,
        images: [...newService.images, '']
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header: Vendor Profile + Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white rounded-full overflow-hidden shadow-sm flex items-center justify-center">
              <img
                src={userData?.profileImage || userData?.coverImage || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                alt={userData?.businessName || userData?.name || 'Vendor'}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-gray-900">{userData?.businessName || userData?.name || 'Your Business'}</h2>
                <button
                  onClick={() => setShowProfileModal(true)}
                  title="Edit profile"
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600">{userData?.name ? `Owner: ${userData.name}` : user?.email} {loading && <span className="text-xs text-gray-500 ml-2">(loading...)</span>}</p>
              {userData && !userData.profileCompleted && (
                <p className="text-xs text-yellow-700 mt-1">Profile incomplete — please complete your profile to appear in search results.</p>
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
            <button 
              onClick={() => setShowAddServiceModal(true)}
              className="mt-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Service</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
                {/* <p className="text-sm text-green-600">+12% this month</p> */}
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                {/* <p className="text-sm text-blue-600">All approved</p> */}
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                {/* <p className="text-sm text-purple-600">8 this month</p> */}
              </div>
               <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{averageRating ? averageRating.toFixed(1) : 'N/A'}</p>
                {/* <p className="text-sm text-yellow-600">128 reviews</p> */}
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'services'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Services
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                  activeTab === 'bookings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Booking Requests
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  2
                </span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
              {/* Packages Tab */}
              <button
                onClick={() => setActiveTab('packages')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'packages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Service Packages
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button 
                      onClick={() => setShowAddServiceModal(true)}
                      className="p-4 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
                    >
                      <Plus className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <span className="text-blue-600 font-medium">Add Service</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('analytics')}
                      className="p-4 border-2 border-dashed border-green-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors text-center"
                    >
                      <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <span className="text-green-600 font-medium">View Analytics</span>
                    </button>
                    <button className="p-4 border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-colors text-center">
                      <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <span className="text-purple-600 font-medium">Manage Reviews</span>
                    </button>
                    <button className="p-4 border-2 border-dashed border-teal-300 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-colors text-center">
                      <Users className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                      <span className="text-teal-600 font-medium">Update Profile</span>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-800">New booking request from Sarah Johnson</span>
                      <span className="text-gray-500 text-sm ml-auto">2 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-800">Payment received for Michael's wedding</span>
                      <span className="text-gray-500 text-sm ml-auto">1 day ago</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-800">New 5-star review received</span>
                      <span className="text-gray-500 text-sm ml-auto">2 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Services ({services.length})</h3>
                  <button 
                    onClick={() => setShowAddServiceModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Service</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={service.images[0]}
                        alt={service.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 flex-1">{service.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            service.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {service.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-gray-900">₹{service.price.toLocaleString('en-IN')}</span>
                          <span className="text-sm text-gray-600">{service.category}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{service.bookings} bookings</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{service.rating || 'No ratings'}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditService(service)}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-1"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteService(service.id)}
                            className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Booking Requests</h3>
                <div className="space-y-4">
                  {bookingRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{request.serviceName}</h4>
                          <p className="text-gray-600">Request from <span className="font-medium">{request.customerName || 'Customer'}</span></p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">{request.eventDate}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">{request.guests} guests</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm">${request.price}</span>
                        </div>
                      </div>

                      {request.specialRequests && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <p className="text-gray-700 text-sm">{request.specialRequests}</p>
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => handleBookingAction(request.id, 'accept')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Check className="h-4 w-4" />
                            <span>Accept Booking</span>
                          </button>
                          <button
                            onClick={() => handleBookingAction(request.id, 'reject')}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <X className="h-4 w-4" />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analytics</h3>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Monthly Revenue</h4>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">$24,500</div>
                    <div className="text-sm text-green-600">+15% from last month</div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h4>
                      <div className="space-y-3">
                        {services.map((service) => (
                          <div key={service.id} className="flex items-center justify-between">
                            <span className="text-gray-700">{service.title}</span>
                            <span className="font-semibold text-gray-900">{service.bookings} bookings</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Ratings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">5 Stars</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                            <span className="text-sm text-gray-600">85%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">4 Stars</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                            </div>
                            <span className="text-sm text-gray-600">12%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'packages' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Service Packages</h3>
                  <button 
                    onClick={() => setShowPackageModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Package</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{pkg.name}</h4>
                          <p className="text-gray-600 text-sm mb-3">{pkg.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {pkg.services.map((service: any, index: number) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">₹{pkg.totalPrice.toLocaleString('en-IN')}</div>
                          <div className="text-sm text-green-600">Save ₹{pkg.savings.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditPackage(pkg)}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Edit Package
                        </button>
                        <button 
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Service Modal */}
        {showAddServiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddServiceModal(false);
                    setEditingService(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingService ? editingService.title : newService.title}
                      onChange={(e) => {
                        if (editingService) {
                          setEditingService({ ...editingService, title: e.target.value });
                        } else {
                          setNewService({ ...newService, title: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter service title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={editingService ? editingService.category : newService.category}
                      onChange={(e) => {
                        if (editingService) {
                          setEditingService({ ...editingService, category: e.target.value });
                        } else {
                          setNewService({ ...newService, category: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editingService ? editingService.price : newService.price}
                      onChange={(e) => {
                        if (editingService) {
                          setEditingService({ ...editingService, price: parseFloat(e.target.value) });
                        } else {
                          setNewService({ ...newService, price: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Location *
                    </label>
                    <LocationPicker
                      placeholder="Enter service location"
                      value={editingService ? editingService.location : newService.location}
                      onLocationSelect={(location) => {
                        if (editingService) {
                          setEditingService({ 
                            ...editingService, 
                            location: location.address,
                            locationData: {
                              address: location.address,
                              lat: location.lat,
                              lng: location.lng,
                              placeId: location.placeId
                            }
                          });
                        } else {
                          setNewService({ 
                            ...newService, 
                            location: location.address,
                            locationData: {
                              address: location.address,
                              lat: location.lat,
                              lng: location.lng,
                              placeId: location.placeId
                            }
                          });
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={editingService ? editingService.description : newService.description}
                    onChange={(e) => {
                      if (editingService) {
                        setEditingService({ ...editingService, description: e.target.value });
                      } else {
                        setNewService({ ...newService, description: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your service in detail..."
                  />
                </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Images
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {(editingService ? editingService.images : newService.images).map((image, index) => (
                        <div key={index} className="relative group">
                          {image ? (
                            <div className="relative aspect-video rounded-lg overflow-hidden">
                              <img
                                src={image}
                                alt={`Service image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newImages = (editingService ? editingService.images : newService.images).filter((_, i) => i !== index);
                                    if (editingService) {
                                      setEditingService({ ...editingService, images: newImages });
                                    } else {
                                      setNewService({ ...newService, images: newImages });
                                    }
                                  }}
                                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  // Validate file size (max 5MB)
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast.error('Image size should be less than 5MB');
                                    return;
                                  }

                                  // Validate file type
                                  if (!file.type.startsWith('image/')) {
                                    toast.error('Please upload only image files');
                                    return;
                                  }

                                  const toastId = toast.loading('Uploading image...');

                                  try {
                                    const imageUrl = await uploadImage(file);

                                    if (imageUrl) {
                                      const newImages = [...(editingService ? editingService.images : newService.images)];
                                      newImages[index] = imageUrl;
                                      
                                      toast.dismiss(toastId);
                                      toast.success('Image uploaded successfully!');
                                      
                                      if (editingService) {
                                        setEditingService({ ...editingService, images: newImages });
                                      } else {
                                        setNewService({ ...newService, images: newImages });
                                      }

                                      toast.dismiss();
                                      toast.success('Image uploaded successfully!');
                                    }
                                  } catch (error) {
                                    console.error('Error uploading image:', error);
                                    toast.dismiss();
                                    toast.error('Failed to upload image');
                                  }
                                }}
                                className="hidden"
                                id={`image-upload-${index}`}
                              />
                              <label
                                htmlFor={`image-upload-${index}`}
                                className="flex flex-col items-center justify-center cursor-pointer p-4 text-gray-500 hover:text-gray-700"
                              >
                                <Camera className="h-8 w-8 mb-2" />
                                <span className="text-sm">Click to upload image</span>
                              </label>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {(editingService ? editingService.images : newService.images).length < 5 && (
                      <button
                        type="button"
                        onClick={addImage}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Image</span>
                      </button>
                    )}
                  </div>                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Features
                  </label>
                  {(editingService ? editingService.features : newService.features).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = editingService ? [...editingService.features] : [...newService.features];
                          newFeatures[index] = e.target.value;
                          if (editingService) {
                            setEditingService({ ...editingService, features: newFeatures });
                          } else {
                            setNewService({ ...newService, features: newFeatures });
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Feature description"
                      />
                      {(editingService ? editingService.features : newService.features).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Feature</span>
                  </button>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddServiceModal(false);
                      setEditingService(null);
                    }}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingService ? handleUpdateService : handleAddService}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingService ? 'Update Service' : 'Add Service'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Package Modal */}
      {showPackageModal && (
        <PackageModal
          isOpen={showPackageModal}
          onClose={() => setShowPackageModal(false)}
          onPackageCreated={() => {
            setShowPackageModal(false);
            // Refresh packages will happen automatically via onSnapshot
          }}
          vendorServices={services}
        />
      )}
      
      {/* Profile Modal */}
      <VendorProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileComplete={handleProfileComplete}
      />
      
      {/* OTP components removed — verification handled elsewhere or disabled */}
    </div>
  );
};

export default VendorDashboard;