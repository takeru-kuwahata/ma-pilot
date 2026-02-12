import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useEffect } from 'react';

/**
 * system_admin用のクリニック選択ラッパー
 * 医院モード時にクリニックIDを管理
 *
 * 注意: 現在の要件では「さくら歯科クリニック」固定表示のため、
 * このコンポーネントは将来的なクリニック選択機能実装時に使用する予定
 */
export const AdminModeWrapper = () => {
  const { user, selectedClinicId, setSelectedClinic } = useAuthStore();

  useEffect(() => {
    // system_adminが医院モードに入った場合の初期化処理
    // 現在は「さくら歯科クリニック」のIDを固定で設定
    // TODO: 将来的にはクリニック選択UIを実装し、ユーザーが選択したクリニックIDを設定
    if (user?.role === 'system_admin' && !selectedClinicId) {
      // さくら歯科クリニックのIDを設定（仮のID、実際のIDは要確認）
      setSelectedClinic('clinic-sakura-001'); // TODO: 実際のクリニックIDに置き換え
    }
  }, [user, selectedClinicId, setSelectedClinic]);

  return <Outlet />;
};
