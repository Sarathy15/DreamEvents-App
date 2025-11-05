import React, { useState } from 'react';
import { X, User, Building, Phone, Mail, Camera, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import LocationPicker from './LocationPicker';
import toast from 'react-hot-toast';
import { uploadImage } from '../services/imageKit';

interface VendorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileComplete: () => void;
}

const VendorProfileModal: React.FC<VendorProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileComplete
}) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  interface ProfileData {
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    address: string;
    locationData?: {
      address?: string;
      lat?: number;
      lng?: number;
      placeId?: string;
    };
    description: string;
    website: string;
    socialMedia: {
      facebook: string;
      instagram: string;
      twitter: string;
    };
    businessHours: Record<string, any>;
    profileImage?: string;
    coverImage?: string;
    specialties: string[];
    yearsOfExperience: string;
    teamSize: string;
  }

  const [profileData, setProfileData] = useState<ProfileData>({
    businessName: userData?.businessName || '',
    ownerName: userData?.name || '',
    email: userData?.email || user?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    description: userData?.description || '',
    website: userData?.website || '',
    socialMedia: {
      facebook: userData?.socialMedia?.facebook || '',
      instagram: userData?.socialMedia?.instagram || '',
      twitter: userData?.socialMedia?.twitter || ''
    },
    businessHours: userData?.businessHours || {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true }
    },
    profileImage: userData?.profileImage || '',
    coverImage: userData?.coverImage || '',
    specialties: userData?.specialties || [''],
    yearsOfExperience: userData?.yearsOfExperience || '',
    teamSize: userData?.teamSize || ''
  });

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!profileData.businessName || !profileData.phone || !profileData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...profileData,
        profileCompleted: true,
        updatedAt: serverTimestamp()
      });

      toast.success('Profile saved successfully!');
      onProfileComplete();
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
    setLoading(false);
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) return;

    setLoading(true);
    try {
      const url = await uploadImage(file);
      setProfileData({ ...profileData, profileImage: url });
      toast.success('Profile image uploaded');
    } catch (err) {
      console.error('Upload failed', err);
      toast.error('Failed to upload image');
    }
    setLoading(false);
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) return;

    setLoading(true);
    try {
      const url = await uploadImage(file);
      setProfileData({ ...profileData, coverImage: url });
      toast.success('Cover image uploaded');
    } catch (err) {
      console.error('Upload failed', err);
      toast.error('Failed to upload image');
    }
    setLoading(false);
  };

  const addSpecialty = () => {
    setProfileData({
      ...profileData,
      specialties: [...profileData.specialties, '']
    });
  };

  const removeSpecialty = (index: number) => {
    setProfileData({
      ...profileData,
      specialties: profileData.specialties.filter((_, i) => i !== index)
    });
  };

  const updateSpecialty = (index: number, value: string) => {
    const newSpecialties = [...profileData.specialties];
    newSpecialties[index] = value;
    setProfileData({
      ...profileData,
      specialties: newSpecialties
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Vendor Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Cover and profile image upload */}
          <div className="relative w-full">
            <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {profileData.coverImage ? (
                <img src={profileData.coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400">Cover image (optional)</div>
              )}
            </div>

            <div className="absolute left-6 -bottom-8 flex items-center space-x-4">
              <div className="w-28 h-28 rounded-full bg-white overflow-hidden shadow-md border-2 border-white">
                {profileData.profileImage ? (
                  <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Avatar</div>
                )}
              </div>

              <div className="flex space-x-2">
                <label className="inline-flex items-center px-3 py-2 bg-white border rounded-md shadow-sm text-sm cursor-pointer">
                  <Camera className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-xs text-gray-700">Upload Profile</span>
                  <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                </label>
                <label className="inline-flex items-center px-3 py-2 bg-white border rounded-md shadow-sm text-sm cursor-pointer">
                  <Camera className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-xs text-gray-700">Upload Cover</span>
                  <input type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
                </label>
              </div>
            </div>

            <div style={{ height: 48 }} />
          </div>
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={profileData.businessName}
                    onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your business name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={profileData.ownerName}
                    onChange={(e) => setProfileData({ ...profileData, ownerName: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Address */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Address</h3>
            <LocationPicker
              placeholder="Enter your business address"
              value={profileData.address}
              onLocationSelect={(location) => {
                setProfileData({
                  ...profileData,
                  address: location.address,
                  locationData: {
                    address: location.address,
                    lat: location.lat,
                    lng: location.lng,
                    placeId: location.placeId
                  }
                });
              }}
            />
          </div>

          {/* Business Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About Your Business</h3>
            <textarea
              value={profileData.description}
              onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell customers about your business, services, and what makes you special..."
            />
          </div>

          {/* Specialties */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Specialties</h3>
            {profileData.specialties.map((specialty, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => updateSpecialty(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Wedding Photography, Corporate Events"
                />
                {profileData.specialties.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpecialty(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addSpecialty}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add Specialty
            </button>
          </div>

          {/* Business Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={profileData.yearsOfExperience}
                  onChange={(e) => setProfileData({ ...profileData, yearsOfExperience: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Size
                </label>
                <input
                  type="number"
                  value={profileData.teamSize}
                  onChange={(e) => setProfileData({ ...profileData, teamSize: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={profileData.website}
                  onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Skip for Now
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Complete Profile'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfileModal;