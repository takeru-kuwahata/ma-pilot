import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ClinicRedirectProps {
  to: string;
}

/**
 * 旧URL（/clinic/dashboard）から新URL（/clinic/:clinicId/dashboard）へのリダイレクト
 * system_adminはselectedClinicId、一般ユーザーはclinic_idを使用
 */
export const ClinicRedirect = ({ to }: ClinicRedirectProps) => {
  const { user, selectedClinicId } = useAuthStore();

  const clinicId = user?.role === 'system_admin'
    ? selectedClinicId || user?.clinic_id
    : user?.clinic_id;

  if (!clinicId) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/clinic/${clinicId}${to}`} replace />;
};
