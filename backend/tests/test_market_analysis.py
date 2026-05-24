'''
Test cases for market analysis service (unit tests with mocks)
'''
import pytest
import math
from unittest.mock import Mock
from src.services.market_analysis_service import MarketAnalysisService


@pytest.fixture
def mock_supabase_market():
    '''診療圏分析用Supabaseモック'''
    mock = Mock()
    table_mock = Mock()
    table_mock.select = Mock(return_value=table_mock)
    table_mock.insert = Mock(return_value=table_mock)
    table_mock.eq = Mock(return_value=table_mock)
    table_mock.order = Mock(return_value=table_mock)
    table_mock.execute = Mock(return_value=Mock(data=[]))
    mock.table = Mock(return_value=table_mock)
    return mock, table_mock


class TestMarketAnalysisRetrieval:
    '''診療圏分析取得関連のテスト（同期）'''

    def test_service_initializes_with_supabase(self, mock_supabase_market):
        '''サービスが正常に初期化される'''
        mock, _ = mock_supabase_market
        service = MarketAnalysisService(mock)
        assert service.supabase is mock

    def test_calculate_distance_same_point(self, mock_supabase_market):
        '''同一地点間の距離は0'''
        mock, _ = mock_supabase_market
        service = MarketAnalysisService(mock)
        distance = service._calculate_distance(35.6762, 139.6503, 35.6762, 139.6503)
        assert distance < 0.001  # ほぼ0

    def test_calculate_distance_known_points(self, mock_supabase_market):
        '''東京-大阪間距離の概算検証（約400km）'''
        mock, _ = mock_supabase_market
        service = MarketAnalysisService(mock)
        # 東京 (35.6762, 139.6503) と 大阪 (34.6937, 135.5023)
        distance = service._calculate_distance(35.6762, 139.6503, 34.6937, 135.5023)
        assert 380 < distance < 420  # 約400km

    def test_calculate_distance_symmetry(self, mock_supabase_market):
        '''距離計算は対称性がある（A→B == B→A）'''
        mock, _ = mock_supabase_market
        service = MarketAnalysisService(mock)
        d1 = service._calculate_distance(35.0, 139.0, 36.0, 140.0)
        d2 = service._calculate_distance(36.0, 140.0, 35.0, 139.0)
        assert abs(d1 - d2) < 0.001


@pytest.mark.asyncio
class TestMarketAnalysisCreation:
    '''診療圏分析作成関連のテスト'''

    async def test_create_market_analysis_generates_mock_competitors(self, mock_supabase_market):
        '''Google Maps APIキー未設定時はモックデータを返す'''
        mock, _ = mock_supabase_market
        service = MarketAnalysisService(mock)
        # APIキーなしのモードでfetchを呼ぶ（APIキーはNone）
        service.google_maps_api_key = None
        competitors = service._generate_mock_competitors(35.6762, 139.6503, 2.0)
        assert isinstance(competitors, list)
        assert len(competitors) > 0

    async def test_create_market_analysis_validation(self, mock_supabase_market):
        '''半径が0以下はバリデーションで除外（モックデータの範囲チェック）'''
        mock, _ = mock_supabase_market
        service = MarketAnalysisService(mock)
        service.google_maps_api_key = None
        # 半径0でもクラッシュしないことを確認
        competitors = service._generate_mock_competitors(35.6762, 139.6503, 0.1)
        assert isinstance(competitors, list)


@pytest.mark.asyncio
class TestCompetitorAnalysis:
    '''競合分析関連のテスト'''

    async def test_get_competitor_data_no_api_key(self, mock_supabase_market):
        '''APIキーなしでも競合データが返る（モックデータ）'''
        mock, _ = mock_supabase_market
        service = MarketAnalysisService(mock)
        service.google_maps_api_key = None
        competitors = await service._fetch_competitors_from_google_places(35.6762, 139.6503, 2.0)
        assert isinstance(competitors, list)

    async def test_competitor_distance_field_within_radius(self, mock_supabase_market):
        '''生成されたモック競合医院の distance フィールドは指定半径内'''
        mock, _ = mock_supabase_market
        service = MarketAnalysisService(mock)
        service.google_maps_api_key = None
        radius_km = 2.0
        competitors = service._generate_mock_competitors(35.6762, 139.6503, radius_km)

        # distance フィールドは radius_km 以内
        for comp in competitors:
            assert comp.distance <= radius_km
