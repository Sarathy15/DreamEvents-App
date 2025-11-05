import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface QRCodeData {
  type: 'event_ticket';
  bookingId: string;
  eventId: string;
}

export const handleQRCodeScan = async (qrData: string): Promise<{
  valid: boolean;
  eventDetails?: any;
  error?: string;
}> => {
  try {
    // Parse QR code data
    const data: QRCodeData = JSON.parse(qrData);
    
    // Verify if it's a valid event ticket QR code
    if (data.type !== 'event_ticket' || !data.bookingId) {
      return { valid: false, error: 'Invalid QR code format' };
    }

    // Fetch booking details from Firestore
    const bookingRef = doc(db, 'bookings', data.bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return { valid: false, error: 'Booking not found' };
    }

    const bookingData = bookingSnap.data();

    // Return formatted event details
    return {
      valid: true,
      eventDetails: {
        ...bookingData,
        id: bookingSnap.id,
        scanned: true,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error handling QR code:', error);
    return { valid: false, error: 'Failed to process QR code' };
  }
};