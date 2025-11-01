import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../api/apiServices';
import { toast } from '../utils/toast';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [verifying, setVerifying] = useState(false);

  // Check if coming from magic link
  const token = searchParams.get('token');

  useEffect(() => {
    // If token exists in URL, verify automatically
    if (token && email) {
      verifyByLink(token);
    }
  }, [token, email]);

  const verifyByLink = async (linkToken) => {
    setVerifying(true);
    try {
      const response = await authService.verifyByLink(linkToken);
      toast.success(response.message || 'ইমেইল সফলভাবে যাচাই হয়েছে!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = error?.response?.data?.detail || 'ইমেইল যাচাই করতে সমস্যা হয়েছে।';
      toast.error(errorMessage);
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!email || !otp) {
      toast.error('ইমেইল এবং OTP উভয়ই প্রয়োজন।');
      return;
    }

    if (otp.length !== 6) {
      toast.error('OTP অবশ্যই ৬ ডিজিটের হতে হবে।');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyEmail({ email, token: otp });
      toast.success(response.message || 'ইমেইল সফলভাবে যাচাই হয়েছে!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = error?.response?.data?.detail || 'যাচাইকরণ কোড ভুল বা মেয়াদ শেষ হয়ে গেছে।';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error('ইমেইল ঠিকানা প্রয়োজন।');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resendVerification(email);
      toast.success(response.message || 'নতুন যাচাইকরণ কোড পাঠানো হয়েছে!');
    } catch (error) {
      const errorMessage = error?.response?.data?.detail || 'কোড পুনরায় পাঠাতে সমস্যা হয়েছে।';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ইমেইল যাচাই করা হচ্ছে...</h2>
          <p className="text-gray-600">অনুগ্রহ করে অপেক্ষা করুন</p>
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">ইমেইল যাচাই করুন</h2>
          <p className="text-gray-600">
            আপনার ইমেইলে পাঠানো ৬ ডিজিটের কোড লিখুন
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              ইমেইল
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

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              যাচাই কোড (OTP)
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'যাচাই করা হচ্ছে...' : 'যাচাই করুন'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading}
            className="text-emerald-600 hover:text-emerald-700 font-medium disabled:text-gray-400"
          >
            কোড পুনরায় পাঠান
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            ইতিমধ্যে যাচাই করেছেন?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              লগইন করুন
            </button>
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>টিপস:</strong> আপনার ইমেইলে একটি OTP কোড এবং একটি ভেরিফিকেশন লিংক পাঠানো হয়েছে। 
            যেকোনো একটি ব্যবহার করে যাচাই করতে পারেন।
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
