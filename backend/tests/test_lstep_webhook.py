"""Lstep Webhook テストスクリプト"""
import httpx
import asyncio
import json


async def test_lstep_webhook():
    """Lstep Webhook エンドポイントのテスト"""

    # テストペイロード（①先生フォーム: doctor_openhouse）
    payload_doctor = {
        'form_type': 'doctor_openhouse',
        'clinic_name': 'テスト歯科クリニック',
        'full_name': 'テスト 太郎',
        'furigana': 'テスト タロウ',
        'birth_date': '1985-05-15',
        'email': 'test-doctor@example.com',
        'phone': '03-1234-5678',
        'ma_staff_name': '担当者名',
        'opening_date': '2026-06-01',
        'openhouse_start_date': '2026-05-25',
        'openhouse_end_date': '2026-05-26',
        'home_postal_code': '100-0001',
        'home_address': '東京都千代田区千代田1-1',
        'clinic_address': '東京都千代田区千代田2-2',
        'clinic_address2': 'ビル2F',
    }

    # テストペイロード（②スタッフフォーム: staff）
    payload_staff = {
        'form_type': 'staff',
        'clinic_name': 'テスト歯科クリニック',
        'clinic_location': '東京都千代田区',
        'full_name': 'テスト 花子',
        'furigana': 'テスト ハナコ',
        'email': 'test-staff@example.com',
        'job_type': '歯科衛生士',
    }

    # テストペイロード（③勤務医・開業済み・フリーランス: doctor_other）
    payload_doctor_other = {
        'form_type': 'doctor_other',
        'full_name': 'テスト 次郎',
        'furigana': 'テスト ジロウ',
        'birth_date': '1980-10-20',
        'email': 'test-doctor-other@example.com',
        'phone': '03-9876-5432',
        'clinic_name': '既存歯科医院',
        'clinic_prefecture': '東京都',
        'clinic_address': '東京都新宿区新宿1-1',
        'job_type': '勤務医',
    }

    # テストペイロード（④デンタルショー: dental_show）
    payload_dental_show = {
        'form_type': 'dental_show',
        'full_name': 'テスト 三郎',
        'furigana': 'テスト サブロウ',
        'email': '',  # emailは任意
        'phone': '090-1234-5678',
        'job_type': '歯科医師',
        'clinic_name': 'デンタルクリニック',
        'clinic_location': '大阪市北区',
    }

    base_url = 'http://localhost:8432'

    async with httpx.AsyncClient(timeout=30.0) as client:
        print('=== ①先生フォーム（doctor_openhouse）テスト ===')
        try:
            response = await client.post(
                f'{base_url}/api/webhooks/lstep',
                json=payload_doctor,
            )
            print(f'Status: {response.status_code}')
            print(f'Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}')
        except Exception as e:
            print(f'Error: {e}')

        print('\n=== ②スタッフフォーム（staff）テスト ===')
        try:
            response = await client.post(
                f'{base_url}/api/webhooks/lstep',
                json=payload_staff,
            )
            print(f'Status: {response.status_code}')
            print(f'Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}')
        except Exception as e:
            print(f'Error: {e}')

        print('\n=== ③勤務医・開業済み・フリーランス（doctor_other）テスト ===')
        try:
            response = await client.post(
                f'{base_url}/api/webhooks/lstep',
                json=payload_doctor_other,
            )
            print(f'Status: {response.status_code}')
            print(f'Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}')
        except Exception as e:
            print(f'Error: {e}')

        print('\n=== ④デンタルショー（dental_show）テスト ===')
        try:
            response = await client.post(
                f'{base_url}/api/webhooks/lstep',
                json=payload_dental_show,
            )
            print(f'Status: {response.status_code}')
            print(f'Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}')
        except Exception as e:
            print(f'Error: {e}')


if __name__ == '__main__':
    asyncio.run(test_lstep_webhook())
