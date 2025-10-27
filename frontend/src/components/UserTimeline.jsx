import { Calendar, CheckCircle, XCircle, Clock, BookOpen, RotateCcw, Award } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';

const UserTimeline = ({ userId, userName, activities }) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
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
    return t(`history.timeline.${type}.${status}`) || t('common.unknown');
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.unknown');
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('common.unknown');

      const locale = language === 'bn' ? 'bn-BD' : 'en-US';
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
      return t('common.unknown');
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
          <h3 className="text-lg font-semibold text-gray-900">{userName || t('common.unknown')}</h3>
          <p className="text-sm text-gray-600">{t('admin.userManagement.userId')}: #{userId}</p>
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
            <p className="text-gray-500">{t('table.noData')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTimeline;