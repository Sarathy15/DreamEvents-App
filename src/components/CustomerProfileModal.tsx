import React, { useState } from 'react';
import { X, User, Phone, Mail, Camera, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import LocationPicker from './LocationPicker';
import toast from 'react-hot-toast';
import { uploadImage } from '../services/imageKit';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSaved?: () => void;
}

const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({ isOpen, onClose, onProfileSaved }) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState<any>({
    name: userData?.name || '',
    email: userData?.email || user?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    locationData: userData?.locationData || undefined,
    profileImage: userData?.profileImage || '',
    bio: userData?.bio || ''
  });

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!user) return;

    if (!profileData.name) {
      toast.error('Please enter your name');
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
      onProfileSaved?.();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white rounded-full overflow-hidden shadow-sm flex items-center justify-center">
              {profileData.profileImage ? (
                <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400">Avatar</div>
              )}
            </div>
            <div className="flex space-x-2">
              <label className="inline-flex items-center px-3 py-2 bg-white border rounded-md shadow-sm text-sm cursor-pointer">
                <Camera className="h-4 w-4 mr-2 text-gray-600" />
                <span className="text-xs text-gray-700">Upload Profile</span>
                <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your full name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input type="email" value={profileData.email} disabled className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <LocationPicker
              placeholder="Enter your address"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio (optional)</label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              rows={3}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us a bit about yourself..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50">
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfileModal;
