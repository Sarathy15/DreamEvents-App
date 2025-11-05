import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import QRCodeResultView from '../components/QRCodeResultView';
import { Loader } from 'lucide-react';

const TicketLandingPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        if (!bookingId) {
          throw new Error('No booking ID provided');
        }

        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        
        if (!bookingDoc.exists()) {
          throw new Error('Ticket not found');
        }

        const bookingData = bookingDoc.data();
        
        const formattedData = {
          type: 'event_ticket',
          version: '1.0',
          bookingId: bookingDoc.id,
          eventId: bookingData.serviceId,
          details: {
            event: bookingData.serviceName,
            location: {
              address: bookingData.eventLocation,
              mapUrl: `https://maps.google.com/?q=${encodeURIComponent(bookingData.eventLocation)}`
            },
            schedule: {
              date: bookingData.eventDate,
              time: bookingData.eventTime
            },
            instructions: bookingData.specialInstructions,
            contact: bookingData.vendorName
          },
          timestamp: bookingData.createdAt?.toDate().toISOString() || new Date().toISOString()
        };

        setEventData(formattedData);
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket Error</h2>
          <p className="text-gray-600">{error || 'Unable to load ticket details'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <QRCodeResultView eventData={eventData} />
    </div>
  );
};

export default TicketLandingPage;