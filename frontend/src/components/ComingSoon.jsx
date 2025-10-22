import { Clock, Construction } from 'lucide-react';

const ComingSoon = ({ 
  title = "শীঘ্রই আসছে", 
  description = "এই বৈশিষ্ট্যটি বর্তমানে উন্নয়নাধীন এবং শীঘ্রই উপলব্ধ হবে।",
  showBackButton = false 
}) => {
  return (
    <div className="flex items-center justify-center min-h-96 p-8">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto h-24 w-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <Construction className="h-12 w-12 text-green-600" />
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3">{title}</h2>

        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full border border-green-200 shadow-sm mb-6">
          <Clock className="h-5 w-5 mr-2 animate-pulse" />
          <span className="font-medium">শীঘ্রই আসছে</span>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 max-w-xs mx-auto">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>ডেভেলপমেন্ট প্রগ্রেস</span>
            <span>চলমান</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full animate-pulse" style={{width: '65%'}}></div>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-4">
          আমরা আপনার জন্য এই বৈশিষ্ট্যটি নিয়ে আসতে কঠোর পরিশ্রম করছি। অপেক্ষায় থাকুন!
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
