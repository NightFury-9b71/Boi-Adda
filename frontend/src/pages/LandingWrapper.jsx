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
  Play,
  CheckCircle,
  Shield,
  Clock,
  Menu,
  X,
  Search,
  Zap,
  Globe,
  Star,
  MessageCircle,
  Download,
  Award,
  Mail,
  MapPin,
  Phone
} from 'lucide-react';

const LandingWrapper = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    address: '',
    phone: ''
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  
  const { login, register, isLoading: isLoginLoading } = useAuth();
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const navigate = useNavigate();

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
        
        await login(formData.email, formData.password);
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
        
        await register(formData.email, formData.password, formData.name, formData.address, formData.phone);
        toast.success('সফলভাবে নিবন্ধন হয়েছে!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'একটি ত্রুটি ঘটেছে');
    } finally {
      setIsRegisterLoading(false);
    }
  };

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

  // Login Form Component
  const LoginForm = ({ formData, setFormData, onSubmit, loading }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <input
          type="email"
          placeholder="ইমেইল"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="পাসওয়ার্ড"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
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

  // Registration Form Component
  const RegistrationForm = ({ formData, setFormData, onSubmit, loading }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="পুরো নাম"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="ইমেইল"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
        />
      </div>
      <div>
        <input
          type="tel"
          placeholder="ফোন নম্বর"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="ঠিকানা"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="পাসওয়ার্ড"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="পাসওয়ার্ড নিশ্চিত করুন"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
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

  // Testimonial Card Component
  const TestimonialCard = ({ name, location, content, avatar, rating }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
      <div className="flex items-center space-x-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
        ))}
      </div>
      <p className="text-gray-700 mb-4 leading-relaxed">"{content}"</p>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-600">{location}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
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
            
            {/* Desktop Menu */}
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
            </div>

            {/* Mobile Menu Button */}
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
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-green-700 to-green-800 min-h-screen flex items-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 opacity-10">
            <BookOpen className="h-32 w-32 text-white animate-pulse" />
          </div>
          <div className="absolute top-40 right-20 opacity-10">
            <Users className="h-24 w-24 text-white animate-bounce" />
          </div>
          <div className="absolute bottom-20 left-1/4 opacity-10">
            <Heart className="h-20 w-20 text-white animate-pulse" />
          </div>
        </div>
        
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div className="text-white space-y-6">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span>বাংলাদেশের #১ বই শেয়ারিং প্ল্যাটফর্ম</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                জ্ঞান ভাগাভাগির
                <span className="block text-green-200 bg-gradient-to-r from-green-200 to-white bg-clip-text text-transparent">নতুন মাধ্যম</span>
              </h1>
              
              <p className="text-xl text-green-100 leading-relaxed max-w-2xl">
                বই আড্ডায় আপনি বই ধার দিতে পারেন, ধার নিতে পারেন এবং দান করতে পারেন। আমাদের স্মার্ট প্ল্যাটফর্মে যোগ দিয়ে জ্ঞানের আলো ছড়িয়ে দিন সবার মধ্যে।
              </p>

              {/* Key Benefits */}
              <div className="grid grid-cols-2 gap-4 my-8">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-green-100">সম্পূর্ণ বিনামূল্যে</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-green-100">নিরাপদ ও যাচাইকৃত</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-green-100">সারাদেশে নেটওয়ার্ক</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-green-100">২৪/৭ সাপোর্ট</span>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                    <AnimatedCounter end={8500} suffix="+" />
                  </div>
                  <p className="text-green-200 text-sm">সক্রিয় সদস্য</p>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                    <AnimatedCounter end={12000} suffix="+" />
                  </div>
                  <p className="text-green-200 text-sm">বই সংগ্রহ</p>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                    <AnimatedCounter end={3200} suffix="+" />
                  </div>
                  <p className="text-green-200 text-sm">বই এক্সচেঞ্জ</p>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                    <AnimatedCounter end={45} suffix="+" />
                  </div>
                  <p className="text-green-200 text-sm">শহর</p>
                </div>
              </div>
            </div>

            {/* Right side - Auth Forms */}
            <div id="auth-form" className="lg:pl-8">
              <div className="bg-white rounded-xl shadow-2xl p-8 backdrop-blur-sm bg-white/95">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-full">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">যোগ দিন</h2>
                  <p className="text-gray-600">জ্ঞান ভাগাভাগির মাধ্যম</p>
                  <div className="flex items-center justify-center space-x-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>৮,৫০০+ সদস্য</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>১২,০০০+ বই</span>
                    </div>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex mb-6 bg-gray-100 rounded-lg p-1 relative">
                  <div 
                    className={`absolute top-1 bottom-1 w-1/2 bg-green-600 rounded-md transition-transform duration-300 ${isLogin ? 'transform translate-x-0' : 'transform translate-x-full'}`}
                  ></div>
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 px-4 text-center rounded-md transition-colors relative z-10 ${
                      isLogin
                        ? 'text-white'
                        : 'text-gray-700 hover:text-green-600'
                    }`}
                  >
                    লগইন
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 px-4 text-center rounded-md transition-colors relative z-10 ${
                      !isLogin
                        ? 'text-white'
                        : 'text-gray-700 hover:text-green-600'
                    }`}
                  >
                    নিবন্ধন
                  </button>
                </div>

                {/* Form Container */}
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

                {/* Trust Indicators */}
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
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
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              কেন বই আড্ডা বেছে নেবেন?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              বই ভাগাভাগির জন্য বাংলাদেশের সবচেয়ে নির্ভরযোগ্য এবং সুবিধাজনক প্ল্যাটফর্ম
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Share2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">বই শেয়ার করুন</h3>
              <p className="text-gray-600 leading-relaxed">
                আপনার পড়া বই অন্যদের সাথে শেয়ার করুন এবং নতুন বই আবিষ্কার করুন। সহজ এবং নিরাপদ উপায়ে বই আদান-প্রদান করুন।
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <RefreshCw className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">বই এক্সচেঞ্জ</h3>
              <p className="text-gray-600 leading-relaxed">
                আপনার বই দিয়ে অন্যের বই নিন। স্মার্ট ম্যাচিং সিস্টেমের মাধ্যমে উপযুক্ত বই খুঁজে পান।
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">বই দান করুন</h3>
              <p className="text-gray-600 leading-relaxed">
                গরীব শিক্ষার্থীদের জন্য বই দান করুন এবং জ্ঞানের আলো ছড়িয়ে দিন। সমাজের কল্যাণে অংশগ্রহণ করুন।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">কিভাবে কাজ করে</h2>
            <p className="text-xl text-gray-600">মাত্র তিনটি সহজ ধাপে শুরু করুন</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                ১
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">নিবন্ধন করুন</h3>
              <p className="text-gray-600">বিনামূল্যে অ্যাকাউন্ট তৈরি করুন এবং আপনার প্রোফাইল সম্পূর্ণ করুন</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                ২
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">বই যোগ করুন</h3>
              <p className="text-gray-600">আপনার বই তালিকায় যোগ করুন এবং অন্যদের বই ব্রাউজ করুন</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                ৩
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">আদান-প্রদান করুন</h3>
              <p className="text-gray-600">বই শেয়ার, এক্সচেঞ্জ বা দান করুন এবং জ্ঞানের বিনিময় করুন</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              সদস্যদের মতামত
            </h2>
            <p className="text-xl text-gray-600">আমাদের কমিউনিটির সদস্যরা কী বলছেন</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              name="রাহুল আহমেদ"
              location="ঢাকা, বাংলাদেশ"
              content="বই আড্ডা ব্যবহার করে আমি অনেক নতুন বই পড়তে পারেছি। খুবই সহজ এবং নিরাপদ প্ল্যাটফর্ম।"
              rating={5}
            />
            <TestimonialCard 
              name="সামিরা খান"
              location="চট্টগ্রাম, বাংলাদেশ"
              content="চমৎকার উদ্যোগ! আমার পুরানো বইগুলো অন্যদের কাজে আসছে এবং আমিও নতুন বই পাচ্ছি।"
              rating={5}
            />
            <TestimonialCard 
              name="মাহবুব হাসান"
              location="সিলেট, বাংলাদেশ"
              content="বই দান করার মাধ্যমে অনেক শিক্ষার্থীকে সাহায্য করতে পারছি। এটি সত্যিই অসাধারণ একটি প্ল্যাটফর্ম।"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">প্রায়শই জিজ্ঞাসিত প্রশ্ন</h2>
            <p className="text-xl text-gray-600">আপনার সব প্রশ্নের উত্তর এখানে</p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">বই আড্ডা কি সম্পূর্ণ বিনামূল্যে?</h3>
              <p className="text-gray-600">হ্যাঁ, বই আড্ডা সম্পূর্ণ বিনামূল্যে। নিবন্ধন, বই শেয়ার এবং এক্সচেঞ্জ সবকিছুই বিনামূল্যে।</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">কিভাবে বই এক্সচেঞ্জ করব?</h3>
              <p className="text-gray-600">আপনার পছন্দের বইটি খুঁজে নিন, এক্সচেঞ্জ রিকোয়েস্ট পাঠান এবং মালিকের সাথে যোগাযোগ করুন।</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">বই ফেরত দিতে হবে কি?</h3>
              <p className="text-gray-600">এটি বই মালিকের উপর নির্ভর করে। কেউ স্থায়ীভাবে দেয়, আবার কেউ নির্দিষ্ট সময়ের জন্য দেয়।</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">কি ধরনের বই শেয়ার করতে পারি?</h3>
              <p className="text-gray-600">যেকোনো ধরনের শিক্ষামূলক বই, উপন্যাস, গল্প, কবিতা - সব ধরনের বই শেয়ার করতে পারেন।</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-4">আপডেট পেতে থাকুন</h2>
            <p className="text-green-100 mb-8 text-lg">নতুন বই এবং বিশেষ অফারের খবর সবার আগে পান</p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="আপনার ইমেইল"
                className="flex-1 px-6 py-3 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors">
                সাবস্ক্রাইব করুন
              </button>
            </div>
            
            <p className="text-green-200 text-sm mt-4">
              আমরা আপনার ইমেইল শেয়ার করি না এবং যেকোনো সময় আনসাবস্ক্রাইব করতে পারবেন।
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-green-400 to-green-600 p-2 rounded-full">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">বই আড্ডা</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                জ্ঞান ভাগাভাগির মাধ্যমে একটি শিক্ষিত ও সচেতন সমাজ গড়ার প্ল্যাটফর্ম।
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">দ্রুত লিঙ্ক</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">সুবিধাসমূহ</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">কিভাবে কাজ করে</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">রিভিউ</a></li>
                <li><a href="#community" className="text-gray-400 hover:text-white transition-colors">কমিউনিটি</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">সাপোর্ট</h3>
              <ul className="space-y-2">
                <li><span className="text-gray-400">হেল্প সেন্টার</span></li>
                <li><span className="text-gray-400">যোগাযোগ</span></li>
                <li><span className="text-gray-400">প্রাইভেসি পলিসি</span></li>
                <li><span className="text-gray-400">নিয়মাবলী</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500">
              © ২০২৫ বই আড্ডা। সকল অধিকার সংরক্ষিত। 
              <span className="text-green-400 ml-2">♥</span> দিয়ে তৈরি বাংলাদেশে
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingWrapper;
