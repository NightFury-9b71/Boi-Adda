import { useParams } from 'react-router-dom';
import ComingSoon from '../../components/ComingSoon';

const UserProfilePage = () => {
  const { userId } = useParams();
  return <ComingSoon title="ব্যবহারকারীর প্রোফাইল" description={`ব্যবহারকারী #${userId} এর প্রোফাইল শীঘ্রই আসছে।`} />;
};

export default UserProfilePage;
