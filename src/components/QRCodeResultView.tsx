import React from 'react';
import { Calendar, Clock, MapPin, Phone, Info, Award } from 'lucide-react';

interface QRCodeResultViewProps {
  eventData: {
    type: 'event_ticket';
    version: string;
    bookingId: string;
    eventId: string;
    details: {
      event: string;
      location: {
        address: string;
        mapUrl: string;
      };
      schedule: {
        date: string;
        time: string;
      };
      instructions?: string;
      contact?: string;
    };
    timestamp: string;
  };
}

const QRCodeResultView: React.FC<QRCodeResultViewProps> = ({ eventData }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
      {/* Event Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{eventData.details.event}</h2>
        <div className="flex items-center">
          <Award className="h-5 w-5 mr-2" />
          <span className="text-sm opacity-90">Booking ID: {eventData.bookingId}</span>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6 space-y-6">
        {/* Date and Time */}
        <div className="flex space-x-4">
          <div className="flex-1 flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="text-base font-semibold">{eventData.details.schedule.date}</p>
            </div>
          </div>
          <div className="flex-1 flex items-start space-x-3">
            <Clock className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Time</p>
              <p className="text-base font-semibold">{eventData.details.schedule.time}</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start space-x-3">
          <MapPin className="h-5 w-5 text-blue-600 mt-1" />
          <div>
            <p className="text-sm font-medium text-gray-500">Location</p>
            <p className="text-base font-semibold mb-1">{eventData.details.location.address}</p>
            <a
              href={eventData.details.location.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <span>Open in Maps</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* Contact Information */}
        {eventData.details.contact && (
          <div className="flex items-start space-x-3">
            <Phone className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Contact</p>
              <p className="text-base font-semibold">{eventData.details.contact}</p>
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {eventData.details.instructions && (
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Special Instructions</p>
              <p className="text-base">{eventData.details.instructions}</p>
            </div>
          </div>
        )}

        {/* Verification Badge */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-600">Verified Ticket</span>
            </div>
            <span className="text-xs text-gray-500">
              Generated: {new Date(eventData.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeResultView;