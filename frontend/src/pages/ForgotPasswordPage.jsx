import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/apiServices';
import { toast } from '../utils/toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('ইমেইল ঠিকানা প্রয়োজন।');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      toast.success(response.message || 'পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে!');
      setEmailSent(true);
    } catch (error) {
      const errorMessage = error?.response?.data?.detail || 'পাসওয়ার্ড রিসেট অনুরোধ পাঠাতে সমস্যা হয়েছে।';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">ইমেইল পাঠানো হয়েছে!</h2>
          <p className="text-gray-600 mb-6">
            আমরা <strong>{email}</strong> এ পাসওয়ার্ড রিসেট নির্দেশনা পাঠিয়েছি। 
            আপনার ইমেইল চেক করুন এবং দেওয়া OTP বা লিংক ব্যবহার করে পাসওয়ার্ড রিসেট করুন।
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/reset-password', { state: { email } })}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              পাসওয়ার্ড রিসেট করুন
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              লগইনে ফিরে যান
            </button>
          </div>
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              ইমেইল পাননি? স্প্যাম ফোল্ডার চেক করুন অথবা পুনরায় চেষ্টা করুন।
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">পাসওয়ার্ড ভুলে গেছেন?</h2>
          <p className="text-gray-600">
            চিন্তা করবেন না! আপনার ইমেইল দিন এবং আমরা পাসওয়ার্ড রিসেট নির্দেশনা পাঠাব।
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              ইমেইল ঠিকানা
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="আপনার ইমেইল"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← লগইনে ফিরে যান
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>টিপস:</strong> আপনার ইমেইলে একটি OTP কোড এবং একটি রিসেট লিংক পাঠানো হবে। 
            যেকোনো একটি ব্যবহার করে পাসওয়ার্ড রিসেট করতে পারেন।
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
