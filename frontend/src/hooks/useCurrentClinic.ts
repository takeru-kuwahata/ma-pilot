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
  const [clinicUuid, setClinicUuid] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // URLパラメータを最優先、次にselectedClinicId、最後にuser.clinic_id
  const clinicIdOrSlug = clinicIdParam || (user?.role === 'system_admin' ? selectedClinicId : user?.clinic_id);

  useEffect(() => {
    const fetchClinicData = async () => {
      if (!clinicIdOrSlug) {
        setClinicName('');
        setClinicUuid('');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const clinic = await clinicService.getClinic(clinicIdOrSlug);
        setClinicName(clinic.name);
        setClinicUuid(clinic.id); // UUID IDを保存
      } catch (error) {
        console.error('Failed to fetch clinic data:', error);
        setClinicName('');
        setClinicUuid('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicData();
  }, [clinicIdOrSlug]);

  return {
    clinicId: clinicUuid, // UUIDのみ返す（取得完了まで空文字列）
    clinicSlug: clinicIdOrSlug, // 元のslugまたはUUID（URL用）
    clinicName,
    isLoading,
  };
};
