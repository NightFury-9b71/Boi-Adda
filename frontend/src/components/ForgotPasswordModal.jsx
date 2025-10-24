import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Mail, Key, ArrowRight } from 'lucide-react';
import { apiServices } from '../api';
import PasswordInput from './PasswordInput';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('email'); // 'email', 'reset'
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });

  const requestResetMutation = useMutation({
    mutationFn: apiServices.auth.forgotPassword,
    onSuccess: () => {
      toast.success('পাসওয়ার্ড রিসেট কোড পাঠানো হয়েছে। আপনার ইমেইল চেক করুন।');
      setStep('reset');
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.detail || 'ইমেইল পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      toast.error(errorMessage);
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: apiServices.auth.resetPassword,
    onSuccess: () => {
      toast.success('পাসওয়ার্ড সফলভাবে রিসেট হয়েছে। এখন লগইন করুন।');
      handleClose();
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.detail || 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে। কোডটি সঠিক কিনা যাচাই করুন।';
      toast.error(errorMessage);
    }
  });

  const resetForm = () => {
    setFormData({
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: ''
    });
    setStep('email');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('ইমেইল প্রয়োজন');
      return;
    }

    requestResetMutation.mutate(formData.email);
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.code) {
      toast.error('রিসেট কোড প্রয়োজন');
      return;
    }

    if (!formData.newPassword) {
      toast.error('নতুন পাসওয়ার্ড প্রয়োজন');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড মিলছে না');
      return;
    }

    // Submit
    resetPasswordMutation.mutate({
      email: formData.email,
      code: formData.code,
      new_password: formData.newPassword
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {step === 'email' ? 'পাসওয়ার্ড রিসেট' : 'নতুন পাসওয়ার্ড সেট করুন'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={requestResetMutation.isPending || resetPasswordMutation.isPending}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {step === 'email' ? (
          /* Email Step */
          <form onSubmit={handleEmailSubmit} className="p-6 space-y-4">
            <div className="text-center mb-4">
              <p className="text-gray-600 text-sm">
                আপনার ইমেইল ঠিকানা লিখুন। আমরা আপনাকে একটি রিসেট কোড পাঠাবো।
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ইমেইল ঠিকানা *
              </label>
              <div className="relative">
                <Mail className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="আপনার ইমেইল ঠিকানা"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={requestResetMutation.isPending}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={requestResetMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {requestResetMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <span>কোড পাঠান</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Reset Step */
          <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
            <div className="text-center mb-4">
              <p className="text-gray-600 text-sm">
                আপনার ইমেইলে পাঠানো রিসেট কোড এবং নতুন পাসওয়ার্ড লিখুন।
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                রিসেট কোড *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="ইমেইল থেকে প্রাপ্ত কোড"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                নতুন পাসওয়ার্ড *
              </label>
              <PasswordInput
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="নতুন পাসওয়ার্ড"
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-gray-500 mt-1">কমপক্ষে ৬ অক্ষরের হতে হবে</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                পাসওয়ার্ড নিশ্চিত করুন *
              </label>
              <PasswordInput
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                autoComplete="new-password"
                required
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('email')}
                disabled={resetPasswordMutation.isPending}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                পেছনে
              </button>
              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {resetPasswordMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <span>পাসওয়ার্ড রিসেট করুন</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
