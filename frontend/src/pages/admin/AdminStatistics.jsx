import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Users, 
  Book, 
  BookOpen, 
  Gift, 
  Calendar,
  PieChart,
  BarChart3,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Target,
  Award,
  Heart,
  Library,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import { apiServices } from '../../api';;

const AdminStatistics = () => {
  const [timeRange, setTimeRange] = useState('month'); // week, month, year, all
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, books, borrows, donations

  // Fetch all statistics data
  const { data: overviewStats, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['admin', 'stats', 'overview'],
    queryFn: apiServices.admin.getOverviewStats,
    staleTime: 5 * 60 * 1000,
  });

  const { data: userStats, isLoading: userLoading, refetch: refetchUserStats } = useQuery({
    queryKey: ['admin', 'stats', 'users'],
    queryFn: apiServices.admin.getUserStats,
    staleTime: 5 * 60 * 1000,
  });

  const { data: bookStats, isLoading: bookLoading, refetch: refetchBookStats } = useQuery({
    queryKey: ['admin', 'stats', 'books'],
    queryFn: apiServices.admin.getBookStats,
    staleTime: 5 * 60 * 1000,
  });

  const { data: borrowStats, isLoading: borrowLoading, refetch: refetchBorrowStats } = useQuery({
    queryKey: ['admin', 'stats', 'borrows'],
    queryFn: apiServices.admin.getBorrowStats,
    staleTime: 5 * 60 * 1000,
  });

  const { data: donationStats, isLoading: donationLoading, refetch: refetchDonationStats } = useQuery({
    queryKey: ['admin', 'stats', 'donations'],
    queryFn: apiServices.admin.getDonationStats,
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendsData, isLoading: trendsLoading, refetch: refetchTrendsData } = useQuery({
    queryKey: ['admin', 'stats', 'trends'],
    queryFn: async () => {
      const response = await apiServices.admin.getTrendsData();
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: userActivityData, isLoading: userActivityLoading, refetch: refetchUserActivityData } = useQuery({
    queryKey: ['admin', 'stats', 'user-activity'],
    queryFn: async () => {
      const response = await apiServices.admin.getUserActivityData();
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Helper function for category colors
  const getCategoryColor = (categoryName) => {
    const colors = {
      'উপন্যাস': '#8884d8',
      'ইতিহাস': '#82ca9d',
      'বিজ্ঞান': '#ffc658',
      'কবিতা': '#ff7300',
      'দর্শন': '#8dd1e1',
      'অবিন্যস্ত': '#d1d5db',
      'গল্প': '#f472b6',
      'প্রবন্ধ': '#a78bfa',
      'অভিধান': '#34d399'
    };
    return colors[categoryName] || '#9ca3af';
  };

  // Real data from API queries
  const monthlyTrendsData = trendsData?.monthly_trends || [];
  const weeklyUserActivity = userActivityData?.user_activity || [];
  const bookCategoryData = bookStats?.books?.category_distribution?.map(cat => ({
    name: cat.name,
    value: cat.value,
    color: getCategoryColor(cat.name)
  })) || [];

  const borrowStatusData = borrowStats ? [
    { name: 'ফেরত', value: borrowStats.by_status?.returned || 0, color: '#10b981' },
    { name: 'চলমান', value: borrowStats.by_status?.active || 0, color: '#f59e0b' },
    { name: 'অনুমোদিত', value: borrowStats.by_status?.approved || 0, color: '#6b7280' },
    { name: 'প্রত্যাখ্যাত', value: borrowStats.by_status?.rejected || 0, color: '#ef4444' }
  ] : [];

  const donationStatusData = donationStats ? [
    { name: 'সম্পন্ন', value: donationStats.by_status?.completed || 0, color: '#10b981' },
    { name: 'অপেক্ষমাণ', value: donationStats.by_status?.pending || 0, color: '#f59e0b' },
    { name: 'প্রত্যাখ্যাত', value: donationStats.by_status?.rejected || 0, color: '#ef4444' }
  ].filter(item => item.value > 0) : [];

  const isLoading = overviewLoading || userLoading || bookLoading || borrowLoading || donationLoading || trendsLoading || userActivityLoading;

  const handleRefreshAll = () => {
    refetchOverview();
    refetchUserStats();
    refetchBookStats();
    refetchBorrowStats();
    refetchDonationStats();
    refetchTrendsData();
    refetchUserActivityData();
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('bn-BD').format(number);
  };

  const calculateTrend = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const TrendIndicator = ({ value, isPositive = true }) => {
    const isUp = value > 0;
    const IconComponent = isUp ? ArrowUp : value < 0 ? ArrowDown : Minus;
    const colorClass = isPositive 
      ? (isUp ? 'text-green-600' : 'text-red-600')
      : (isUp ? 'text-red-600' : 'text-green-600');
    
    return (
      <div className={`flex items-center ${colorClass}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        <span className="text-xs font-medium">{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  const StatsCard = ({ title, value, icon: Icon, trend, isPositiveTrend = true, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    };

    return (
      <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
          </div>
          {trend !== undefined && (
            <TrendIndicator value={trend} isPositive={isPositiveTrend} />
          )}
        </div>
        <h3 className="text-xl lg:text-2xl font-bold text-gray-900">{formatNumber(value)}</h3>
        <p className="text-xs lg:text-sm text-gray-600 mt-1">{title}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">পরিসংখ্যান লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">পরিসংখ্যান ও বিশ্লেষণ</h1>
          <p className="text-gray-600 mt-2 text-sm lg:text-base">লাইব্রেরির সম্পূর্ণ ডেটা ড্যাশবোর্ড ও ট্রেন্ড বিশ্লেষণ</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
          >
            <option value="week">এই সপ্তাহ</option>
            <option value="month">এই মাস</option>
            <option value="year">এই বছর</option>
            <option value="all">সব সময়</option>
          </select>
          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={handleRefreshAll}
              className="flex items-center justify-center px-3 lg:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1 sm:flex-none text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
            <button className="flex items-center justify-center px-3 lg:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex-1 sm:flex-none text-sm">
              <Download className="h-4 w-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">রিপোর্ট</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {[
          { key: 'overview', label: 'সামগ্রিক', icon: BarChart3 },
          { key: 'users', label: 'ব্যবহারকারী', icon: Users },
          { key: 'books', label: 'বই', icon: Book },
          { key: 'borrows', label: 'ধার', icon: BookOpen },
          { key: 'donations', label: 'দান', icon: Gift }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center px-3 lg:px-4 py-2 rounded-md transition-colors whitespace-nowrap text-sm lg:text-base ${
                activeTab === tab.key
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatsCard
              title="মোট ব্যবহারকারী"
              value={overviewStats?.users?.total || 0}
              icon={Users}
              trend={userStats?.total_users ? ((userStats.active_users / userStats.total_users) * 100 - 50) : 0}
              color="blue"
            />
            <StatsCard
              title="মোট বই"
              value={overviewStats?.books?.total_titles || 0}
              icon={Book}
              trend={bookStats?.availability?.available_percentage ? (bookStats.availability.available_percentage - 75) : 0}
              color="green"
            />
            <StatsCard
              title="চলমান ধার"
              value={overviewStats?.borrows?.active || 0}
              icon={BookOpen}
              trend={borrowStats?.completion_rate ? (borrowStats.completion_rate - 80) : 0}
              isPositiveTrend={false}
              color="orange"
            />
            <StatsCard
              title="অপেক্ষমাণ দান"
              value={overviewStats?.donations?.pending_approval || 0}
              icon={Gift}
              trend={donationStats?.completion_rate ? (donationStats.completion_rate - 70) : 0}
              color="purple"
            />
            <StatsCard
              title="ক্ষতিগ্রস্ত বই"
              value={overviewStats?.books?.by_status?.damaged || 0}
              icon={AlertCircle}
              trend={bookStats?.copies?.by_status?.damaged ? (-(bookStats.copies.by_status.damaged / bookStats.copies.total_copies) * 100) : 0}
              color="red"
            />
            <StatsCard
              title="সক্রিয় সদস্য"
              value={overviewStats?.users?.active || 0}
              icon={Activity}
              trend={userStats?.activity_breakdown?.active_members ? ((userStats.activity_breakdown.active_members / userStats.total_users) * 100 - 70) : 0}
              color="indigo"
            />
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">মাসিক প্রবণতা</h2>
              <div className="h-64 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="borrows" stackId="1" stroke="#8884d8" fill="#8884d8" name="ধার" />
                    <Area type="monotone" dataKey="returns" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="ফেরত" />
                    <Area type="monotone" dataKey="donations" stackId="1" stroke="#ffc658" fill="#ffc658" name="দান" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Activity */}
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">সাপ্তাহিক ব্যবহারকারী কার্যকলাপ</h2>
              <div className="h-64 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyUserActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="users" fill="#10b981" name="ব্যবহারকারী" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Book Categories */}
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">বই বিভাগের বিতরণ</h2>
              <div className="h-64 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={bookCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={window.innerWidth < 768 ? 60 : 80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bookCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Borrow Status */}
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">ধার অবস্থার বিতরণ</h2>
              <div className="h-64 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={borrowStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={window.innerWidth < 768 ? 60 : 80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {borrowStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-6">কর্মক্ষমতা মেট্রিক্স</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="text-center">
                <div className="h-16 w-16 lg:h-20 lg:w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                </div>
                <h3 className="text-lg lg:text-2xl font-bold text-gray-900">
                  {borrowStats?.completion_rate ? 
                    `${Math.round(borrowStats.completion_rate)}%` : 
                    '০%'}
                </h3>
                <p className="text-xs lg:text-sm text-gray-600">ধার সফলতার হার</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 lg:h-20 lg:w-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                </div>
                <h3 className="text-lg lg:text-2xl font-bold text-gray-900">
                  {bookStats?.books?.average_copies_per_book ? 
                    `${Math.round(bookStats.books.average_copies_per_book * 10) / 10}` : 
                    '০'}
                </h3>
                <p className="text-xs lg:text-sm text-gray-600">গড় কপি প্রতি বই</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 lg:h-20 lg:w-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
                </div>
                <h3 className="text-lg lg:text-2xl font-bold text-gray-900">
                  {bookStats?.availability?.available_percentage ? 
                    `${Math.round(bookStats.availability.available_percentage)}%` : 
                    '০%'}
                </h3>
                <p className="text-xs lg:text-sm text-gray-600">বই উপলব্ধতার হার</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 lg:h-20 lg:w-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
                </div>
                <h3 className="text-lg lg:text-2xl font-bold text-gray-900">
                  {donationStats?.completion_rate ? 
                    `${Math.round(donationStats.completion_rate)}%` : 
                    '০%'}
                </h3>
                <p className="text-xs lg:text-sm text-gray-600">দান সফলতার হার</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="মোট ব্যবহারকারী"
              value={userStats?.total_users || 0}
              icon={Users}
              color="blue"
            />
            <StatsCard
              title="সক্রিয় ব্যবহারকারী"
              value={userStats?.active_users || 0}
              icon={Activity}
              color="green"
            />
            <StatsCard
              title="নিষ্ক্রিয় ব্যবহারকারী"
              value={userStats?.inactive_users || 0}
              icon={AlertCircle}
              color="red"
            />
            <StatsCard
              title="অ্যাডমিন"
              value={userStats?.by_role?.admin || 0}
              icon={Users}
              color="purple"
            />
          </div>

          {/* User Role Distribution */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">ভূমিকা অনুযায়ী বিতরণ</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm lg:text-base">সদস্য</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 lg:w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${((userStats?.by_role?.member || 0) / (userStats?.total_users || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-sm lg:text-base">{userStats?.by_role?.member || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm lg:text-base">গ্রন্থাগারিক</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 lg:w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${((userStats?.by_role?.librarian || 0) / (userStats?.total_users || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-sm lg:text-base">{userStats?.by_role?.librarian || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm lg:text-base">অ্যাডমিন</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 lg:w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${((userStats?.by_role?.admin || 0) / (userStats?.total_users || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-sm lg:text-base">{userStats?.by_role?.admin || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">সক্রিয়তার অবস্থা</h2>
              <div className="h-48 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'সক্রিয়', value: userStats?.active_users || 0, color: '#10b981' },
                        { name: 'নিষ্ক্রিয়', value: userStats?.inactive_users || 0, color: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={window.innerWidth < 768 ? 60 : 80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'সক্রিয়', value: userStats?.active_users || 0, color: '#10b981' },
                        { name: 'নিষ্ক্রিয়', value: userStats?.inactive_users || 0, color: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Books Tab */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          {/* Book Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="মোট বইয়ের শিরোনাম"
              value={bookStats?.books?.total_titles || 0}
              icon={Book}
              color="blue"
            />
            <StatsCard
              title="মোট কপি"
              value={bookStats?.copies?.total_copies || 0}
              icon={Library}
              color="green"
            />
            <StatsCard
              title="উপলব্ধ কপি"
              value={bookStats?.copies?.by_status?.available || 0}
              icon={CheckCircle}
              color="purple"
            />
            <StatsCard
              title="ধার দেওয়া কপি"
              value={bookStats?.copies?.by_status?.borrowed || 0}
              icon={BookOpen}
              color="orange"
            />
          </div>

          {/* Book Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">বিভাগ অনুযায়ী বিতরণ</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={bookCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {bookCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Copy Status Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">কপি অবস্থার বিতরণ</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'উপলব্ধ', value: bookStats?.copies?.by_status?.available || 0, color: '#10b981' },
                  { name: 'ধার দেওয়া', value: bookStats?.copies?.by_status?.borrowed || 0, color: '#f59e0b' },
                  { name: 'সংরক্ষিত', value: bookStats?.copies?.by_status?.reserved || 0, color: '#6b7280' },
                  { name: 'ক্ষতিগ্রস্ত', value: bookStats?.copies?.by_status?.damaged || 0, color: '#ef4444' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Book Metrics */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">বই মেট্রিক্স</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Book className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {bookStats?.books?.average_copies_per_book ? 
                    `${Math.round(bookStats.books.average_copies_per_book * 10) / 10}` : 
                    '০'}
                </h3>
                <p className="text-sm text-gray-600">গড় কপি প্রতি বই</p>
              </div>
              <div className="text-center">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {bookStats?.availability?.available_percentage ? 
                    `${Math.round(bookStats.availability.available_percentage)}%` : 
                    '০%'}
                </h3>
                <p className="text-sm text-gray-600">উপলব্ধতার হার</p>
              </div>
              <div className="text-center">
                <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {bookStats?.availability?.borrowed_percentage ? 
                    `${Math.round(bookStats.availability.borrowed_percentage)}%` : 
                    '০%'}
                </h3>
                <p className="text-sm text-gray-600">ধার দেওয়ার হার</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Borrows Tab */}
      {activeTab === 'borrows' && (
        <div className="space-y-6">
          {/* Borrow Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatsCard
              title="মোট ধার"
              value={borrowStats?.total_borrows || 0}
              icon={BookOpen}
              color="blue"
            />
            <StatsCard
              title="অপেক্ষমাণ"
              value={borrowStats?.by_status?.pending || 0}
              icon={Clock}
              color="orange"
            />
            <StatsCard
              title="অনুমোদিত"
              value={borrowStats?.by_status?.approved || 0}
              icon={CheckCircle}
              color="green"
            />
            <StatsCard
              title="চলমান"
              value={borrowStats?.by_status?.active || 0}
              icon={Activity}
              color="purple"
            />
            <StatsCard
              title="ফেরত"
              value={borrowStats?.by_status?.returned || 0}
              icon={CheckCircle}
              color="indigo"
            />
          </div>

          {/* Borrow Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ধার অবস্থার বিতরণ</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={borrowStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {borrowStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Status Bar Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ধার পরিসংখ্যান</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'অপেক্ষমাণ', value: borrowStats?.by_status?.pending || 0 },
                  { name: 'অনুমোদিত', value: borrowStats?.by_status?.approved || 0 },
                  { name: 'চলমান', value: borrowStats?.by_status?.active || 0 },
                  { name: 'ফেরত', value: borrowStats?.by_status?.returned || 0 },
                  { name: 'প্রত্যাখ্যাত', value: borrowStats?.by_status?.rejected || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Workflow Metrics */}
          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-6">ওয়ার্কফ্লো মেট্রিক্স</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              <div className="text-center">
                <div className="h-16 w-16 lg:h-20 lg:w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                </div>
                <h3 className="text-lg lg:text-2xl font-bold text-gray-900">
                  {borrowStats?.completion_rate ? 
                    `${Math.round(borrowStats.completion_rate)}%` : 
                    '০%'}
                </h3>
                <p className="text-xs lg:text-sm text-gray-600">সফলতার হার</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 lg:h-20 lg:w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
                </div>
                <h3 className="text-lg lg:text-2xl font-bold text-gray-900">
                  {borrowStats?.rejection_rate ? 
                    `${Math.round(borrowStats.rejection_rate)}%` : 
                    '০%'}
                </h3>
                <p className="text-xs lg:text-sm text-gray-600">প্রত্যাখ্যানের হার</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 lg:h-20 lg:w-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
                </div>
                <h3 className="text-lg lg:text-2xl font-bold text-gray-900">
                  {borrowStats?.by_status?.pending || 0}
                </h3>
                <p className="text-xs lg:text-sm text-gray-600">অপেক্ষমাণ কর্ম</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Donations Tab */}
      {activeTab === 'donations' && (
        <div className="space-y-6">
          {/* Donation Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="মোট দান"
              value={donationStats?.total_donations || 0}
              icon={Heart}
              color="rose"
            />
            <StatsCard
              title="অপেক্ষমাণ"
              value={donationStats?.by_status?.pending || 0}
              icon={Clock}
              color="orange"
            />
            <StatsCard
              title="সম্পন্ন"
              value={donationStats?.by_status?.completed || 0}
              icon={CheckCircle}
              color="green"
            />
            <StatsCard
              title="প্রত্যাখ্যাত"
              value={donationStats?.by_status?.rejected || 0}
              icon={XCircle}
              color="red"
            />
          </div>

          {/* Donation Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">দান অবস্থার বিতরণ</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={donationStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {donationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Donation Trends */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">দান পরিসংখ্যান</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'অপেক্ষমাণ', value: donationStats?.by_status?.pending || 0 },
                  { name: 'সম্পন্ন', value: donationStats?.by_status?.completed || 0 },
                  { name: 'প্রত্যাখ্যাত', value: donationStats?.by_status?.rejected || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Impact Metrics */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">প্রভাব মেট্রিক্স</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {donationStats?.completion_rate ? 
                    `${Math.round(donationStats.completion_rate)}%` : 
                    '০%'}
                </h3>
                <p className="text-sm text-gray-600">সফলতার হার</p>
              </div>
              <div className="text-center">
                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {donationStats?.unique_donors || 0}
                </h3>
                <p className="text-sm text-gray-600">অনন্য দাতা</p>
              </div>
              <div className="text-center">
                <div className="h-20 w-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-8 w-8 text-rose-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {donationStats?.books_received || 0}
                </h3>
                <p className="text-sm text-gray-600">গৃহীত বই</p>
              </div>
            </div>
          </div>

          {/* Recent Contributions */}
          {donationStats?.recent_donations && donationStats.recent_donations.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">সাম্প্রতিক অবদান</h2>
              <div className="space-y-3">
                {donationStats.recent_donations.slice(0, 5).map((donation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-rose-100 rounded-full flex items-center justify-center">
                        <Heart className="h-5 w-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{donation.donor_name || 'অজ্ঞাত দাতা'}</p>
                        <p className="text-sm text-gray-600">{donation.book_title || 'বই'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        donation.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {donation.status === 'completed' ? 'সম্পন্ন' :
                         donation.status === 'pending' ? 'অপেক্ষমাণ' : 'প্রত্যাখ্যাত'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStatistics;
