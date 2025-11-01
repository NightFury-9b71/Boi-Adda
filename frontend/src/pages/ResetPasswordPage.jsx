import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { authService } from '../api/apiServices';
import { toast } from '../utils/toast';
import PasswordInput from '../components/PasswordInput';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(searchParams.get('email') || location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Check if coming from magic link
  const token = searchParams.get('token');

  useEffect(() => {
    // If token exists in URL, show password input only
    if (token) {
      setResetting(true);
    }
  }, [token]);

  const handleResetByOtp = async (e) => {
    e.preventDefault();

    if (!email || !otp) {
      toast.error('ইমেইল এবং OTP উভয়ই প্রয়োজন।');
      return;
    }

    if (otp.length !== 6) {
      toast.error('OTP অবশ্যই ৬ ডিজিটের হতে হবে।');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('পাসওয়ার্ড মিলছে না।');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword({
        email,
        code: otp,
        new_password: newPassword
      });
      toast.success(response.message || 'পাসওয়ার্ড সফলভাবে রিসেট হয়েছে!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = error?.response?.data?.detail || 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetByLink = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('রিসেট টোকেন পাওয়া যায়নি।');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('পাসওয়ার্ড মিলছে না।');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPasswordByLink(token, newPassword);
      toast.success(response.message || 'পাসওয়ার্ড সফলভাবে রিসেট হয়েছে!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = error?.response?.data?.detail || 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।';
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
      const response = await authService.forgotPassword(email);
      toast.success(response.message || 'নতুন রিসেট কোড পাঠানো হয়েছে!');
    } catch (error) {
      const errorMessage = error?.response?.data?.detail || 'কোড পুনরায় পাঠাতে সমস্যা হয়েছে।';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset by magic link (token in URL)
  if (resetting && token) {
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">নতুন পাসওয়ার্ড সেট করুন</h2>
            <p className="text-gray-600">
              আপনার নতুন পাসওয়ার্ড লিখুন
            </p>
          </div>

          <form onSubmit={handleResetByLink} className="space-y-6">
            <PasswordInput
              label="নতুন পাসওয়ার্ড"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="নতুন পাসওয়ার্ড"
              required
              minLength={6}
            />

            <PasswordInput
              label="পাসওয়ার্ড নিশ্চিত করুন"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="পাসওয়ার্ড আবার লিখুন"
              required
              minLength={6}
            />

            <button
              type="submit"
              disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'রিসেট করা হচ্ছে...' : 'পাসওয়ার্ড রিসেট করুন'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              লগইনে ফিরে যান
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reset by OTP
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">পাসওয়ার্ড রিসেট করুন</h2>
          <p className="text-gray-600">
            ইমেইলে পাঠানো ৬ ডিজিটের কোড এবং নতুন পাসওয়ার্ড লিখুন
          </p>
        </div>

        <form onSubmit={handleResetByOtp} className="space-y-6">
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
              রিসেট কোড (OTP)
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

          <PasswordInput
            label="নতুন পাসওয়ার্ড"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="নতুন পাসওয়ার্ড"
            required
            minLength={6}
          />

          <PasswordInput
            label="পাসওয়ার্ড নিশ্চিত করুন"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="পাসওয়ার্ড আবার লিখুন"
            required
            minLength={6}
          />

          <button
            type="submit"
            disabled={loading || otp.length !== 6 || newPassword.length < 6 || newPassword !== confirmPassword}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'রিসেট করা হচ্ছে...' : 'পাসওয়ার্ড রিসেট করুন'}
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

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-gray-700 font-medium"
          >
            লগইনে ফিরে যান
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>টিপস:</strong> আপনার ইমেইলে একটি OTP কোড এবং একটি রিসেট লিংক পাঠানো হয়েছে। 
            যেকোনো একটি ব্যবহার করে পাসওয়ার্ড রিসেট করতে পারেন।
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
