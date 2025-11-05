import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Mail, Lock, User, Building, Eye, EyeOff } from 'lucide-react';

type PasswordCriteria = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
};

const PasswordStrength: React.FC<{ passwordCriteria: PasswordCriteria }> = ({ passwordCriteria }) => {
  const score = Object.values(passwordCriteria).filter(Boolean).length;
  let label = 'Weak';
  let color = 'bg-red-400';
  if (score >= 4) {
    label = 'Strong';
    color = 'bg-green-500';
  } else if (score >= 2) {
    label = 'Medium';
    color = 'bg-yellow-400';
  }

  const guidance = (() => {
    // Prioritized single hint: length -> upper -> lower -> number -> special
    if (!passwordCriteria.length) return 'Make it at least 8 characters.';
    if (!passwordCriteria.upper) return 'Add an uppercase letter (A-Z).';
    if (!passwordCriteria.lower) return 'Add a lowercase letter (a-z).';
    if (!passwordCriteria.number) return 'Include at least one number (0-9).';
    if (!passwordCriteria.special) return 'Include a special character (e.g. !@#$%).';
    return 'Strong password. Good to go!';
  })();

  return (
    <div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
        <div className={`${color} h-2`} style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="font-medium">Password strength: {label}</span>
        <span className="ml-4">{guidance}</span>
      </div>
    </div>
  );
};

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') || 'customer';
  
  const [userType, setUserType] = useState<'customer' | 'vendor'>(defaultType as 'customer' | 'vendor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });
  const [pwFocused, setPwFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const { registerCustomer, registerVendor, loginWithGoogle, user, userData } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Enforce strong password rules on client side
    const allValid = Object.values(passwordCriteria).every(Boolean);
    if (!allValid) {
      alert('Please use a stronger password. Follow the password requirements below.');
      return;
    }

    setLoading(true);

    try {
      if (userType === 'customer') {
        await registerCustomer(email, password, name);
      } else {
        await registerVendor(email, password, name, businessName);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }

    setLoading(false);
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(userType);
    } catch (error) {
      console.error('Google registration error:', error);
    }
    setGoogleLoading(false);
  };

  const validatePassword = (pw: string) => {
    const criteria = {
      length: pw.length >= 8,
      upper: /[A-Z]/.test(pw),
      lower: /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
    };
    setPasswordCriteria(criteria);
    return criteria;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pw = e.target.value;
    setPassword(pw);
    validatePassword(pw);
  };

  // Auto-redirect based on user role after successful registration
  React.useEffect(() => {
    if (user && userData) {
      if (userData.role === 'customer') {
        navigate('/customer-dashboard');
      } else if (userData.role === 'vendor') {
        navigate('/vendor-dashboard');
      }
    }
  }, [user, userData, navigate]);
  const isPasswordStrong = Object.values(passwordCriteria).filter(Boolean).length >= 4;
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
            <Calendar className="h-10 w-10 text-blue-600" />
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DreamEvents
            </span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-gray-600">Join DreamEvents today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* User Type Selection */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setUserType('customer')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  userType === 'customer'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <User className="h-5 w-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Customer</div>
              </button>
              <button
                type="button"
                onClick={() => setUserType('vendor')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  userType === 'vendor'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Building className="h-5 w-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Vendor</div>
              </button>
            </div>

            {/* (moved) password strength UI shown inline under the password field when focused or typing */}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {userType === 'vendor' && (
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your business name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {/* Show concise strength meter only when user focuses or has typed something */}
              {(pwFocused || password.length > 0) && (
                <div className="mt-2 mb-4 text-sm">
                  <PasswordStrength passwordCriteria={passwordCriteria} />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-red-500 mb-2">Passwords do not match</p>
            )}

            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordStrong}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? 'Creating account...' : `Create ${userType} account`}
            </button>
          </form>

          {/* Google Sign Up */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign up with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={googleLoading}
              className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Creating account...' : `Sign up with Google as ${userType}`}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;