import { useState, useEffect } from 'react';
import { data, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { BookOpen, Users, Heart, Share2, RefreshCw, TrendingUp, ArrowRight, CheckCircle, Shield, Clock, Menu, X, Star} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiServices } from '../api';
import PasswordInput from '../components/PasswordInput';

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
  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const LoginForm = ({ formData, setFormData, onSubmit, loading }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <input
        type="email"
        placeholder="ইমেইল"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
        required
        autoComplete="username"
      />
    </div>
    <div>
      <PasswordInput
        placeholder="পাসওয়ার্ড"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        autoComplete="current-password"
      />
    </div>
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-md font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
      পাসওয়ার্ড ভুলে গেছেন?{' '}
      <a href="#" className="text-green-600 hover:text-green-700 font-medium">
        রিসেট করুন
      </a>
    </p>
  </form>
);

const RegistrationForm = ({ formData, setFormData, onSubmit, loading, setIsLogin }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <input
        type="text"
        placeholder="পুরো নাম"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
        required
        autoComplete="name"
      />
    </div>
    <div>
      <input
        type="email"
        placeholder="ইমেইল"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
        required
        autoComplete="email"
      />
    </div>
    <div>
      <input
        type="tel"
        placeholder="ফোন নম্বর"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
        autoComplete="tel"
      />
    </div>
    <div>
      <input
        type="text"
        placeholder="ঠিকানা"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
      />
    </div>
    <div>
      <PasswordInput
        placeholder="পাসওয়ার্ড"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        autoComplete="new-password"
      />
    </div>
    <div>
      <PasswordInput
        placeholder="পাসওয়ার্ড নিশ্চিত করুন"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        autoComplete="new-password"
      />
    </div>
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-md font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
      ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
      <button
        type="button"
        onClick={() => setIsLogin(true)}
        className="text-green-600 hover:text-green-700 font-medium"
      >
        লগইন করুন
      </button>
    </p>
  </form>
);

const LandingPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    phone: '',
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const { login, register } = useAuth();
  const { t } = useTranslation();
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
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
        setIsLoginLoading(true);
        await login(formData);
        toast.success('সফলভাবে লগইন হয়েছে!');
        navigate('/dashboard');
      } else {
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
          toast.error('সকল ক্ষেত্র পূরণ করুন');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error('পাসওয়ার্ড মিল নেই');
          return;
        }
        setIsRegisterLoading(true);
        const result = await register(formData);
        setRegisteredEmail(formData.email);
        setShowVerification(true);
        toast.success(result.message || 'রেজিস্ট্রেশন সফল! আপনার ইমেইল যাচাই করুন');
      }
    } catch (error) {
      // Handle different error types with user-friendly messages
      const errorMessage = error.response?.data?.detail || error.message;
      
      if (isLogin) {
        if (error.response?.status === 401) {
          toast.error('ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন');
        } else if (error.response?.status === 400) {
          toast.error('ইমেইল যাচাই করুন। সঠিক ইমেইল লিখুন');
        } else if (errorMessage?.includes('verify') || errorMessage?.includes('verification')) {
          toast.error('আপনার ইমেইল এখনো যাচাই করা হয়নি। ইমেইল চেক করুন');
        } else {
          toast.error(errorMessage || 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন');
        }
      } else {
        if (error.response?.status === 400) {
          if (errorMessage?.includes('email') || errorMessage?.includes('Email')) {
            toast.error('এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট আছে');
          } else if (errorMessage?.includes('password')) {
            toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে');
          } else {
            toast.error(errorMessage || 'রেজিস্ট্রেশন ব্যর্থ। আবার চেষ্টা করুন');
          }
        } else {
          toast.error(errorMessage || 'রেজিস্ট্রেশন ব্যর্থ। আবার চেষ্টা করুন');
        }
      }
    } finally {
      setIsLoginLoading(false);
      setIsRegisterLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('দয়া করে 6 সংখ্যার কোড লিখুন');
      return;
    }
    
    try {
      setIsVerifying(true);
      await apiServices.auth.verifyEmail({
        email: registeredEmail,
        token: verificationCode
      });
      toast.success('✅ ইমেইল যাচাই সফল! এখন লগইন করুন');
      setShowVerification(false);
      setShowAuthModal(false);
      setIsLogin(true);
      setVerificationCode('');
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        phone: '',
      });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      
      if (error.response?.status === 400) {
        if (errorMessage?.includes('Invalid') || errorMessage?.includes('invalid')) {
          toast.error('❌ কোডটি ভুল বা মেয়াদ শেষ হয়েছে। পুনরায় কোড পাঠান');
        } else if (errorMessage?.includes('expired')) {
          toast.error('⏰ কোডের মেয়াদ শেষ। নতুন কোড পাঠান');
        } else if (errorMessage?.includes('email')) {
          toast.error('📧 ইমেইল খুঁজে পাওয়া যায়নি। আবার রেজিস্টার করুন');
        } else {
          toast.error(errorMessage || '❌ যাচাই ব্যর্থ। সঠিক কোড লিখুন');
        }
      } else if (error.response?.status === 404) {
        toast.error('📧 ইমেইল খুঁজে পাওয়া যায়নি। আবার রেজিস্টার করুন');
      } else if (error.response?.status === 500) {
        toast.error('🔧 সার্ভার সমস্যা। কিছুক্ষণ পর চেষ্টা করুন');
      } else {
        toast.error(errorMessage || '❌ যাচাই ব্যর্থ। আবার চেষ্টা করুন');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await apiServices.auth.resendVerification({ email: registeredEmail });
      toast.success('✉️ নতুন কোড পাঠানো হয়েছে! আপনার ইমেইল চেক করুন');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      
      if (error.response?.status === 400) {
        toast.error('⚠️ ইমেইল ঠিক নেই বা ইতিমধ্যে যাচাই করা হয়েছে');
      } else if (error.response?.status === 429) {
        toast.error('⏰ অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ অপেক্ষা করুন');
      } else if (error.response?.status === 500) {
        toast.error('🔧 সার্ভার সমস্যা। কিছুক্ষণ পর চেষ্টা করুন');
      } else {
        toast.error(errorMessage || '❌ কোড পাঠানো ব্যর্থ। আবার চেষ্টা করুন');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full transition-all duration-300 ${
                  scrollY > 50 ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-white/20 backdrop-blur-sm'
                }`}
              >
                <BookOpen className={`h-6 w-6 text-white`} />
              </div>
              <span
                className={`text-2xl font-bold transition-colors duration-300 ${
                  scrollY > 50
                    ? 'bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent'
                    : 'text-white'
                }`}
              >
                {t('appName')}
              </span>
            </div>
            {/* Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className={`transition-colors font-medium ${
                  scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white/90 hover:text-white'
                }`}
              >
                {t('landing.nav.features')}
              </a>
              <a
                href="#how-it-works"
                className={`transition-colors font-medium ${
                  scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white/90 hover:text-white'
                }`}
              >
                {t('landing.nav.howItWorks')}
              </a>
              <a
                href="#testimonials"
                className={`transition-colors font-medium ${
                  scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white/90 hover:text-white'
                }`}
              >
                {t('landing.nav.testimonials')}
              </a>
              <a
                href="#auth-form"
                className={`transition-colors font-medium ${
                  scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white/90 hover:text-white'
                }`}
              >
                যোগ দিন
              </a>
              <button
                onClick={() => navigate('/unauthorized/books')}
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
                  scrollY > 50 ? 'text-gray-700 hover:text-green-600' : 'text-white hover:text-green-300'
                }`}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 shadow-md">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="#features" className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors">
                  {t('landing.nav.features')}
                </a>
                <a
                  href="#how-it-works"
                  className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  {t('landing.nav.howItWorks')}
                </a>
                <a href="#testimonials" className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors">
                  {t('landing.nav.testimonials')}
                </a>
                <a href="#auth-form" className="block px-3 py-2 text-gray-700 hover:text-green-600 transition-colors">
                  যোগ দিন
                </a>
                <button
                  onClick={() => navigate('/unauthorized/books')}
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
        {/* Animated icons */}
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
                <span className="block text-green-200 bg-gradient-to-r from-green-200 to-white bg-clip-text text-transparent">
                  নতুন মাধ্যম
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-green-100 leading-relaxed max-w-2xl">
                বই আড্ডা'র মাধ্যমে আপনি বই ধার দিতে, ধার নিতে ও দান করতে পারেন—শুধুমাত্র যশোর
                বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়ের জন্য। আমাদের স্মার্ট, নিরাপদ প্ল্যাটফর্মে যোগ দিন।
              </p>
              {/* Key Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 my-6 sm:my-8">
                {[
                  'সম্পূর্ণ বিনামূল্যে',
                  'নিরাপদ ও যাচাইকৃত',
                  'JUST ক্যাম্পাসের জন্য',
                  '২৪/৭ সাপোর্ট',
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-300 flex-shrink-0" />
                    <span className="text-green-100 text-sm sm:text-base">{text}</span>
                  </div>
                ))}
              </div>
              {/* Counters */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[
                  { label: 'সক্রিয় সদস্য', value: stats?.users ?? 0 },
                  { label: 'বইয়ের বিভাগ', value: stats?.categories ?? 0 },
                  { label: 'মোট বই', value: stats?.books ?? 0 },
                  { label: 'বইয়ের কপি', value: stats?.book_copies ?? 0 },
                  { label: 'বই ধার', value: stats?.borrows ?? 0 },
                  { label: 'বই দান', value: stats?.donations ?? 0 },
                ].map(({ label, value }, idx) => (
                  <div key={idx} className="text-center lg:text-left">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                      {statsLoading ? '...' : <AnimatedCounter end={value} />}
                    </div>
                    <p className="text-green-200 text-xs sm:text-sm">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-green-200">
                শুধুমাত্র যশোর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় (JUST) কমিউনিটির জন্য
              </div>
              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  onClick={() => navigate('/unauthorized/books')}
                  className="bg-white text-green-700 px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition transform hover:scale-105 flex items-center justify-center space-x-2 shadow-md text-sm sm:text-base"
                >
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>বই লাইব্রেরি দেখুন</span>
                </button>
                <button
                  onClick={() =>
                    document.getElementById('auth-form').scrollIntoView({ behavior: 'smooth' })
                  }
                  className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-green-700 transition transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>এখনই যোগ দিন</span>
                </button>
              </div>
            </div>
            {/* Right side - Auth Forms */}
            <div id="auth-form" className="lg:pl-8 mt-8 lg:mt-0">
              <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 backdrop-blur-sm bg-white/95">
                <div className="text-center mb-6 sm:mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-gradient-to-br from-green-400 to-green-600 p-2.5 sm:p-3 rounded-full">
                      <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">
                    যোগ দিন
                  </h2>
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
                    className={`absolute top-1 bottom-1 w-1/2 bg-green-600 rounded-md transition-transform duration-300 ${
                      isLogin ? 'transform translate-x-0' : 'transform translate-x-full'
                    }`}
                    aria-hidden="true"
                  />
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 px-4 text-center rounded-md transition-colors relative z-10 ${
                      isLogin ? 'text-white' : 'text-gray-700 hover:text-green-600'
                    }`}
                    aria-pressed={isLogin}
                    aria-label="Switch to login form"
                  >
                    লগইন
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 px-4 text-center rounded-md transition-colors relative z-10 ${
                      !isLogin ? 'text-white' : 'text-gray-700 hover:text-green-600'
                    }`}
                    aria-pressed={!isLogin}
                    aria-label="Switch to registration form"
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
                      setIsLogin={setIsLogin}
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

      {/* Email Verification Modal */}
      {showVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-full">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">
                ইমেইল যাচাই করুন
              </h2>
              <p className="text-gray-600 text-sm">
                আমরা <span className="font-semibold">{registeredEmail}</span> এ একটি যাচাই কোড পাঠিয়েছি
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
                  যাচাই কোড (৬ ডিজিট)
                </label>
                <input
                  id="verification-code"
                  type="text"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest font-semibold"
                  autoFocus
                />
              </div>
              
              <button
                onClick={handleVerification}
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    যাচাই করা হচ্ছে...
                  </span>
                ) : (
                  'যাচাই করুন'
                )}
              </button>
              
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={handleResendCode}
                  className="text-green-600 hover:text-green-700 font-medium hover:underline transition"
                >
                  পুনরায় কোড পাঠান
                </button>
                <button
                  onClick={() => {
                    setShowVerification(false);
                    setVerificationCode('');
                  }}
                  className="text-gray-600 hover:text-gray-700 font-medium hover:underline transition"
                >
                  ফিরে যান
                </button>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                কোড পাননি? আপনার স্প্যাম ফোল্ডার চেক করুন অথবা পুনরায় কোড পাঠান
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-600 bg-clip-text text-transparent mb-4">
              কেন বই আড্ডা বেছে নেবেন?
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto px-4">
              বই ভাগাভাগির জন্য JUST-এর সবচেয়ে নির্ভরযোগ্য এবং সুবিধাজনক প্ল্যাটফর্ম
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Share2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">বই শেয়ার করুন</h3>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                নিজের পড়া বই শেয়ার করুন এবং নতুন বই আবিষ্কার করুন। সহজ, নিরাপদ ও ক্যাম্পাস-ভিত্তিক আদান-প্রদান।
              </p>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">বই এক্সচেঞ্জ</h3>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                আপনার বই দিয়ে অন্যের বই নিন। স্মার্ট ক্যাম্পাস-ম্যাচিং সিস্টেম।
              </p>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center group sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">বই দান করুন</h3>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                দরিদ্র শিক্ষার্থীদের জন্য বই দান করুন; JUST কমিউনিটিতে কল্যাণ ছড়িয়ে দিন।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">প্রায়শই জিজ্ঞাসিত প্রশ্ন</h2>
            <p className="text-lg sm:text-xl text-gray-700 px-4">কমিউনিটির প্রশ্নের উত্তর</p>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">বই আড্ডা কি সম্পূর্ণ বিনামূল্যে?</h3>
              <p className="text-gray-700 text-sm sm:text-base">
                হ্যাঁ, বই আড্ডা শুধুমাত্র JUST-এ বিনামূল্যে। নিবন্ধন, বই আদান-প্রদান এবং দান সবই ফ্রি।
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">বই ফেরত দিতে হবে কি?</h3>
              <p className="text-gray-700 text-sm sm:text-base">
                অবশ্যই। জ্ঞানের বিনিময়ই আমাদের একমাত্র লক্ষ্য। আপনি বই ফেরত দিলে অন্যজন নিতে পারবে।
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">কী ধরনের বই শেয়ার করতে পারি?</h3>
              <p className="text-gray-700 text-sm sm:text-base">
                JUST-এর ছাত্রছাত্রীদের সকল ঐচ্ছিক শিক্ষামূলক বই, উপন্যাস, গল্প, কবিতা, বিজ্ঞান — সব ধরনের বই।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-4">
              যোগাযোগ করুন
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto px-4">
              যেকোন প্রশ্ন বা মতামতের জন্য নিচের ফরমটি পূরণ করুন অথবা উল্লেখিত তথ্য ব্যবহার করুন।
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Contact Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('ধন্যবাদ! আপনার বার্তা পাঠানো হয়েছে।');
              }}
              className="space-y-6"
            >
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  নাম
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  placeholder="আপনার নাম"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  ইমেইল
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  placeholder="আপনার ইমেইল"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  বার্তা
                </label>
                <textarea
                  id="message"
                  required
                  rows="4"
                  placeholder="আপনার বার্তা লিখুন"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-md font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition transform hover:scale-105"
              >
                পাঠান
              </button>
            </form>

            {/* Contact Details */}
            <div className="text-gray-700 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">ঠিকানা</h3>
                <p>যশোর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়, যশোর, বাংলাদেশ</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">ফোন</h3>
                <p>+৮৮ ০১৭XXXXXXXX</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">ইমেইল</h3>
                <p>
                  <a href="mailto:support@boiadda.com" className="text-green-600 hover:underline">
                    support@boiadda.com
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">সোশ্যাল মিডিয়া</h3>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="text-green-600 hover:text-green-800 transition"
                    aria-label="Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facebook
                  </a>
                  <a
                    href="#"
                    className="text-green-600 hover:text-green-800 transition"
                    aria-label="Twitter"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                  <a
                    href="#"
                    className="text-green-600 hover:text-green-800 transition"
                    aria-label="Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                </div>
              </div>
            </div>
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
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                    সুবিধাসমূহ
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
                    কিভাবে কাজ করে
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">
                    রিভিউ
                  </a>
                </li>
                <li>
                  <a href="#community" className="text-gray-400 hover:text-white transition-colors">
                    কমিউনিটি
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">সাপোর্ট</h3>
              <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                <li>
                  <span className="text-gray-400">হেল্প সেন্টার</span>
                </li>
                <li>
                  <span className="text-gray-400">যোগাযোগ</span>
                </li>
                <li>
                  <span className="text-gray-400">প্রাইভেসি পলিসি</span>
                </li>
                <li>
                  <span className="text-gray-400">নিয়মাবলী</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 sm:pt-8 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
              © ২০২৫ বই আড্ডা। সকল অধিকার সংরক্ষিত।
              <span className="text-green-400 ml-2">♥</span> দিয়ে তৈরি JUST-এ
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Developed by Abdullah Al Noman | Email:{' '}
              <a href="mailto:nomanstine@gmail.com" className="underline hover:text-green-400">
                nomanstine@gmail.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
