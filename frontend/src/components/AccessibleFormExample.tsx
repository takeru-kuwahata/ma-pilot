/**
 * アクセシブルフォームの実装例
 *
 * このコンポーネントは、アクセシビリティのベストプラクティスを示すリファレンス実装です。
 * 新しいフォームを作成する際の参考にしてください。
 *
 * 主な機能:
 * - 適切なARIA属性
 * - キーボードナビゲーション
 * - スクリーンリーダー対応
 * - エラーハンドリング
 * - フォーカス管理
 */

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormHelperText,
  Typography,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { announceSuccess, announceError } from '@/utils/announcer';

interface FormData {
  email: string;
  password: string;
  clinicName: string;
}

/**
 * アクセシブルフォームコンポーネント
 */
export const AccessibleFormExample = () => {
  const { t } = useTranslation();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
      clinicName: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // フォーム送信処理（実際のAPI呼び出しをここに実装）
      // 成功時の処理をここに実装
      void data; // データを使用する予定

      // 成功メッセージをスクリーンリーダーに通知
      announceSuccess(t('common.success'));
      setSubmitStatus('success');
    } catch (error) {
      // エラーメッセージをスクリーンリーダーに通知
      announceError(t('common.error'));
      setSubmitStatus('error');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ maxWidth: 500, mx: 'auto', p: 3 }}
    >
      {/* フォームタイトル - h1でページの主要な見出しとする */}
      <Typography
        variant="h1"
        component="h1"
        gutterBottom
        sx={{ fontSize: '2rem', fontWeight: 600 }}
      >
        {t('auth.login_title')}
      </Typography>

      {/* 説明文 */}
      <Typography
        variant="body2"
        color="text.secondary"
        id="form-description"
        sx={{ mb: 3 }}
      >
        以下のフォームに必要事項を入力してください。
      </Typography>

      {/* 成功メッセージ - role="status"でスクリーンリーダーに通知 */}
      {submitStatus === 'success' && (
        <Alert
          severity="success"
          role="status"
          aria-live="polite"
          sx={{ mb: 2 }}
        >
          {t('common.success')}
        </Alert>
      )}

      {/* エラーメッセージ - role="alert"で即座にスクリーンリーダーに通知 */}
      {submitStatus === 'error' && (
        <Alert
          severity="error"
          role="alert"
          aria-live="assertive"
          sx={{ mb: 2 }}
        >
          {t('common.error')}
        </Alert>
      )}

      {/* メールアドレス入力 */}
      <Controller
        name="email"
        control={control}
        rules={{
          required: t('validation.required', { field: t('auth.email') }),
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: t('validation.email_invalid'),
          },
        }}
        render={({ field }) => (
          <Box sx={{ mb: 3 }}>
            <TextField
              {...field}
              fullWidth
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              // アクセシビリティ属性
              required
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : 'email-help'}
              // フォーカス時の視覚的フィードバック
              error={!!errors.email}
            />

            {/* ヘルプテキスト */}
            {!errors.email && (
              <FormHelperText id="email-help">
                登録されたメールアドレスを入力してください
              </FormHelperText>
            )}

            {/* エラーメッセージ - role="alert"で即座に通知 */}
            {errors.email && (
              <FormHelperText
                id="email-error"
                error
                role="alert"
                aria-live="assertive"
              >
                {errors.email.message}
              </FormHelperText>
            )}
          </Box>
        )}
      />

      {/* パスワード入力 */}
      <Controller
        name="password"
        control={control}
        rules={{
          required: t('validation.required', { field: t('auth.password') }),
          minLength: {
            value: 8,
            message: t('validation.min_length', {
              field: t('auth.password'),
              min: 8,
            }),
          },
        }}
        render={({ field }) => (
          <Box sx={{ mb: 3 }}>
            <TextField
              {...field}
              fullWidth
              label={t('auth.password')}
              type="password"
              autoComplete="current-password"
              // アクセシビリティ属性
              required
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : 'password-help'}
              error={!!errors.password}
            />

            {/* ヘルプテキスト */}
            {!errors.password && (
              <FormHelperText id="password-help">
                8文字以上のパスワードを入力してください
              </FormHelperText>
            )}

            {/* エラーメッセージ */}
            {errors.password && (
              <FormHelperText
                id="password-error"
                error
                role="alert"
                aria-live="assertive"
              >
                {errors.password.message}
              </FormHelperText>
            )}
          </Box>
        )}
      />

      {/* 医院名入力 */}
      <Controller
        name="clinicName"
        control={control}
        rules={{
          required: t('validation.required', { field: t('clinic.name') }),
        }}
        render={({ field }) => (
          <Box sx={{ mb: 3 }}>
            <TextField
              {...field}
              fullWidth
              label={t('clinic.name')}
              type="text"
              autoComplete="organization"
              // アクセシビリティ属性
              required
              aria-required="true"
              aria-invalid={!!errors.clinicName}
              aria-describedby={errors.clinicName ? 'clinic-name-error' : undefined}
              error={!!errors.clinicName}
            />

            {/* エラーメッセージ */}
            {errors.clinicName && (
              <FormHelperText
                id="clinic-name-error"
                error
                role="alert"
                aria-live="assertive"
              >
                {errors.clinicName.message}
              </FormHelperText>
            )}
          </Box>
        )}
      />

      {/* 送信ボタン */}
      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={isSubmitting}
        // アクセシビリティ属性
        aria-label={isSubmitting ? '送信中...' : t('common.submit')}
        aria-disabled={isSubmitting}
        // ローディング状態を通知
        aria-busy={isSubmitting}
      >
        {isSubmitting ? '送信中...' : t('common.submit')}
      </Button>

      {/* ローディング状態をスクリーンリーダーに通知 */}
      {isSubmitting && (
        <Box
          role="status"
          aria-live="polite"
          sx={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          フォームを送信しています。しばらくお待ちください。
        </Box>
      )}
    </Box>
  );
};

export default AccessibleFormExample;
