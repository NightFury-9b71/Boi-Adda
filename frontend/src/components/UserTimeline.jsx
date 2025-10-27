import { Calendar, CheckCircle, XCircle, Clock, BookOpen, RotateCcw, Award } from 'lucide-react';

const UserTimeline = ({ userId, userName, activities }) => {
  const getActivityIcon = (type, status) => {
    switch (type) {
      case 'borrow':
        switch (status) {
          case 'pending': return Clock;
          case 'approved': return CheckCircle;
          case 'collected': return BookOpen;
          case 'return_requested': return RotateCcw;
          case 'completed': return Award;
          case 'rejected': return XCircle;
          default: return Clock;
        }
      case 'donation':
        switch (status) {
          case 'pending': return Clock;
          case 'approved': return CheckCircle;
          case 'completed': return Award;
          case 'rejected': return XCircle;
          default: return Clock;
        }
      default: return Clock;
    }
  };

  const getActivityColor = (type, status) => {
    switch (type) {
      case 'borrow':
        switch (status) {
          case 'pending': return 'text-yellow-600 bg-yellow-100';
          case 'approved': return 'text-blue-600 bg-blue-100';
          case 'collected': return 'text-green-600 bg-green-100';
          case 'return_requested': return 'text-purple-600 bg-purple-100';
          case 'completed': return 'text-gray-600 bg-gray-100';
          case 'rejected': return 'text-red-600 bg-red-100';
          default: return 'text-gray-600 bg-gray-100';
        }
      case 'donation':
        switch (status) {
          case 'pending': return 'text-yellow-600 bg-yellow-100';
          case 'approved': return 'text-blue-600 bg-blue-100';
          case 'completed': return 'text-green-600 bg-green-100';
          case 'rejected': return 'text-red-600 bg-red-100';
          default: return 'text-gray-600 bg-gray-100';
        }
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityLabel = (type, status) => {
    const labels = {
      borrow: {
        pending: 'ধারের অনুরোধ করা হয়েছে',
        approved: 'ধারের অনুরোধ অনুমোদিত',
        collected: 'বই সংগৃহীত',
        return_requested: 'ফেরত দেওয়ার অনুরোধ',
        completed: 'বই ফেরত দেওয়া হয়েছে',
        rejected: 'ধারের অনুরোধ প্রত্যাখ্যাত'
      },
      donation: {
        pending: 'দানের অনুরোধ করা হয়েছে',
        approved: 'দানের অনুরোধ অনুমোদিত',
        completed: 'দান সম্পন্ন',
        rejected: 'দানের অনুরোধ প্রত্যাখ্যাত'
      }
    };
    return labels[type]?.[status] || 'অজানা অবস্থা';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'তারিখ নেই';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'তারিখ নেই';

      const locale = 'bn-BD';
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Asia/Dhaka'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'তারিখ নেই';
    }
  };

  // Sort activities by date (newest first)
  const sortedActivities = [...activities].sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
          {userName?.charAt(0) || 'U'}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{userName || 'অজানা ব্যবহারকারী'}</h3>
          <p className="text-sm text-gray-600">ইউজার ID: #{userId}</p>
        </div>
      </div>

      <div className="space-y-3">
        {sortedActivities.length > 0 ? (
          sortedActivities.map((activity, index) => {
            const IconComponent = getActivityIcon(activity.type, activity.status);
            const colorClass = getActivityColor(activity.type, activity.status);

            return (
              <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-start space-x-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {getActivityLabel(activity.type, activity.status)}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.bookTitle && `${activity.bookTitle}`}
                    {activity.bookTitle && activity.bookAuthor && ' - '}
                    {activity.bookAuthor && `${activity.bookAuthor}`}
                  </p>
                  {activity.notes && (
                    <p className="text-xs text-gray-500 mt-1">{activity.notes}</p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">কোন কার্যক্রম পাওয়া যায়নি</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTimeline;