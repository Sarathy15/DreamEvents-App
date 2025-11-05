import React, { useState } from 'react';
import { X, Calendar, MapPin, User, Phone, Mail, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendNotification } from '../services/fcm';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  title: string;
  price: number;
  vendorId: string;
  vendorName: string;
  category: string;
  description: string;
  images: string[];
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, service }) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    guestCount: '',
    specialRequests: '',
    contactPhone: userData?.phone || '',
    contactEmail: userData?.email || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateIndianPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) {
      toast.error('Please login to book a service');
      return;
    }

    if (!validateIndianPhoneNumber(formData.contactPhone)) {
      toast.error('Please enter a valid Indian phone number');
      return;
    }

    setLoading(true);
    try {
      // Create booking
      const bookingData = {
        serviceId: service.id,
        serviceName: service.title,
        servicePrice: service.price,
        vendorId: service.vendorId,
        vendorName: service.vendorName,
        customerId: user.uid,
        customerName: userData.name,
        customerEmail: userData.email,
        customerPhone: `+91${formData.contactPhone}`,
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        eventLocation: formData.eventLocation,
        guestCount: parseInt(formData.guestCount) || 0,
        specialRequests: formData.specialRequests,
        status: 'pending',
        totalAmount: service.price,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'bookings'), bookingData);

      setLoading(false);
      onClose();
      toast.success('Booking confirmed! Check your bookings tab for details.');

      // Try notification, but don't fail booking if this fails
      if (service.vendorId) {
        sendNotification(
          service.vendorId,
          'New Booking Request',
          `New booking request from ${userData?.name || 'Customer'} for ${service.title}`,
          {
            type: 'booking_request',
            serviceId: service.id,
            customerId: user.uid
          }
        ).catch((err) => {
          console.warn('Notification failed:', err);
          toast('Booking created, but failed to notify vendor.', { icon: '⚠️' });
        });
      }
    } catch (error) {
      setLoading(false);
      console.error('Booking error:', error);
      toast.error('Failed to create booking. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Book Service</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Service Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{service.title}</h3>
                <p className="text-gray-600">by {service.vendorName}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">₹{service.price.toLocaleString('en-IN')}</p>
                <p className="text-sm text-gray-500">Total Amount</p>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Event Date
                </label>
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Time
                </label>
                <input
                  type="time"
                  name="eventTime"
                  value={formData.eventTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Event Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Event Location
              </label>
              <input
                type="text"
                name="eventLocation"
                value={formData.eventLocation}
                onChange={handleInputChange}
                required
                placeholder="Enter event location"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Guest Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Expected Guest Count
              </label>
              <input
                type="number"
                name="guestCount"
                value={formData.guestCount}
                onChange={handleInputChange}
                min="1"
                placeholder="Number of guests"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Contact Phone (Indian Number)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">+91</span>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        setFormData(prev => ({
                          ...prev,
                          contactPhone: value
                        }));
                      }
                    }}
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    placeholder="Enter 10 digit number"
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  required
                  placeholder="Your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                rows={3}
                placeholder="Any special requirements or requests..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Payment Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-800">Payment Information</h4>
              </div>
              <p className="text-sm text-blue-700">
                This is a booking request. Payment will be processed after the vendor confirms your booking.
                You will receive payment instructions via email once confirmed.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending Request...' : 'Send Booking Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};