import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants';

export default function Index() {
  // 使用 Navigate 組件直接重定向，而不是 useNavigate hook
  return <Navigate to={ROUTES.PRAYERS} replace />;
}
