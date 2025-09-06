import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Heart, 
  Library, 
  User, 
  Mail, 
  Lock, 
  Eye 
} from 'lucide-react';
import { useAuth } from '../App';
import { toast } from 'sonner';

const LandingWrapper = () => {
  const { login, register, isLoginLoading, isRegisterLoading } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegisterMode) {
        if (registerData.password !== registerData.confirmPassword) {
          toast.error('পাসওয়ার্ড মেলে না');
          return;
        }
        await register({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password
        });
        setIsRegisterMode(false);
        setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
      } else {
        await login(credentials);
        navigate('/dashboard');
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setCredentials({ email: '', password: '' });
    setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-green-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <BookOpen className="h-24 w-24 text-yellow-400 mb-8 animate-pulse" />
          <h1 className="text-5xl font-bold mb-4 text-center">বই আড্ডা</h1>
          <p className="text-xl text-center opacity-90 leading-relaxed max-w-md">
            জ্ঞানের ভান্ডার, বইয়ের জগৎ। আমাদের সাথে যোগ দিয়ে নতুন বইয়ের সন্ধান করুন এবং জ্ঞান ভাগাভাগি করুন।
          </p>
          <div className="mt-8 flex items-center space-x-4 text-sm opacity-80">
            <div className="flex items-center">
              <Library className="h-4 w-4 mr-2" />
              <span>হাজারো বই</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>পাঠক সম্প্রদায়</span>
            </div>
            <div className="flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              <span>বিনামূল্যে</span>
            </div>
          </div>
        </div>
        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-400 rounded-full opacity-10 animate-bounce"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-green-300 rounded-full opacity-15 animate-pulse"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white rounded-full opacity-5 animate-spin"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">বই আড্ডা</h1>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isRegisterMode ? 'নতুন একাউন্ট তৈরি করুন' : 'স্বাগতম!'}
              </h2>
              <p className="text-gray-600">
                {isRegisterMode 
                  ? 'বই আড্ডায় যোগ দিন এবং জ্ঞানের জগতে প্রবেশ করুন' 
                  : 'আপনার একাউন্টে লগইন করে চালিয়ে যান'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegisterMode && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    পূর্ণ নাম
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required={isRegisterMode}
                      value={registerData.name}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="আপনার পূর্ণ নাম লিখুন"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ইমেইল
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={isRegisterMode ? registerData.email : credentials.email}
                    onChange={(e) => {
                      if (isRegisterMode) {
                        setRegisterData(prev => ({ ...prev, email: e.target.value }));
                      } else {
                        setCredentials(prev => ({ ...prev, email: e.target.value }));
                      }
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="আপনার ইমেইল ঠিকানা"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={isRegisterMode ? registerData.password : credentials.password}
                    onChange={(e) => {
                      if (isRegisterMode) {
                        setRegisterData(prev => ({ ...prev, password: e.target.value }));
                      } else {
                        setCredentials(prev => ({ ...prev, password: e.target.value }));
                      }
                    }}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="আপনার পাসওয়ার্ড"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <Eye className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {isRegisterMode && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    পাসওয়ার্ড নিশ্চিত করুন
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      required={isRegisterMode}
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoginLoading || isRegisterLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {(isLoginLoading || isRegisterLoading) ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isRegisterMode ? 'একাউন্ট তৈরি হচ্ছে...' : 'লগইন হচ্ছে...'}
                  </div>
                ) : (
                  isRegisterMode ? 'একাউন্ট তৈরি করুন' : 'লগইন করুন'
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">অথবা</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={toggleMode}
                className="mt-4 text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
              >
                {isRegisterMode 
                  ? 'ইতিমধ্যে একাউন্ট আছে? লগইন করুন' 
                  : 'নতুন একাউন্ট তৈরি করুন'}
              </button>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <span className="text-xs text-green-700 font-medium">বিনামূল্যে</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <span className="text-xs text-blue-700 font-medium">সম্প্রদায়</span>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Heart className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <span className="text-xs text-purple-700 font-medium">নিরাপদ</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-sm text-gray-500">
            <p>© ২০২৫ বই আড্ডা। সকল অধিকার সংরক্ষিত।</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingWrapper;
