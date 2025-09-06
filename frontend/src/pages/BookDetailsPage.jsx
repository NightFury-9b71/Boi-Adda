import { useParams } from 'react-router-dom';
import ComingSoon from './ComingSoon';

const BookDetailsPage = () => {
  const { id } = useParams();
  return <ComingSoon title="বইয়ের বিস্তারিত" description={`বই #${id} এর বিস্তারিত তথ্য শীঘ্রই আসছে।`} />;
};

export default BookDetailsPage;
