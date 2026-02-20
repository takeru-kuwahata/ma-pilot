import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { clinicService } from '../services/api';

/**
 * 現在の医院情報を取得するカスタムフック
 *
 * @returns {object} 現在の医院情報
 * - clinicId: 医院ID（URLパラメータを最優先、次にselectedClinicId、最後にuser.clinic_id）
 * - clinicName: 医院名（APIから取得）
 */
export const useCurrentClinic = () => {
  const { clinicId: clinicIdParam } = useParams<{ clinicId: string }>();
  const { user, selectedClinicId } = useAuthStore();
  const [clinicName, setClinicName] = useState<string>('');

  // URLパラメータを最優先、次にselectedClinicId、最後にuser.clinic_id
  const clinicId = clinicIdParam || (user?.role === 'system_admin' ? selectedClinicId : user?.clinic_id);

  useEffect(() => {
    const fetchClinicName = async () => {
      if (!clinicId) {
        setClinicName('');
        return;
      }
      try {
        const clinic = await clinicService.getClinic(clinicId);
        setClinicName(clinic.name);
      } catch (error) {
        console.error('Failed to fetch clinic name:', error);
        setClinicName('');
      }
    };

    fetchClinicName();
  }, [clinicId]);

  return {
    clinicId,
    clinicName,
  };
};
