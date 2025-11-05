import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import toast from 'react-hot-toast';
import React from 'react';

// Error types
const PERMISSION_ERROR = 'permission-denied';
const RETRY_ERRORS = [PERMISSION_ERROR, 'unavailable', 'resource-exhausted'];

// FCM Configuration
const vapidKey = 'BHAWTdeDS5Uwe0T8i3m7pEhH_70r82Rn60SyF5xSvKqlTz59TpN-qIphqabQjf5rVKDleVnI2iQVUt9UH9eCRXM'; // Replace with your VAPID key

// Check if browser supports FCM
const isFCMSupported = async () => {
  try {
    return await isSupported();
  } catch {
    return false;
  }
};

export const requestNotificationPermission = async (userId: string) => {
  try {
    // First check if FCM is supported
    const supported = await isFCMSupported();
    if (!supported) {
      toast.error('Push notifications are not supported in this browser');
      return null;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const messaging = getMessaging();
      const token = await getToken(messaging, { vapidKey });
      
      if (token) {
        // Save FCM token to user document
        await updateDoc(doc(db, 'users', userId), {
          fcmToken: token,
          notificationsEnabled: true,
          updatedAt: serverTimestamp()
        });
        
        toast.success('Notifications enabled successfully!');
        return token;
      }
    } else {
      toast.error('Please enable notifications to receive updates');
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    toast.error('Failed to enable notifications');
  }
  return null;
};

export const onMessageListener = () => {
  const messaging = getMessaging();
  
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show toast notification for foreground messages
      if (payload.notification) {
        const { title, body } = payload.notification;
        // Show notification using dynamic import
        import('../components/NotificationToast').then(module => {
          const NotificationToast = module.default;
          toast.custom((t) => 
            React.createElement(NotificationToast, { 
              t, 
              title: title || '', 
              body: body || '',
            })
          );
        });
      }
      
      resolve(payload);
    });
  });
};

export const sendNotification = async (
  recipientId: string,
  title: string,
  body: string,
  data?: any
) => {
  const retries = 3;
  let lastError: any = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1} to send notification to user:`, recipientId);

      // Get the sender's ID from the auth context
      const senderId = auth.currentUser?.uid;
      if (!senderId) {
        throw new Error('Must be authenticated to send notifications');
      }

      // First try to get the recipient's document
      const userDoc = await getDoc(doc(db, 'users', recipientId));
      
      if (!userDoc.exists()) {
        console.error('Recipient not found:', recipientId);
        throw new Error('Recipient not found');
      }

      const userData = userDoc.data();
      
      // Check if user has notifications enabled
      if (userData.notificationsEnabled === false) {
        console.log('Notifications are disabled for recipient');
        return null;
      }

      const fcmToken = userData.fcmToken;

      // Create notification document with retry
      const notificationRef = await addDoc(collection(db, 'notifications'), {
        recipientId,
        senderId,
        title,
        body,
        data: {
          ...data,
          timestamp: Date.now(),
          senderId,
          notificationType: data?.type || 'general'
        },
        read: false,
        createdAt: serverTimestamp(),
        type: data?.type || 'general',
        priority: data?.priority || 'normal'
      });

      console.log('Notification document created:', notificationRef.id);

      // If we have an FCM token, try to send push notification
      if (fcmToken) {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('DEV MODE: Simulating push notification');
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(title, {
                body,
                icon: '/logo192.png',
                tag: notificationRef.id
              });
            }
            
            // Show toast
            // Dynamic import for NotificationToast
            import('../components/NotificationToast').then(module => {
              const NotificationToast = module.default;
              toast.custom((t) => 
                React.createElement(NotificationToast, {
                  t,
                  title,
                  body,
                  data: { ...data, notificationId: notificationRef.id }
                })
              );
            });
          } else {
            // In production, use the FCM API
            const response = await fetch('/api/send-notification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: fcmToken,
                notification: {
                  title,
                  body,
                },
                data: {
                  ...data,
                  notificationId: notificationRef.id,
                  click_action: 'OPEN_NOTIFICATION'
                }
              }),
            });

            if (!response.ok) {
              throw new Error(`FCM API error: ${response.statusText}`);
            }
          }
        } catch (pushError) {
          console.error('Push notification failed:', pushError);
          // Don't throw - we already saved to Firestore
        }
      }

      // Update the user's notification count
      await updateDoc(doc(db, 'users', recipientId), {
        unreadNotifications: (userData.unreadNotifications || 0) + 1,
        lastNotificationAt: serverTimestamp()
      });

      return notificationRef.id;

    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      // Only retry on certain errors
      if (!RETRY_ERRORS.includes(error.code)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
      };