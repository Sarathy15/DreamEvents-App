import React, { useState, useEffect } from 'react';
import { X, Download, MapPin, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventDetails: {
    bookingId: string;
    eventId: string;
    name: string;
    location: string;
    locationLink?: string;
    timing: string;
    date: string;
    specialInstructions?: string;
    contactInfo?: string;
  };
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  eventDetails
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const apiKey = import.meta.env.VITE_QRCODE_API_KEY;

  const generateQRCode = async () => {
    try {
      setLoading(true);
      console.log('Starting QR code generation with API key:', apiKey);
      
      // Create detailed event data with app link
      const appBaseUrl = 'dreamevents://ticket'; // For mobile app
      const webAppBaseUrl = 'https://dreamevents.com/ticket'; // For web app
      
      const eventData = {
        type: 'event_ticket',
        version: '1.0',
        bookingId: eventDetails.bookingId,
        eventId: eventDetails.eventId,
        details: {
          event: eventDetails.name,
          location: {
            address: eventDetails.location,
            mapUrl: eventDetails.locationLink || `https://maps.google.com/?q=${encodeURIComponent(eventDetails.location)}`
          },
          schedule: {
            date: eventDetails.date,
            time: eventDetails.timing
          },
          instructions: eventDetails.specialInstructions,
          contact: eventDetails.contactInfo
        },
        timestamp: new Date().toISOString(),
        viewUrls: {
          app: `${appBaseUrl}/${eventDetails.bookingId}`,
          web: `${webAppBaseUrl}/${eventDetails.bookingId}`
        }
      };

      // Convert to JSON and encode for URL
      const jsonData = JSON.stringify(eventData);
      const encodedData = encodeURIComponent(jsonData);
      
      // Call QR code API with specific options for better readability
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodedData}&size=400x400&format=png&qzone=2&margin=10&ecc=H&apikey=${apiKey}`;
      
      console.log('QR Code data:', eventData);
      console.log('Calling QR API URL:', qrApiUrl);

      const response = await fetch(qrApiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('QR API Error:', errorText);
        throw new Error(`Failed to generate QR code: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setQrCodeUrl(url);
      console.log('QR code generated successfully');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${eventDetails.name.replace(/\s+/g, '-')}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code downloaded successfully!');
  };

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
    return () => {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Event QR Code</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Event Details */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-2">
            <p><strong>Event:</strong> {eventDetails.name}</p>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-1">
                <MapPin className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p><strong>Location:</strong> {eventDetails.location}</p>
                <a
                  href={eventDetails.locationLink || `https://maps.google.com/?q=${encodeURIComponent(eventDetails.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View on Map
                </a>
              </div>
            </div>
            <p><strong>Date:</strong> {eventDetails.date}</p>
            <p><strong>Time:</strong> {eventDetails.timing}</p>
            {eventDetails.specialInstructions && (
              <p><strong>Instructions:</strong> {eventDetails.specialInstructions}</p>
            )}
            {eventDetails.contactInfo && (
              <p><strong>Contact:</strong> {eventDetails.contactInfo}</p>
            )}
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center space-y-4">
            {loading ? (
              <div className="w-64 h-64 flex items-center justify-center border border-gray-200 rounded-lg">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : qrCodeUrl ? (
              <>
                <div className="border border-gray-200 rounded-lg p-4">
                  <img src={qrCodeUrl} alt="Event QR Code" className="w-64 h-64" />
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download QR Code</span>
                </button>
              </>
            ) : (
              <div className="text-center text-gray-500">
                Failed to generate QR code. Please try again.
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 text-center">
            Scan this QR code to quickly access all event details and location.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;