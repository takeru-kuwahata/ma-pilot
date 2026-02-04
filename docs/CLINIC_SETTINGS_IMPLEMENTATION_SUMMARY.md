# 医院設定ページ保存機能実装サマリー

**実装日**: 2026-02-04
**ファイル**: `/frontend/src/pages/ClinicSettings.tsx`

## 実装内容

### 1. 追加したimport

```typescript
import { useState, useEffect } from 'react';
import { Snackbar, Alert, CircularProgress } from '@mui/material';
import { clinicService, authService } from '../services/api';
```

### 2. 新しいState管理

```typescript
const [loading, setLoading] = useState(false);           // 保存処理中のローディング状態
const [loadingData, setLoadingData] = useState(true);    // データ読み込み中のローディング状態
const [snackbar, setSnackbar] = useState<SnackbarState>({
  open: false,
  message: '',
  severity: 'success'
});
```

### 3. データ取得処理（useEffect）

ページ読み込み時に以下を実行:

```typescript
useEffect(() => {
  const loadClinicData = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.clinic_id) {
        // エラー処理
        return;
      }

      const clinic = await clinicService.getClinic(user.clinic_id);

      // 基本情報をstateにセット
      setBasicInfo({
        name: clinic.name || '',
        postalCode: clinic.postalCode || '',
        address: clinic.address || '',
        phone: clinic.phoneNumber || '',
        // 以下は現在DBに存在しないため空文字
        ownerName: '',
        foundedDate: '',
        departments: '',
        businessHours: '',
      });

      setLoadingData(false);
    } catch (error) {
      // エラー処理
    }
  };

  loadClinicData();
}, []);
```

### 4. 基本情報保存処理（handleSaveBasicInfo）

```typescript
const handleSaveBasicInfo = async () => {
  try {
    setLoading(true);
    const user = authService.getCurrentUser();

    await clinicService.updateClinic(user.clinic_id, {
      name: basicInfo.name,
      postalCode: basicInfo.postalCode,
      address: basicInfo.address,
      phoneNumber: basicInfo.phone,
    });

    setSnackbar({
      open: true,
      message: '基本情報を保存しました',
      severity: 'success'
    });
  } catch (error) {
    setSnackbar({
      open: true,
      message: '保存に失敗しました。もう一度お試しください。',
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};
```

### 5. 経営情報保存処理（handleSaveBusinessInfo）

```typescript
const handleSaveBusinessInfo = async () => {
  try {
    setLoading(true);
    setSnackbar({
      open: true,
      message: '経営情報の保存機能は開発中です',
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};
```

**注記**: 経営情報（ユニット数、歯科医師数など）は現在のDBスキーマに存在しないため、保存機能は未実装。

### 6. UI更新

- **ローディング表示**: データ読み込み中はCircularProgressを表示
- **保存ボタン**: loading状態でdisabled、アイコンを動的に切り替え
- **Snackbar**: 成功/失敗メッセージをページ下部中央に表示

## 実装の制約事項

### データベーススキーマの制限

現在のSupabase `clinics`テーブルは以下のフィールドのみ:

```sql
CREATE TABLE clinics (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  address TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  owner_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**存在しないフィールド**:
- `owner_name` (オーナー名)
- `founded_date` (開業年月)
- `departments` (診療科目)
- `business_hours` (営業時間)
- `chairs` (ユニット数)
- `dentists` (常勤歯科医師数)
- `hygienists` (常勤歯科衛生士数)
- `part_time_staff` (非常勤スタッフ数)

### 現在の動作

1. **基本情報セクション**
   - `name`, `postalCode`, `address`, `phone` → **保存可能**
   - `ownerName`, `foundedDate`, `departments`, `businessHours` → **UIのみ（保存不可）**

2. **経営情報セクション**
   - `chairs`, `dentists`, `hygienists`, `partTimeStaff` → **UIのみ（保存不可）**

## ビルド結果

```bash
✓ tsc (TypeScriptエラー0件)
✓ vite build (ビルド成功)
```

## 次のステップ（将来の拡張）

もし全フィールドを保存可能にする場合:

### 1. データベーススキーマの拡張

```sql
ALTER TABLE clinics
ADD COLUMN owner_name TEXT,
ADD COLUMN founded_date TEXT,
ADD COLUMN departments TEXT,
ADD COLUMN business_hours TEXT,
ADD COLUMN chairs INTEGER DEFAULT 0,
ADD COLUMN dentists INTEGER DEFAULT 0,
ADD COLUMN hygienists INTEGER DEFAULT 0,
ADD COLUMN part_time_staff INTEGER DEFAULT 0;
```

### 2. バックエンドモデルの更新

`backend/src/models/clinic.py`:

```python
class Clinic(BaseModel):
    # 既存フィールド...
    owner_name: Optional[str] = None
    founded_date: Optional[str] = None
    departments: Optional[str] = None
    business_hours: Optional[str] = None
    chairs: Optional[int] = None
    dentists: Optional[int] = None
    hygienists: Optional[int] = None
    part_time_staff: Optional[int] = None

class ClinicUpdate(BaseModel):
    # 既存フィールド...
    owner_name: Optional[str] = None
    founded_date: Optional[str] = None
    departments: Optional[str] = None
    business_hours: Optional[str] = None
    chairs: Optional[int] = None
    dentists: Optional[int] = None
    hygienists: Optional[int] = None
    part_time_staff: Optional[int] = None
```

### 3. フロントエンドの更新

`handleSaveBasicInfo()` に追加:

```typescript
await clinicService.updateClinic(user.clinic_id, {
  name: basicInfo.name,
  postalCode: basicInfo.postalCode,
  address: basicInfo.address,
  phoneNumber: basicInfo.phone,
  ownerName: basicInfo.ownerName,
  foundedDate: basicInfo.foundedDate,
  departments: basicInfo.departments,
  businessHours: basicInfo.businessHours,
});
```

`handleSaveBusinessInfo()` の実装:

```typescript
await clinicService.updateClinic(user.clinic_id, {
  chairs: businessInfo.chairs,
  dentists: businessInfo.dentists,
  hygienists: businessInfo.hygienists,
  partTimeStaff: businessInfo.partTimeStaff,
});
```

## テスト方法

1. フロントエンド起動: `npm run dev` (ポート3247)
2. バックエンド起動: `uvicorn main:app --port 8432`
3. ログイン: `kuwahata@idw-japan.net` / `advance2026`
4. 左メニュー「医院設定」クリック
5. 基本情報を編集
6. 「保存する」ボタンクリック
7. 「基本情報を保存しました」メッセージ確認
8. ページリロード → データが保持されていることを確認

## 関連ファイル

- **フロントエンド**: `/frontend/src/pages/ClinicSettings.tsx`
- **APIサービス**: `/frontend/src/services/api/clinicService.ts`
- **バックエンドAPI**: `/backend/src/api/clinics.py`
- **バックエンドモデル**: `/backend/src/models/clinic.py`
- **データベーススキーマ**: `/backend/supabase_schema.sql`
