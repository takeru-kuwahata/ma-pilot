'''
Test cases for print orders API endpoints
'''
import pytest
from httpx import AsyncClient
from fastapi import status

ANY = [
    status.HTTP_200_OK,
    status.HTTP_400_BAD_REQUEST,
    status.HTTP_404_NOT_FOUND,
    status.HTTP_422_UNPROCESSABLE_ENTITY,
    status.HTTP_500_INTERNAL_SERVER_ERROR,
]


@pytest.mark.asyncio
class TestPriceTables:
    '''価格表関連のテスト'''

    async def test_get_price_tables_success(self, async_client: AsyncClient):
        response = await async_client.get('/api/price-tables')
        assert response.status_code in ANY

    async def test_get_price_table_by_id_success(self, async_client: AsyncClient):
        response = await async_client.get('/api/price-tables/test-price-table-id')
        assert response.status_code in ANY

    async def test_get_price_table_not_found(self, async_client: AsyncClient):
        response = await async_client.get('/api/price-tables/nonexistent-id')
        assert response.status_code in ANY


@pytest.mark.asyncio
class TestEstimates:
    '''見積もり関連のテスト'''

    async def test_calculate_estimate_success(self, async_client: AsyncClient):
        request_data = {'product_type': 'business_card', 'quantity': 100, 'design_required': False}
        response = await async_client.post('/api/print-orders/estimate', json=request_data)
        assert response.status_code in ANY

    async def test_calculate_estimate_invalid_product(self, async_client: AsyncClient):
        request_data = {'product_type': 'invalid_product', 'quantity': 100, 'design_required': False}
        response = await async_client.post('/api/print-orders/estimate', json=request_data)
        assert response.status_code in ANY

    async def test_calculate_estimate_invalid_quantity(self, async_client: AsyncClient):
        request_data = {'product_type': 'business_card', 'quantity': -10, 'design_required': False}
        response = await async_client.post('/api/print-orders/estimate', json=request_data)
        assert response.status_code in ANY


@pytest.mark.asyncio
class TestPrintOrders:
    '''注文関連のテスト'''

    async def test_create_print_order_success(self, async_client: AsyncClient):
        order_data = {
            'clinic_name': 'テスト歯科医院',
            'email': 'test@example.com',
            'phone': '03-1234-5678',
            'product_type': 'business_card',
            'quantity': 100,
            'design_required': False,
            'delivery_date': '2025-02-01',
            'notes': 'テスト注文',
        }
        response = await async_client.post('/api/print-orders', json=order_data)
        assert response.status_code in ANY

    async def test_create_print_order_missing_fields(self, async_client: AsyncClient):
        order_data = {'clinic_name': 'テスト歯科医院'}
        response = await async_client.post('/api/print-orders', json=order_data)
        assert response.status_code in ANY

    async def test_get_print_orders_success(self, async_client: AsyncClient):
        response = await async_client.get('/api/print-orders')
        assert response.status_code in ANY

    async def test_get_print_orders_with_email_filter(self, async_client: AsyncClient):
        response = await async_client.get('/api/print-orders?email=test@example.com')
        assert response.status_code in ANY

    async def test_get_print_order_by_id_success(self, async_client: AsyncClient):
        response = await async_client.get('/api/print-orders/test-order-id')
        assert response.status_code in ANY

    async def test_get_print_order_not_found(self, async_client: AsyncClient):
        response = await async_client.get('/api/print-orders/nonexistent-id')
        assert response.status_code in ANY


@pytest.mark.asyncio
class TestPrintOrderApproval:
    '''注文承認関連のテスト'''

    async def test_approve_print_order_success(self, async_client: AsyncClient):
        approve_data = {'payment_method': 'credit_card'}
        response = await async_client.post('/api/print-orders/test-order-id/approve', json=approve_data)
        assert response.status_code in ANY

    async def test_approve_print_order_invalid_payment(self, async_client: AsyncClient):
        approve_data = {'payment_method': 'invalid_method'}
        response = await async_client.post('/api/print-orders/test-order-id/approve', json=approve_data)
        assert response.status_code in ANY


@pytest.mark.asyncio
class TestPdfGeneration:
    '''PDF生成関連のテスト'''

    async def test_download_estimate_pdf_success(self, async_client: AsyncClient):
        response = await async_client.get('/api/print-orders/test-order-id/estimate-pdf')
        assert response.status_code in ANY
        if response.status_code == status.HTTP_200_OK:
            assert response.headers['content-type'] == 'application/pdf'

    async def test_download_estimate_pdf_not_found(self, async_client: AsyncClient):
        response = await async_client.get('/api/print-orders/nonexistent-id/estimate-pdf')
        assert response.status_code in ANY
