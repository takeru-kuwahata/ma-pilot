'''
Test cases for report service (unit tests with mocks)
'''
import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from src.services.report_service import ReportService


SAMPLE_REPORT_DB_ROW = {
    'id': 'report-uuid-001',
    'clinic_id': 'clinic-uuid-001',
    'type': 'monthly',
    'format': 'pdf',
    'title': '2025年3月 月次レポート',
    'generated_at': datetime(2025, 3, 31).isoformat(),
    'file_url': 'https://storage.example.com/reports/clinic-uuid-001/monthly_abc.pdf',
    'created_at': datetime(2025, 3, 31),
}


@pytest.fixture
def mock_supabase_reports():
    '''レポート用Supabaseモック'''
    mock = Mock()
    table_mock = Mock()
    table_mock.select = Mock(return_value=table_mock)
    table_mock.insert = Mock(return_value=table_mock)
    table_mock.delete = Mock(return_value=table_mock)
    table_mock.eq = Mock(return_value=table_mock)
    table_mock.single = Mock(return_value=table_mock)
    table_mock.order = Mock(return_value=table_mock)
    table_mock.execute = Mock(return_value=Mock(data=[SAMPLE_REPORT_DB_ROW]))
    mock.table = Mock(return_value=table_mock)

    # Storage モック
    storage_mock = Mock()
    bucket_mock = Mock()
    bucket_mock.upload = Mock(return_value={'data': {'path': 'test.pdf'}})
    bucket_mock.get_public_url = Mock(return_value='https://storage.example.com/reports/test.pdf')
    storage_mock.from_ = Mock(return_value=bucket_mock)
    mock.storage = storage_mock

    return mock, table_mock


@pytest.mark.asyncio
class TestReportRetrieval:
    '''レポート取得関連のテスト'''

    async def test_get_reports_success(self, mock_supabase_reports):
        '''レポート一覧取得成功'''
        mock, _ = mock_supabase_reports
        service = ReportService(mock)
        reports = await service.get_reports('clinic-uuid-001')

        assert len(reports) == 1
        assert reports[0].clinic_id == 'clinic-uuid-001'

    async def test_get_report(self, mock_supabase_reports):
        '''個別レポート取得成功'''
        mock, table_mock = mock_supabase_reports
        table_mock.execute.return_value = Mock(data=SAMPLE_REPORT_DB_ROW)
        service = ReportService(mock)
        report = await service.get_report('report-uuid-001')

        assert report.id == 'report-uuid-001'
        assert report.type == 'monthly'

    async def test_get_report_not_found(self, mock_supabase_reports):
        '''存在しないレポートはValueError'''
        mock, table_mock = mock_supabase_reports
        table_mock.execute.return_value = Mock(data=None)
        service = ReportService(mock)

        with pytest.raises(ValueError):
            await service.get_report('nonexistent-id')


@pytest.mark.asyncio
class TestReportGeneration:
    '''レポート生成関連のテスト'''

    async def test_generate_report_invalid_type_rejected_by_model(self, mock_supabase_reports):
        '''未対応のレポートタイプはPydanticがValidationErrorを発生させる'''
        from src.models.report import ReportGenerateRequest
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            ReportGenerateRequest(
                clinic_id='clinic-uuid-001',
                type='invalid_type',
                format='pdf',
                title='テストレポート',
            )


@pytest.mark.asyncio
class TestReportDownload:
    '''レポートダウンロード関連のテスト'''

    async def test_download_report_not_found(self, mock_supabase_reports):
        '''存在しないレポートのダウンロードはValueError'''
        mock, table_mock = mock_supabase_reports
        table_mock.execute.return_value = Mock(data=None)
        service = ReportService(mock)

        with pytest.raises(ValueError):
            await service.get_report('nonexistent-id')

    async def test_download_report_pdf_url_present(self, mock_supabase_reports):
        '''レポートにfile_urlが含まれる'''
        mock, table_mock = mock_supabase_reports
        table_mock.execute.return_value = Mock(data=SAMPLE_REPORT_DB_ROW)
        service = ReportService(mock)
        report = await service.get_report('report-uuid-001')

        assert report.file_url is not None
        assert 'http' in report.file_url
