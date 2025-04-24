import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send a request to your backend
    console.log('Password reset requested for:', email);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-sm text-gray-500 mb-2">CourseTrack</h2>
        <h1 className="text-2xl font-bold mb-1">Reset your password</h1>
        <p className="text-sm text-gray-500 mb-6">
          Type in your email address and we will allow you to reset your password
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="user@example.com"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              Send Reset Link
            </button>
          </form>
        ) : (
          <div className="text-center py-4">
            <p className="mb-4 text-green-600">
              If an account with that email exists, we've sent a password reset link.
            </p>
            <Link
              to="/login"
              className="inline-block bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              Return to Login
            </Link>
          </div>
        )}

        <div className="mt-6 text-center text-sm">
          Have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in now
          </Link>
        </div>
      </div>
    </div>
  );
}