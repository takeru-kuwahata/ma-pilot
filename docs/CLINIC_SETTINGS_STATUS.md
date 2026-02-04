# 医院設定ページ実装状況

**最終更新**: 2026-02-04

## 📊 実装状況サマリー

| 機能 | UI | バックエンド | 実装状態 |
|------|----|-----------|------------|
| ページ表示 | ✅ | ✅ | 完了 |
| 基本情報入力フォーム | ✅ | ✅ | 完了 |
| 経営情報入力フォーム | ✅ | ✅ | 完了 |
| データ取得 | ❌ | ✅ | **未接続** |
| データ保存 | ❌ | ✅ | **未接続** |

---

## 🐛 問題: 保存ボタンが動作しない

### 現象
- 「保存する」ボタンをクリックしても何も起きない
- データが保存されない
- エラーメッセージも表示されない

### 原因（ClinicSettings.tsx:44-50）

**基本情報の保存ボタン**:
```typescript
const handleSaveBasicInfo = () => {
  // TODO: Phase 4でAPI呼び出し実装
};
```

**経営情報の保存ボタン**:
```typescript
const handleSaveBusinessInfo = () => {
  // TODO: Phase 4でAPI呼び出し実装
};
```

**完全に未実装**: 空の関数（TODOコメントのみ）

---

## ✅ バックエンドAPI実装状況

### 実装済みエンドポイント（clinics.py）

| エンドポイント | メソッド | 機能 | 実装状態 |
|-------------|---------|------|---------|
| `/api/clinics/{clinic_id}` | GET | 医院情報取得 | ✅ 実装済み |
| `/api/clinics/{clinic_id}` | PUT | 医院情報更新 | ✅ 実装済み |

### バックエンドコード（clinics.py:15-39）

```python
@router.get('/{clinic_id}', response_model=ClinicResponse)
async def get_clinic(
    clinic_id: str,
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Get clinic by ID'''
    try:
        clinic = await clinic_service.get_clinic(clinic_id)
        return ClinicResponse(data=clinic)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put('/{clinic_id}', response_model=ClinicResponse)
async def update_clinic(
    clinic_id: str,
    request: ClinicUpdate,
    clinic_service: ClinicService = Depends(get_clinic_service)
):
    '''Update clinic'''
    try:
        clinic = await clinic_service.update_clinic(clinic_id, request)
        return ClinicResponse(data=clinic, message='Clinic updated successfully')
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

**結論**: バックエンドAPIは完全に実装済み。フロントエンドのUI接続のみ未実装。

---

## ✅ データ構造（Pydanticモデル）

### ClinicUpdate（更新リクエスト）

```python
class ClinicUpdate(BaseModel):
    name: Optional[str] = None
    postal_code: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    owner_name: Optional[str] = None
    founded_date: Optional[str] = None
    departments: Optional[str] = None
    business_hours: Optional[str] = None
    chairs: Optional[int] = None
    dentists: Optional[int] = None
    hygienists: Optional[int] = None
    part_time_staff: Optional[int] = None
