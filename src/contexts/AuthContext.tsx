import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { requestNotificationPermission } from '../services/fcm';
import toast from 'react-hot-toast';

interface UserData {
  uid: string;
  email: string;
  role: 'customer' | 'vendor' | 'admin';
  name: string;
  approved?: boolean;
  emailVerified?: boolean;
  businessName?: string;
  phoneVerified?: boolean;
  notificationsEnabled?: boolean;
  profileCompleted?: boolean;
  profileImage?: string;
  coverImage?: string;
  phone?: string;
  address?: string;
  description?: string;
  website?: string;
  bio?: string;
  locationData?: {
    lat: number;
    lng: number;
    address: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  businessHours?: Record<string, any>;
  specialties?: string[];
  yearsOfExperience?: string;
  teamSize?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  registerCustomer: (email: string, password: string, name: string) => Promise<void>;
  registerVendor: (email: string, password: string, name: string, businessName: string) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (userType: 'customer' | 'vendor') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    // Listen for auth state and then subscribe to realtime user document updates
    let unsubscribeUserDoc: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          const userRef = doc(db, 'users', user.uid);
          unsubscribeUserDoc = onSnapshot(userRef, (snap: any) => {
            if (snap.exists()) {
              setUserData(snap.data() as UserData);
            } else {
              setUserData(null);
            }
            setLoading(false);
          }, (err: any) => {
            console.error('Failed to listen to user doc:', err);
            setLoading(false);
          });
        } catch (e) {
          console.error('Error subscribing to user doc:', e);
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const registerCustomer = async (email: string, password: string, name: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        name,
        role: 'customer',
        phoneVerified: false,
        notificationsEnabled: false,
        createdAt: new Date()
      });
      
      // Request notification permission
      await requestNotificationPermission(user.uid);
      
      toast.success('Customer account created successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const registerVendor = async (email: string, password: string, name: string, businessName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        name,
        businessName,
        role: 'vendor',
        approved: true,
        phoneVerified: false,
        notificationsEnabled: false,
        createdAt: new Date()
      });
      
      // Request notification permission
      await requestNotificationPermission(user.uid);
      
      toast.success('Vendor account created successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const loginUser = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Request notification permission on login
      const currentUser = auth.currentUser;
      if (currentUser) {
        await requestNotificationPermission(currentUser.uid);
      }
      
      toast.success('Logged in successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const loginWithGoogle = async (userType: 'customer' | 'vendor') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'User',
          role: userType,
          approved: true,
          phoneVerified: false,
          emailVerified: user.emailVerified,
          notificationsEnabled: false,
          profileCompleted: userType === 'customer',
          createdAt: serverTimestamp()
        });
      }
      
      // Request notification permission
      await requestNotificationPermission(user.uid);
      
      toast.success(`Signed in with Google successfully!`);
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const value = {
    user,
    userData,
    loading,
    registerCustomer,
    registerVendor,
    loginUser,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};