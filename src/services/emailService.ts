// Browser-compatible email service simulation
// In production, this would call a backend API endpoint

class EmailService {
  constructor() {
    // Browser-compatible initialization
    console.log('EmailService initialized for browser environment');
  }

  async sendOTP(email: string, otp: string, type: 'registration' | 'booking' = 'registration'): Promise<boolean> {
    try {
      // Simulate email sending in browser environment
      // In production, this would make an API call to your backend
      
      const subject = type === 'registration' ? 'Verify Your Email - DreamEvents' : 'Booking Verification - DreamEvents';
      
      console.log('📧 Email OTP Simulation:');
      console.log('To:', email);
      console.log('Subject:', subject);
      console.log('OTP Code:', otp);
      console.log('Type:', type);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('OTP Sent', {
          body: `Verification code sent to ${email}`,
          icon: '/favicon.ico'
        });
      }
      
      // In production, replace this with actual API call:
      // const response = await fetch('/api/send-otp', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, otp, type })
      // });
      // return response.ok;
      
      return true;
    } catch (error) {
      console.error('Error simulating email send:', error);
      return false;
    }
  }

  async sendBookingNotification(
    email: string, 
    customerName: string, 
    serviceName: string, 
    eventDate: string,
    type: 'new_booking' | 'confirmed' | 'rejected'
  ): Promise<boolean> {
    try {
      let subject = '';
      let message = '';

      switch (type) {
        case 'new_booking':
          subject = 'New Booking Request - DreamEvents';
          message = `You have a new booking request from ${customerName} for ${serviceName} on ${eventDate}.`;
          break;
        case 'confirmed':
          subject = 'Booking Confirmed - DreamEvents';
          message = `Your booking for ${serviceName} on ${eventDate} has been confirmed!`;
          break;
        case 'rejected':
          subject = 'Booking Update - DreamEvents';
          message = `Unfortunately, your booking request for ${serviceName} on ${eventDate} has been declined.`;
          break;
      }

      console.log('📧 Booking Notification Simulation:');
      console.log('To:', email);
      console.log('Subject:', subject);
      console.log('Message:', message);
      console.log('Customer:', customerName);
      console.log('Service:', serviceName);
      console.log('Date:', eventDate);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(subject.split(' - ')[0], {
          body: message,
          icon: '/favicon.ico'
        });
      }
      
      // In production, replace this with actual API call:
      // const response = await fetch('/api/send-booking-notification', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, customerName, serviceName, eventDate, type })
      // });
      // return response.ok;
      
      return true;
    } catch (error) {
      console.error('Error simulating booking notification:', error);
      return false;
    }
  }

  // Request notification permission on service initialization
  async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
}

export const emailService = new EmailService();

// Request notification permission when service is imported
emailService.requestNotificationPermission();