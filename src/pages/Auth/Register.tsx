import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const navigate = useNavigate();
  const { register } = useAuth();

  // Password validation function
  const validatePassword = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    });
  };

  // Update password validation on change
  useEffect(() => {
    validatePassword(password);
  }, [password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const isPasswordStrong = Object.values(passwordStrength).every(Boolean);
    if (!isPasswordStrong) {
      setError('Password does not meet all requirements');
      return;
    }

    try {
      setLoading(true);
      await register(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to create an account.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordStrength = () => (
    <div className="mt-2 space-y-1 text-sm">
      <p className={`${passwordStrength.length ? 'text-green-600' : 'text-gray-500'}`}>
        ✓ At least 8 characters
      </p>
      <p className={`${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
        ✓ At least one uppercase letter
      </p>
      <p className={`${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
        ✓ At least one lowercase letter
      </p>
      <p className={`${passwordStrength.number ? 'text-green-600' : 'text-gray-500'}`}>
        ✓ At least one number
      </p>
      <p className={`${passwordStrength.special ? 'text-green-600' : 'text-gray-500'}`}>
        ✓ At least one special character (!@#$%^&*)
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg w-full h-screen flex">
        {/* Left side - Registration Form */}
        <div className="w-1/2 p-10">
          <h2 className="text-sm text-gray-500 mb-2">CourseTrack</h2>
          <h1 className="text-2xl font-bold mb-1">Get started</h1>
          <p className="text-sm text-gray-500 mb-6">Create a new account</p>

          <form onSubmit={handleRegister}>
            {error && (
              <div className="mb-4 text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="user@example.com"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 rounded-md pr-10 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {renderPasswordStrength()}
            </div>

            <div className="mb-6">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 rounded-md pr-10 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
              disabled={loading}
            >
              Sign Up
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            Have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in now
            </Link>
          </div>
        </div>

        {/* Right side - Image/Illustration */}
        <div className="w-full bg-gray-200 rounded-r-lg flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            {/* X pattern from the design */}
            <div className="relative w-full h-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-gray-300 rotate-45 transform origin-center"></div>
                <div className="w-full h-0.5 bg-gray-300 -rotate-45 transform origin-center"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}