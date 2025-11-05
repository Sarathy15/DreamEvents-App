import React, { useState } from 'react';
import { X, Package, Plus, Trash2, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPackageCreated: () => void;
  editingPackage?: any;
  vendorServices: any[];
}

const PackageModal: React.FC<PackageModalProps> = ({
  isOpen,
  onClose,
  onPackageCreated,
  editingPackage,
  vendorServices
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  interface PackageData {
    name: string;
    description: string;
    services: string[];
    totalPrice: string;
    originalPrice: string;
    validUntil: string;
    maxBookings: string;
    features: string[];
  }

  const [packageData, setPackageData] = useState<PackageData>({
    name: editingPackage?.name || '',
    description: editingPackage?.description || '',
    services: (editingPackage?.services as string[]) || [''],
    totalPrice: editingPackage?.totalPrice || '',
    originalPrice: editingPackage?.originalPrice || '',
    validUntil: editingPackage?.validUntil || '',
    maxBookings: editingPackage?.maxBookings || '',
    features: (editingPackage?.features as string[]) || ['']
  });

  if (!isOpen) return null;

  const handleSavePackage = async () => {
    if (!user || !packageData.name || !packageData.description || packageData.services.filter((s: string) => s.trim()).length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const savings = parseFloat(packageData.originalPrice) - parseFloat(packageData.totalPrice);
      
      const packageInfo = {
        name: packageData.name,
        description: packageData.description,
        services: packageData.services.filter(s => s.trim() !== ''),
        totalPrice: parseFloat(packageData.totalPrice),
        originalPrice: parseFloat(packageData.originalPrice),
        savings: savings > 0 ? savings : 0,
        validUntil: packageData.validUntil,
        maxBookings: parseInt(packageData.maxBookings) || null,
        features: packageData.features.filter(f => f.trim() !== ''),
        vendorId: user.uid,
        status: 'active',
        bookings: 0,
        createdAt: serverTimestamp()
      };

      if (editingPackage) {
        await updateDoc(doc(db, 'packages', editingPackage.id), {
          ...packageInfo,
          updatedAt: serverTimestamp()
        });
        toast.success('Package updated successfully!');
      } else {
        await addDoc(collection(db, 'packages'), packageInfo);
        toast.success('Package created successfully!');
      }

      onPackageCreated();
      onClose();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Failed to save package');
    }
    setLoading(false);
  };

  const addService = () => {
    setPackageData({
      ...packageData,
      services: [...packageData.services, '']
    });
  };

  const removeService = (index: number) => {
    setPackageData({
      ...packageData,
      services: packageData.services.filter((_, i) => i !== index)
    });
  };

  const addFeature = () => {
    setPackageData({
      ...packageData,
      features: [...packageData.features, '']
    });
  };

  const removeFeature = (index: number) => {
    setPackageData({
      ...packageData,
      features: packageData.features.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {editingPackage ? 'Edit Package' : 'Create Service Package'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Name *
              </label>
              <input
                type="text"
                required
                value={packageData.name}
                onChange={(e) => setPackageData({ ...packageData, name: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Complete Wedding Package"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until
              </label>
              <input
                type="date"
                value={packageData.validUntil}
                onChange={(e) => setPackageData({ ...packageData, validUntil: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Description *
            </label>
            <textarea
              required
              rows={3}
              value={packageData.description}
              onChange={(e) => setPackageData({ ...packageData, description: e.target.value })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what's included in this package..."
            />
          </div>

          {/* Services Included */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Services Included *
            </label>
            {packageData.services.map((service, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <select
                  value={service}
                  onChange={(e) => {
                    const newServices = [...packageData.services];
                    newServices[index] = e.target.value;
                    setPackageData({ ...packageData, services: newServices });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a service</option>
                  {vendorServices.map((vendorService) => (
                    <option key={vendorService.id} value={vendorService.title}>
                      {vendorService.title} - ₹{vendorService.price.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                {packageData.services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addService}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Service</span>
            </button>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Price (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={packageData.originalPrice}
                onChange={(e) => setPackageData({ ...packageData, originalPrice: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Price (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={packageData.totalPrice}
                onChange={(e) => setPackageData({ ...packageData, totalPrice: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="85000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Bookings
              </label>
              <input
                type="number"
                min="1"
                value={packageData.maxBookings}
                onChange={(e) => setPackageData({ ...packageData, maxBookings: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
            </div>
          </div>

          {/* Package Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Features
            </label>
            {packageData.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => {
                    const newFeatures = [...packageData.features];
                    newFeatures[index] = e.target.value;
                    setPackageData({ ...packageData, features: newFeatures });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Free consultation, 24/7 support"
                />
                {packageData.features.length > 1 && (
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

          {/* Savings Display */}
          {packageData.originalPrice && packageData.totalPrice && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-green-800 font-medium">Customer Savings:</span>
                <span className="text-green-600 font-bold text-lg">
                  ₹{(parseFloat(packageData.originalPrice) - parseFloat(packageData.totalPrice)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePackage}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : editingPackage ? 'Update Package' : 'Create Package'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageModal;