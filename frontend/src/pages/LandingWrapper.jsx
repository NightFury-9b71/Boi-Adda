import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../App';
import { 
  BookOpen, 
  Users, 
  Heart, 
  Share2, 
  RefreshCw,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Shield,
  Clock,
  Menu,
  X,
  Search,
  Star
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiServices } from '../App';

// Animated Counter Component
const AnimatedCounter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;
      if (progress < 1) {
        setCount(Math.floor(end * progress));
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return <span>{count.toLocaleString()}{suffix}</span>;
};

// Testimonial Card Component
const TestimonialCard = ({ name, location, content, rating }) => (
  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
    <div className="flex items-center space-x-1 mb-3 sm:mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`h-3 w-3 sm:h-4 sm:w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
      ))}
    </div>
    <p className="text-gray-700 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">"{content}"</p>
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
        {name.charAt(0)}
      </div>
      <div>
        <p className="font-medium text-gray-900 text-sm sm:text-base">{name}</p>
        <p className="text-xs sm:text-sm text-gray-600">{location}</p>
      </div>
    </div>
  </div>
);

  const LoginForm = ({ formData, setFormData, onSubmit, loading }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <input
          type="email"
          placeholder="ইমেইল"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="পাসওয়ার্ড"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <>
            <span>লগইন করুন</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      <p className="text-center text-sm text-gray-600">
        পাসওয়ার্ড ভুলে গেছেন? <a href="#" className="text-green-600 hover:text-green-700 font-medium">রিসেট করুন</a>
      </p>
    </form>
  );

  const RegistrationForm = ({ formData, setFormData, onSubmit, loading }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="পুরো নাম"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="ইমেইল"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
        />
      </div>
      <div>
        <input
          type="tel"
          placeholder="ফোন নম্বর"
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="ঠিকানা"
          value={formData.address}
          onChange={e => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="পাসওয়ার্ড"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="পাসওয়ার্ড নিশ্চিত করুন"
          value={formData.confirmPassword}
          onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <>
            <span>নিবন্ধন করুন</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      <p className="text-center text-sm text-gray-600">
        ইতিমধ্যে অ্যাকাউন্ট আছে? <button type="button" onClick={() => setIsLogin(true)} className="text-green-600 hover:text-green-700 font-medium">লগইন করুন</button>
      </p>
    </form>
  );


const LandingWrapper = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '', password: '', name: '', confirmPassword: '', address: '', phone: ''
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const { login, register, isLoading: isLoginLoading } = useAuth();
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch real stats from API
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: apiServices.database.getOverviewStats,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        if (!formData.email || !formData.password) {
          toast.error('ইমেইল এবং পাসওয়ার্ড প্রয়োজন');
          return;
        }
        await login(formData);
        toast.success('সফলভাবে লগইন হয়েছে!');
        navigate('/dashboard');
      } else {
        setIsRegisterLoading(true);
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
          toast.error('সকল ক্ষেত্র পূরণ করুন');
          setIsRegisterLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error('পাসওয়ার্ড মিল নেই');
          setIsRegisterLoading(false);
          return;
        }
        await register(formData);
        toast.success('সফলভাবে নিবন্ধন হয়েছে!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'একটি ত্রুটি ঘটেছে');
    } finally {
      setIsRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full transition-all duration-300 ${
                scrollY > 50 ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-white/20 backdrop-blur-sm'
              }`}>
                <BookOpen className={`h-6 w-6 ${scrollY > 50 ? 'text-white' : 'text-white'}`} />
              </div>
              <span className={`text-2xl font-bold transition-colors duration-300 ${
                scrollY > 50 ? 'bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent' : 'text-white'
              }`}>বই আড্ডা</span>
            </div>
            {/* Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`transition-colors font-medium ${
                scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white/90 hover:text-white'
              }`}>সুবিধা</a>
              <a href="#how-it-works" className={`transition-colors font-medium ${
                scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white/90 hover:text-white'
              }`}>কিভাবে কাজ করে</a>
              <a href="#testimonials" className={`transition-colors font-medium ${
                scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white/90 hover:text-white'
              }`}>রিভিউ</a>
              <a href="#auth-form" className={`transition-colors font-medium ${
                scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white/90 hover:text-white'
              }`}>যোগ দিন</a>
              <button
                onClick={() => navigate('/books')}
                className={`transition-colors font-medium ${
                  scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white/90 hover:text-white'
                }`}
              >
                বই লাইব্রেরি
              </button>
            </div>
            {/* Mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`transition-colors ${
                  scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white hover:text-green-200'
                }`}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="#features" className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors">সুবিধা</a>
                <a href="#how-it-works" className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors">কিভাবে কাজ করে</a>
                <a href="#testimonials" className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors">রিভিউ</a>
                <a href="#auth-form" className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors">যোগ দিন</a>
                <button
                  onClick={() => navigate('/books')}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  বই লাইব্রেরি
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-green-700 to-green-800 min-h-screen flex items-center overflow-hidden">
        {/* Animated Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-4 sm:left-10 opacity-10">
            <BookOpen className="h-16 w-16 sm:h-24 sm:w-24 lg:h-32 lg:w-32 text-white animate-pulse" />
          </div>
          <div className="absolute top-40 right-4 sm:right-20 opacity-10">
            <Users className="h-12 w-12 sm:h-18 sm:w-18 lg:h-24 lg:w-24 text-white animate-bounce" />
          </div>
          <div className="absolute bottom-20 left-1/4 opacity-10">
            <Heart className="h-10 w-10 sm:h-16 sm:w-16 lg:h-20 lg:w-20 text-white animate-pulse" />
          </div>
        </div>

        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-white space-y-4 sm:space-y-6">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span>
                  JUST-এর #১ বই শেয়ারিং প্ল্যাটফর্ম {/* JUST's #1 book sharing platform */}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                জ্ঞান ভাগাভাগির
                <span className="block text-green-200 bg-gradient-to-r from-green-200 to-white bg-clip-text text-transparent">নতুন মাধ্যম</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-green-100 leading-relaxed max-w-2xl">
                বই আড্ডা'র মাধ্যমে আপনি বই ধার দিতে, ধার নিতে ও দান করতে পারেন—শুধুমাত্র যশোর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়ের জন্য। আমাদের স্মার্ট, নিরাপদ প্ল্যাটফর্মে যোগ দিন।
              </p>
              {/* Key Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 my-6 sm:my-8">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-300 flex-shrink-0" />
                  <span className="text-green-100 text-sm sm:text-base">সম্পূর্ণ বিনামূল্যে</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-300 flex-shrink-0" />
                  <span className="text-green-100 text-sm sm:text-base">নিরাপদ ও যাচাইকৃত</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-300 flex-shrink-0" />
                  <span className="text-green-100 text-sm sm:text-base">JUST ক্যাম্পাসের জন্য</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-300 flex-shrink-0" />
                  <span className="text-green-100 text-sm sm:text-base">২৪/৭ সাপোর্ট</span>
                </div>
              </div>
              {/* Counters */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                    {statsLoading ? '...' : <AnimatedCounter end={stats?.users ?? 0} />}
                  </div>
                  <p className="text-green-200 text-xs sm:text-sm">সক্রিয় সদস্য</p>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                    {statsLoading ? '...' : <AnimatedCounter end={stats?.categories ?? 0} />}
                  </div>
                  <p className="text-green-200 text-xs sm:text-sm">বইয়ের বিভাগ</p>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                    {statsLoading ? '...' : <AnimatedCounter end={stats?.books ?? 0} />}
                  </div>
                  <p className="text-green-200 text-xs sm:text-sm">মোট বই</p>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                    {statsLoading ? '...' : <AnimatedCounter end={stats?.book_copies ?? 0} />}
                  </div>
                  <p className="text-green-200 text-xs sm:text-sm">বইয়ের কপি</p>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                    {statsLoading ? '...' : <AnimatedCounter end={stats?.borrows ?? 0} />}
                  </div>
                  <p className="text-green-200 text-xs sm:text-sm">বই ধার</p>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                    {statsLoading ? '...' : <AnimatedCounter end={stats?.donations ?? 0} />}
                  </div>
                  <p className="text-green-200 text-xs sm:text-sm">বই দান</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-green-200">
                শুধুমাত্র যশোর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় (JUST) কমিউনিটির জন্য
              </div>
              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  onClick={() => navigate('/books')}
                  className="bg-white text-green-700 px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 shadow-xl text-sm sm:text-base"
                >
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>বই লাইব্রেরি দেখুন</span>
                </button>
                <button 
                  onClick={() => document.getElementById('auth-form').scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-green-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>এখনই যোগ দিন</span>
                </button>
              </div>
            </div>
            {/* Right side - Auth Forms */}
            <div id="auth-form" className="lg:pl-8 mt-8 lg:mt-0">
              <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm bg-white/95">
                <div className="text-center mb-6 sm:mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-gradient-to-br from-green-400 to-green-600 p-2.5 sm:p-3 rounded-full">
                      <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">যোগ দিন</h2>
                  <p className="text-gray-600 text-sm sm:text-base">জ্ঞান ভাগাভাগির মাধ্যম • শুধু JUST</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 mt-3 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{statsLoading ? '...' : <AnimatedCounter end={stats?.users ?? 0} />} সদস্য</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{statsLoading ? '...' : <AnimatedCounter end={stats?.books ?? 0} />} বই</span>
                    </div>
                  </div>
                </div>
                <div className="flex mb-6 bg-gray-100 rounded-lg p-1 relative">
                  <div 
                    className={`absolute top-1 bottom-1 w-1/2 bg-green-600 rounded-md transition-transform duration-300 ${isLogin ? 'transform translate-x-0' : 'transform translate-x-full'}`}
                  />
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 px-4 text-center rounded-md transition-colors relative z-10 ${
                      isLogin ? 'text-white' : 'text-gray-700 hover:text-green-600'
                    }`}
                  >
                    লগইন
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 px-4 text-center rounded-md transition-colors relative z-10 ${
                      !isLogin ? 'text-white' : 'text-gray-700 hover:text-green-600'
                    }`}
                  >
                    নিবন্ধন
                  </button>
                </div>
                <div className="relative">
                  {isLogin ? (
                    <LoginForm 
                      formData={formData}
                      setFormData={setFormData}
                      onSubmit={handleSubmit}
                      loading={isLoginLoading}
                    />
                  ) : (
                    <RegistrationForm 
                      formData={formData}
                      setFormData={setFormData}
                      onSubmit={handleSubmit}
                      loading={isRegisterLoading}
                    />
                  )}
                </div>
                <div className="mt-4 sm:mt-6 text-center">
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Shield className="h-3 w-3" />
                      <span>নিরাপদ</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>যাচাইকৃত</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>২৪/৭ সেবা</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              কেন বই আড্ডা বেছে নেবেন?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              বই ভাগাভাগির জন্য JUST-এর সবচেয়ে নির্ভরযোগ্য এবং সুবিধাজনক প্ল্যাটফর্ম
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-center group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Share2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">বই শেয়ার করুন</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                নিজের পড়া বই শেয়ার করুন এবং নতুন বই আবিষ্কার করুন। সহজ, নিরাপদ ও ক্যাম্পাস-ভিত্তিক আদান-প্রদান।
              </p>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-center group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">বই এক্সচেঞ্জ</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                আপনার বই দিয়ে অন্যের বই নিন। স্মার্ট ক্যাম্পাস-ম্যাচিং সিস্টেম।
              </p>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-center group sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">বই দান করুন</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                দরিদ্র শিক্ষার্থীদের জন্য বই দান করুন; JUST কমিউনিটিতে কল্যাণ ছড়িয়ে দিন।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              কিভাবে কাজ করে
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">মাত্র তিনটি সহজ ধাপে শুরু করুন</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white text-lg sm:text-2xl font-bold">১</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">নিবন্ধন করুন</h3>
              <p className="text-gray-600 text-sm sm:text-base px-2">বিনামূল্যে অ্যাকাউন্ট তৈরি করুন এবং JUST প্রোফাইল সম্পূর্ণ করুন</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white text-lg sm:text-2xl font-bold">২</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">বই যোগ করুন</h3>
              <p className="text-gray-600 text-sm sm:text-base px-2">নিজের বই তালিকায় যোগ করুন এবং অন্যদের বই ব্রাউজ করুন</p>
            </div>
            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white text-lg sm:text-2xl font-bold">৩</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">আদান-প্রদান করুন</h3>
              <p className="text-gray-600 text-sm sm:text-base px-2">বই শেয়ার, এক্সচেঞ্জ বা দান করুন; JUST-এ জ্ঞানের বিনিময় করুন</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section id="testimonials" className="py-16 sm:py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">সদস্যদের মতামত</h2>
            <p className="text-lg sm:text-xl text-gray-600 px-4">
              আমাদের JUST কমিউনিটির সদস্যরা কী বলছেন
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <TestimonialCard 
              name="রাহুল আহমেদ"
              location="JUST, বাংলাদেশ"
              content="বই আড্ডা ব্যবহার করে আমি অসাধারণ বই পড়তে পারছি। ক্যাম্পাসের ভিতরে সহজ ও নিরাপদ!"
              rating={5}
            />
            <TestimonialCard 
              name="সামিরা খান"
              location="JUST, বাংলাদেশ"
              content="আমার পুরানো বইগুলো আরেকজনের কাজে আসছে—নতুন বন্ধু পেয়েছি।"
              rating={5}
            />
            <TestimonialCard 
              name="মাহবুব হাসান"
              location="JUST, বাংলাদেশ"
              content="দরিদ্র ভাই-বোনের জন্য বই দান করতে পাচ্ছি। এটি দুর্দান্ত!"
              rating={5}
            />
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">প্রায়শই জিজ্ঞাসিত প্রশ্ন</h2>
            <p className="text-lg sm:text-xl text-gray-600 px-4">কমিউনিটির প্রশ্নের উত্তর</p>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">বই আড্ডা কি সম্পূর্ণ বিনামূল্যে?</h3>
              <p className="text-gray-600 text-sm sm:text-base">হ্যাঁ, বই আড্ডা শুধুমাত্র JUST-এ বিনামূল্যে। নিবন্ধন, বই আদান-প্রদান এবং দান সবই ফ্রি।</p>
            </div>
            {/* <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">কিভাবে বই এক্সচেঞ্জ করব?</h3>
              <p className="text-gray-600 text-sm sm:text-base">ক্যাম্পাসের সদস্যদের মধ্যে বই খুঁজুন, এক্সচেঞ্জ রিকোয়েস্ট পাঠান ও মালিকের সাথে যোগাযোগ করুন।</p>
            </div> */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">বই ফেরত দিতে হবে কি?</h3>
              <p className="text-gray-600 text-sm sm:text-base"> অবশ্যই। জ্ঞানের বিনিময়ই আমাদের একমাত্র লক্ষ্য। আপনি বই ফেরত দিলে অন্যজন নিতে পারবে। </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">কী ধরনের বই শেয়ার করতে পারি?</h3>
              <p className="text-gray-600 text-sm sm:text-base">JUST-এর ছাত্রছাত্রীদের সকল ঐচ্ছিক শিক্ষামূলক বই, উপন্যাস, গল্প, কবিতা, বিজ্ঞান — সব ধরনের বই।</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">আপডেট পেতে থাকুন</h2>
            <p className="text-green-100 mb-6 sm:mb-8 text-base sm:text-lg px-4">
              JUST কমিউনিটির বই ও অফারের নতুন খবর সবার আগে পান
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="আপনার ইমেইল"
                className="flex-1 px-4 sm:px-6 py-3 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm sm:text-base"
              />
              <button className="bg-white text-green-600 px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors text-sm sm:text-base whitespace-nowrap">
                সাবস্ক্রাইব করুন
              </button>
            </div>
            <p className="text-green-200 text-xs sm:text-sm mt-3 sm:mt-4 px-4">
              চলমান ই-মেইল সাবস্ক্রিপশন। ব্যক্তিগত তথ্য শেয়ার করি না।
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="sm:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-green-400 to-green-600 p-2 rounded-full">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="text-xl sm:text-2xl font-bold">বই আড্ডা</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md text-sm sm:text-base">
                জ্ঞান ভাগাভাগির মাধ্যমে JUST-এ শিক্ষিত ও সচেতন সমাজ গড়ার প্ল্যাটফর্ম।
              </p>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">দ্রুত লিঙ্ক</h3>
              <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">সুবিধাসমূহ</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">কিভাবে কাজ করে</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">রিভিউ</a></li>
                <li><a href="#community" className="text-gray-400 hover:text-white transition-colors">কমিউনিটি</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">সাপোর্ট</h3>
              <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li><span className="text-gray-400">হেল্প সেন্টার</span></li>
                <li><span className="text-gray-400">যোগাযোগ</span></li>
                <li><span className="text-gray-400">প্রাইভেসি পলিসি</span></li>
                <li><span className="text-gray-400">নিয়মাবলী</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 sm:pt-8 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
              © ২০২৫ বই আড্ডা। সকল অধিকার সংরক্ষিত।
              <span className="text-green-400 ml-2">♥</span> দিয়ে তৈরি JUST-এ
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Developed by Abdullah Al Noman
              | Email: nomanstine@gmail.com
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default LandingWrapper;