```

**全フィールドOptional**: 部分更新が可能

---

## 🔧 必要な実装

### 1. clinicService.ts の確認・実装

**必要なメソッド**:
```typescript
export const clinicService = {
  async getClinic(clinicId: string): Promise<Clinic> {
    const response = await fetch(`${API_BASE_URL}/api/clinics/${clinicId}`, {
      headers: getAuthHeaders()
    });
    const result = await handleResponse<ClinicResponse>(response);
    return result.data;
  },

  async updateClinic(clinicId: string, data: ClinicUpdate): Promise<Clinic> {
    const response = await fetch(`${API_BASE_URL}/api/clinics/${clinicId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const result = await handleResponse<ClinicResponse>(response);
    return result.data;
  }
};
```

### 2. ClinicSettings.tsx の修正

**データ取得（useEffect）**:
```typescript
import { useEffect } from 'react';
import { clinicService, authService } from '../services/api';

useEffect(() => {
  const loadClinicData = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.clinicId) return;

      const clinic = await clinicService.getClinic(user.clinicId);

      setBasicInfo({
        name: clinic.name || '',
        postalCode: clinic.postalCode || '',
        address: clinic.address || '',
        phone: clinic.phone || '',
        ownerName: clinic.ownerName || '',
        foundedDate: clinic.foundedDate || '',
        departments: clinic.departments || '',
        businessHours: clinic.businessHours || '',
      });

      setBusinessInfo({
        chairs: clinic.chairs || 0,
        dentists: clinic.dentists || 0,
        hygienists: clinic.hygienists || 0,
        partTimeStaff: clinic.partTimeStaff || 0,
      });
    } catch (error) {
      console.error('Failed to load clinic data:', error);
    }
  };

  loadClinicData();
}, []);
```

**保存処理（handleSaveBasicInfo）**:
```typescript
import { useState } from 'react';
import { Snackbar, Alert, CircularProgress } from '@mui/material';

const [loading, setLoading] = useState(false);
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState('');
const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

const handleSaveBasicInfo = async () => {
  try {
    setLoading(true);
    const user = authService.getCurrentUser();
    if (!user?.clinicId) {
      setSnackbarMessage('ユーザー情報が取得できませんでした');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    await clinicService.updateClinic(user.clinicId, {
      name: basicInfo.name,
      postal_code: basicInfo.postalCode,
      address: basicInfo.address,
      phone: basicInfo.phone,
      owner_name: basicInfo.ownerName,
      founded_date: basicInfo.foundedDate,
      departments: basicInfo.departments,
      business_hours: basicInfo.businessHours,
    });

    setSnackbarMessage('基本情報を保存しました');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  } catch (error) {
    console.error('Failed to save basic info:', error);
    setSnackbarMessage('保存に失敗しました。もう一度お試しください。');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  } finally {
    setLoading(false);
  }
};

const handleSaveBusinessInfo = async () => {
  try {
    setLoading(true);
    const user = authService.getCurrentUser();
    if (!user?.clinicId) {
      setSnackbarMessage('ユーザー情報が取得できませんでした');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    await clinicService.updateClinic(user.clinicId, {
      chairs: businessInfo.chairs,
      dentists: businessInfo.dentists,
      hygienists: businessInfo.hygienists,
      part_time_staff: businessInfo.partTimeStaff,
    });

    setSnackbarMessage('経営情報を保存しました');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  } catch (error) {
    console.error('Failed to save business info:', error);
    setSnackbarMessage('保存に失敗しました。もう一度お試しください。');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  } finally {
    setLoading(false);
  }
};
```

**ボタンの修正**:
```typescript
<Button
  variant="contained"
  onClick={handleSaveBasicInfo}
  disabled={loading}
  sx={{ backgroundColor: '#FF6B35', color: '#ffffff', '&:hover': { backgroundColor: '#E55A2B' } }}
  startIcon={loading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : <SaveIcon />}
>
  {loading ? '保存中...' : '保存する'}
</Button>
```

**Snackbar追加**:
```typescript
<Snackbar
  open={snackbarOpen}
  autoHideDuration={6000}
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert
    onClose={() => setSnackbarOpen(false)}
    severity={snackbarSeverity}
    sx={{ width: '100%' }}
  >
    {snackbarMessage}
  </Alert>
</Snackbar>
```

---

## 🎯 修正優先度

### 🔴 優先度: 高（クライアントテスト前に必要）

**医院設定の保存機能実装**
- **工数**: 0.5-1日
- **実装内容**:
  1. clinicService.ts にメソッド追加（存在しない場合）
  2. ClinicSettings.tsx にデータ取得処理追加（useEffect）
  3. handleSaveBasicInfo() 実装
  4. handleSaveBusinessInfo() 実装
  5. エラーハンドリング（Toast通知）
  6. ローディング状態管理

**理由**: 医院設定は基本機能であり、クライアントが最初に設定する重要な情報

---

## 📝 クライアント向け説明

### 現状
「医院設定ページは表示されますが、以下の問題があります：

1. **保存ボタンが動作しない**
   - フロントエンド実装が未完了（TODOコメント）
   - バックエンドAPIは実装済み

2. **データが読み込まれない**
   - データ取得処理が未実装
   - デフォルト値（さくら歯科クリニック）が表示される

### クライアントのタスク
- **なし**（開発者側の実装不足）

### 開発者のタスク
1. 医院設定の保存・読み込み機能実装（0.5-1日）

---

## 検証結果（チェックリスト 4.1）

| # | 項目 | 手順 | 期待結果 | 結果 | 備考 |
|---|------|------|----------|------|------|
| 4.1.1 | ページ表示 | 左メニュー「医院設定」クリック | ページが表示される | [✅] | UI完成 |
| 4.1.2 | 基本情報表示 | 基本情報フォーム確認 | フィールドが表示される | [✅] | デフォルト値表示 |
| 4.1.3 | 経営情報表示 | 経営情報フォーム確認 | フィールドが表示される | [✅] | デフォルト値表示 |
| 4.1.4 | データ読み込み | ページ読み込み時 | DBからデータ取得 | [❌] | **未実装**（TODO） |
| 4.1.5 | 基本情報保存 | 「保存する」ボタンクリック | 成功メッセージ表示 | [❌] | **未実装**（TODO） |
| 4.1.6 | 経営情報保存 | 「保存する」ボタンクリック | 成功メッセージ表示 | [❌] | **未実装**（TODO） |
| 4.1.7 | バリデーション | 必須項目空欄で保存 | エラーメッセージ | [❌] | **未実装** |

**結論**: ページUIは完成しているが、データの読み込み・保存機能が未実装。バックエンドAPIは実装済みのため、フロントエンド接続のみで完成。クライアントテスト前に修正必須。
