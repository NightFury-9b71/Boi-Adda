import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ArrowLeft, 
  BookOpen, 
  Search,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-6xl font-bold text-gray-800 mb-2">৪০৪</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">পৃষ্ঠা পাওয়া যায়নি</h2>
        </div>

        {/* Description */}
        <div className="mb-8">
          <p className="text-gray-600 text-lg mb-4">
            দুঃখিত! আপনি যে পৃষ্ঠাটি খুঁজছেন তা আমরা খুঁজে পাইনি।
          </p>
          <p className="text-gray-500">
            হয়তো লিংকটি ভুল বা পৃষ্ঠাটি অন্য কোথাও সরিয়ে নেওয়া হয়েছে।
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                ড্যাশবোর্ডে ফিরুন
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                হোমে ফিরুন
              </Link>
            )}
            
            <button
              onClick={goBack}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              ফিরে যান
            </button>
          </div>

          {/* Secondary Actions */}
          {isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/books"
                className="inline-flex items-center justify-center px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                বই লাইব্রেরি
              </Link>
              
              <Link
                to="/search"
                className="inline-flex items-center justify-center px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Search className="w-4 h-4 mr-2" />
                অনুসন্ধান
              </Link>
            </div>
          )}
        </div>

        {/* Fun Message */}
        <div className="mt-12 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            হারিয়ে গেছেন? চিন্তা নেই!
          </h3>
          <p className="text-gray-600 text-sm">
            বই আড্ডায় আরও অনেক আকর্ষণীয় বই ও তথ্য আছে। 
            <br />
            নতুন কিছু আবিষ্কার করুন!
          </p>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            যদি আপনি মনে করেন এটি একটি ত্রুটি, তাহলে অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
