import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Lock } from 'lucide-react';
import { apiServices } from '../api';
import PasswordInput from './PasswordInput';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const changePasswordMutation = useMutation({
    mutationFn: apiServices.auth.changePassword,
    onSuccess: (data) => {
      // Use backend success message
      toast.success(data.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!');
      onClose();
      resetForm();
    },
    onError: (error) => {
      // Use backend error message or friendly fallback
      const errorMessage = error?.response?.data?.detail || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      toast.error(errorMessage);
    }
  });

  const resetForm = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // User-friendly validation
    if (!formData.currentPassword) {
      toast.error('দয়া করে বর্তমান পাসওয়ার্ড দিন');
      return;
    }

    if (!formData.newPassword) {
      toast.error('দয়া করে নতুন পাসওয়ার্ড দিন');
      return;
    }

    if (!formData.confirmPassword) {
      toast.error('দয়া করে নতুন পাসওয়ার্ড নিশ্চিত করুন');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('নতুন পাসওয়ার্ড দুইবার একই রকম লিখুন');
      return;
    }

    if (formData.newPassword.length < 4) {
      toast.error('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('নতুন পাসওয়ার্ড আগের পাসওয়ার্ড থেকে ভিন্ন হতে হবে');
      return;
    }

    // Submit
    changePasswordMutation.mutate({
      current_password: formData.currentPassword,
      new_password: formData.newPassword
    });
  };

  const handleClose = () => {
    if (!changePasswordMutation.isPending) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">পাসওয়ার্ড পরিবর্তন</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={changePasswordMutation.isPending}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              বর্তমান পাসওয়ার্ড *
            </label>
            <PasswordInput
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              placeholder="বর্তমান পাসওয়ার্ড"
              autoComplete="current-password"
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
            </div>          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              নতুন পাসওয়ার্ড নিশ্চিত করুন *
            </label>
            <PasswordInput
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="নতুন পাসওয়ার্ড নিশ্চিত করুন"
              autoComplete="new-password"
              required
            />
          </div>
          
          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={changePasswordMutation.isPending}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {changePasswordMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                'পরিবর্তন করুন'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
