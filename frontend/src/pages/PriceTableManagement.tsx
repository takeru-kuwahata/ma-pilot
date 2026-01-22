import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import type { PriceTable, CsvImportResult } from '../types';

interface PriceTableCsvRow {
  product_type: string;
  quantity: string;
  price: string;
  design_fee: string;
  design_fee_included: string;
  specifications: string;
  delivery_days: string;
}

export default function PriceTableManagement() {
  const [priceTables, setPriceTables] = useState<PriceTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // 価格マスタ一覧取得
  const fetchPriceTables = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('price_tables')
        .select('*')
        .order('product_type', { ascending: true })
        .order('quantity', { ascending: true });

      if (error) throw error;
      setPriceTables(data || []);
    } catch (error) {
      console.error('価格マスタ取得エラー:', error);
      setSnackbarMessage('価格マスタの取得に失敗しました');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // CSV仕様パース（JSON文字列を仕様オブジェクトに変換）
  const parseSpecifications = (specsString: string): string => {
    if (!specsString || specsString.trim() === '') return '{}';

    try {
      // すでにJSON形式の場合はそのまま返す
      JSON.parse(specsString);
      return specsString;
    } catch {
      // JSON形式でない場合は、空オブジェクトを返す
      return '{}';
    }
  };

  // CSV行のバリデーション
  const validateCsvRow = (row: PriceTableCsvRow, rowIndex: number): string | null => {
    if (!row.product_type || row.product_type.trim() === '') {
      return `${rowIndex + 1}行目: 商品種類が空です`;
    }
    if (!row.quantity || isNaN(Number(row.quantity))) {
      return `${rowIndex + 1}行目: 数量が不正です`;
    }
    if (!row.price || isNaN(Number(row.price))) {
      return `${rowIndex + 1}行目: 価格が不正です`;
    }
    if (!row.design_fee || isNaN(Number(row.design_fee))) {
      return `${rowIndex + 1}行目: デザイン費が不正です`;
    }
    if (!row.design_fee_included || !['true', 'false'].includes(row.design_fee_included.toLowerCase())) {
      return `${rowIndex + 1}行目: デザイン費込みフラグが不正です（true/falseのみ）`;
    }
    if (!row.delivery_days || isNaN(Number(row.delivery_days))) {
      return `${rowIndex + 1}行目: 納期日数が不正です`;
    }
    return null;
  };

  // CSVファイルアップロード処理
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setImportResult(null);

    Papa.parse<PriceTableCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const errors: Array<{ row: number; error: string }> = [];
        const validRows: Array<Omit<PriceTable, 'id' | 'created_at' | 'updated_at'>> = [];

        // バリデーション
        results.data.forEach((row, index) => {
          const error = validateCsvRow(row, index);
          if (error) {
            errors.push({ row: index + 1, error });
          } else {
            validRows.push({
              product_type: row.product_type.trim(),
              quantity: Number(row.quantity),
              price: Number(row.price),
              design_fee: Number(row.design_fee),
              design_fee_included: row.design_fee_included.toLowerCase() === 'true',
              specifications: parseSpecifications(row.specifications),
              delivery_days: Number(row.delivery_days),
            });
          }
        });

        // Supabaseに一括挿入
        let successCount = 0;
        if (validRows.length > 0) {
          try {
            const { error } = await supabase.from('price_tables').insert(validRows);

            if (error) {
              console.error('価格マスタ挿入エラー:', error);
              errors.push({ row: 0, error: `データベース挿入エラー: ${error.message}` });
            } else {
              successCount = validRows.length;
            }
          } catch (error) {
            console.error('価格マスタ挿入エラー:', error);
            errors.push({ row: 0, error: 'データベース挿入中にエラーが発生しました' });
          }
        }

        setImportResult({
          success: successCount,
          failed: errors.length,
          errors,
        });

        setUploading(false);

        // 成功した場合は価格マスタ一覧を再取得
        if (successCount > 0) {
          await fetchPriceTables();
          setSnackbarMessage(`${successCount}件の価格マスタを登録しました`);
          setSnackbarOpen(true);
        }
      },
      error: (error) => {
        console.error('CSVパースエラー:', error);
        setImportResult({
          success: 0,
          failed: 1,
          errors: [{ row: 0, error: `CSVファイルの読み込みに失敗しました: ${error.message}` }],
        });
        setUploading(false);
      },
    });
  };

  // CSV形式サンプルダウンロード
  const handleDownloadTemplate = () => {
    const csvContent = `product_type,quantity,price,design_fee,design_fee_included,specifications,delivery_days
診察券,500,19500,0,true,"{""corner_radius"": ""角丸なし"", ""coating"": ""なし""}",14
診察券,1000,25500,0,true,"{""corner_radius"": ""角丸なし"", ""coating"": ""なし""}",14
名刺,100,2500,4500,false,"{""coating"": ""なし""}",10
名刺,200,4000,4500,false,"{""coating"": ""なし""}",10`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'price_table_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            価格マスタ管理
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
            >
              CSVテンプレート
            </Button>
            <Button
              variant="contained"
              component="label"
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
              disabled={uploading}
            >
              CSVアップロード
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
            <Button
              variant="outlined"
              onClick={fetchPriceTables}
              disabled={loading}
            >
              再読み込み
            </Button>
          </Box>
        </Box>

        {/* CSV取込結果 */}
        {importResult && (
          <Box mb={3}>
            <Alert severity={importResult.failed === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
              成功: {importResult.success}件 / 失敗: {importResult.failed}件
            </Alert>
            {importResult.errors.length > 0 && (
              <Alert severity="error">
                <Typography variant="subtitle2" gutterBottom>
                  エラー詳細:
                </Typography>
                {importResult.errors.map((err, index) => (
                  <Typography key={index} variant="body2">
                    {err.error}
                  </Typography>
                ))}
              </Alert>
            )}
          </Box>
        )}

        {/* 価格マスタ一覧テーブル */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>商品種類</TableCell>
                  <TableCell align="right">数量</TableCell>
                  <TableCell align="right">価格</TableCell>
                  <TableCell align="right">デザイン費</TableCell>
                  <TableCell>デザイン費込み</TableCell>
                  <TableCell>仕様</TableCell>
                  <TableCell align="right">納期（日数）</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceTables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        価格マスタが登録されていません。CSVファイルをアップロードしてください。
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  priceTables.map((priceTable) => (
                    <TableRow key={priceTable.id}>
                      <TableCell>{priceTable.product_type}</TableCell>
                      <TableCell align="right">{priceTable.quantity.toLocaleString()}</TableCell>
                      <TableCell align="right">¥{priceTable.price.toLocaleString()}</TableCell>
                      <TableCell align="right">¥{priceTable.design_fee.toLocaleString()}</TableCell>
                      <TableCell>{priceTable.design_fee_included ? '込み' : '別途'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {priceTable.specifications || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{priceTable.delivery_days}日</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* スナックバー */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
}
