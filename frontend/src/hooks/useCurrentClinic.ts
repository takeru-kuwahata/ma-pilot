import { useAuthStore } from '../stores/authStore';

/**
 * 現在の医院情報を取得するカスタムフック
 *
 * @returns {object} 現在の医院情報
 * - clinicId: 医院ID（system_adminの場合は選択中のクリニックID、一般スタッフは所属クリニックID）
 * - clinicName: 医院名（現在は固定値、将来的にはAPIから取得）
 */
export const useCurrentClinic = () => {
  const { user, selectedClinicId } = useAuthStore();

  // system_adminの場合は選択中のクリニックIDを使用
  // 一般スタッフの場合は所属クリニックIDを使用
  const clinicId = user?.role === 'system_admin'
    ? selectedClinicId
    : user?.clinic_id;

  // TODO: 将来的にはAPIからクリニック名を取得
  // 現在は固定値「さくら歯科クリニック」を返す
  const clinicName = 'さくら歯科クリニック';

  return {
    clinicId,
    clinicName,
  };
};
