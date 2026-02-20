import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { clinicService } from '../services/api';

/**
 * 現在の医院情報を取得するカスタムフック
 *
 * @returns {object} 現在の医院情報
 * - clinicId: 医院ID（system_adminの場合は選択中のクリニックID、一般スタッフは所属クリニックID）
 * - clinicName: 医院名（APIから取得）
 */
export const useCurrentClinic = () => {
  const { user, selectedClinicId } = useAuthStore();
  const [clinicName, setClinicName] = useState<string>('');

  // system_adminの場合は選択中のクリニックIDを使用
  // 一般スタッフの場合は所属クリニックIDを使用
  const clinicId = user?.role === 'system_admin'
    ? selectedClinicId
    : user?.clinic_id;

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
