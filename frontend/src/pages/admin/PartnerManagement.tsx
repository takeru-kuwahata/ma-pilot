import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, FormControlLabel,
  Switch, Alert, CircularProgress, Accordion, AccordionSummary, AccordionDetails,
  Select, MenuItem, InputLabel, FormControl, OutlinedInput,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { API_BASE_URL, getAuthHeaders } from '../../services/api/config';

const PROBLEM_TAGS = [
  '集患_Web', '集患_MEO', '集患_SNS',
  '自費_カウンセリング', '自費_メニュー設計',
  'コスト_材料費', 'コスト_固定費',
  'スタッフ研修', 'リコール_システム', '予約_自動化',
  '人材育成', '増患', '収益増加', '診療業務サポート',
  '福利厚生', 'サービス代行', '節税/助成金/保険',
];

interface Company {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  display_priority: number;
  is_active: boolean;
  partner_services?: Service[];
}

interface Service {
  id: string;
  company_id: string;
  service_name: string;
  catchcopy?: string;
  description?: string;
  price_range?: string;
  service_url?: string;
  coupon_code?: string;
  coupon_detail?: string;
  apply_method?: string;
  display_priority: number;
  is_active: boolean;
  service_problem_tags?: { problem_tag: string }[];
}

const defaultService: Omit<Service, 'id'> = {
  company_id: '',
  service_name: '',
  catchcopy: '',
  description: '',
  price_range: '',
  service_url: '',
  coupon_code: '',
  coupon_detail: '',
  apply_method: '',
  display_priority: 0,
  is_active: true,
};

export const PartnerManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 企業編集ダイアログ
  const [companyDialog, setCompanyDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Partial<Company>>({});

  // サービス編集ダイアログ
  const [serviceDialog, setServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> & { problem_tags?: string[] }>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [targetCompanyId, setTargetCompanyId] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/partners/admin/companies`, { headers: getAuthHeaders() });
      const json = await res.json();
      setCompanies(json.data || []);
    } catch {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const openNewCompany = () => {
    setEditingCompany({ name: '', description: '', display_priority: 0, is_active: true });
    setCompanyDialog(true);
  };

  const saveCompany = async () => {
    try {
      const isNew = !editingCompany.id;
      const url = isNew
        ? `${API_BASE_URL}/api/partners/admin/companies`
        : `${API_BASE_URL}/api/partners/admin/companies/${editingCompany.id}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingCompany),
      });
      if (!res.ok) throw new Error('保存失敗');
      setSuccess(isNew ? '企業を登録しました' : '企業情報を更新しました');
      setCompanyDialog(false);
      fetchCompanies();
    } catch {
      setError('保存に失敗しました');
    }
  };

  const openNewService = (companyId: string) => {
    setTargetCompanyId(companyId);
    setEditingService({ ...defaultService, company_id: companyId });
    setSelectedTags([]);
    setServiceDialog(true);
  };

  const openEditService = (svc: Service) => {
    setTargetCompanyId(svc.company_id);
    setEditingService(svc);
    setSelectedTags((svc.service_problem_tags || []).map((t) => t.problem_tag));
    setServiceDialog(true);
  };

  const saveService = async () => {
    try {
      const payload = { ...editingService, company_id: targetCompanyId, problem_tags: selectedTags };
      const isNew = !editingService.id;
      const url = isNew
        ? `${API_BASE_URL}/api/partners/admin/services`
        : `${API_BASE_URL}/api/partners/admin/services/${editingService.id}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('保存失敗');
      setSuccess(isNew ? 'サービスを登録しました' : 'サービスを更新しました');
      setServiceDialog(false);
      fetchCompanies();
    } catch {
      setError('保存に失敗しました');
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!window.confirm('このサービスを削除しますか？')) return;
    try {
      await fetch(`${API_BASE_URL}/api/partners/admin/services/${serviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setSuccess('サービスを削除しました');
      fetchCompanies();
    } catch {
      setError('削除に失敗しました');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 500 }}>パートナー企業・サービス管理</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNewCompany}>
          企業を追加
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        companies.map((company) => (
          <Accordion key={company.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Typography sx={{ fontWeight: 600, flex: 1 }}>{company.name}</Typography>
                <Chip
                  label={`${(company.partner_services || []).length}サービス`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  variant="outlined"
                  onClick={() => openNewService(company.id)}
                >
                  サービスを追加
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>サービス名</TableCell>
                      <TableCell>価格帯</TableCell>
                      <TableCell>課題タグ</TableCell>
                      <TableCell>優先度</TableCell>
                      <TableCell>状態</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(company.partner_services || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            サービスがまだ登録されていません
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (company.partner_services || []).map((svc) => (
                        <TableRow key={svc.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{svc.service_name}</Typography>
                            {svc.catchcopy && (
                              <Typography variant="caption" color="text.secondary">{svc.catchcopy}</Typography>
                            )}
                          </TableCell>
                          <TableCell>{svc.price_range || '-'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {(svc.service_problem_tags || []).map((t) => (
                                <Chip key={t.problem_tag} label={t.problem_tag} size="small" />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>{svc.display_priority}</TableCell>
                          <TableCell>
                            <Chip
                              label={svc.is_active ? '有効' : '無効'}
                              size="small"
                              color={svc.is_active ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => openEditService(svc)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => deleteService(svc.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* 企業編集ダイアログ */}
      <Dialog open={companyDialog} onClose={() => setCompanyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCompany.id ? '企業情報を編集' : '企業を追加'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="企業名 *"
            value={editingCompany.name || ''}
            onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
            fullWidth size="small"
          />
          <TextField
            label="企業紹介文"
            value={editingCompany.description || ''}
            onChange={(e) => setEditingCompany({ ...editingCompany, description: e.target.value })}
            fullWidth size="small" multiline rows={3}
          />
          <TextField
            label="表示優先度（大きいほど上位）"
            type="number"
            value={editingCompany.display_priority ?? 0}
            onChange={(e) => setEditingCompany({ ...editingCompany, display_priority: Number(e.target.value) })}
            fullWidth size="small"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingCompany.is_active ?? true}
                onChange={(e) => setEditingCompany({ ...editingCompany, is_active: e.target.checked })}
              />
            }
            label="有効"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompanyDialog(false)}>キャンセル</Button>
          <Button variant="contained" onClick={saveCompany} disabled={!editingCompany.name}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* サービス編集ダイアログ */}
      <Dialog open={serviceDialog} onClose={() => setServiceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingService.id ? 'サービスを編集' : 'サービスを追加'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="サービス名 *"
            value={editingService.service_name || ''}
            onChange={(e) => setEditingService({ ...editingService, service_name: e.target.value })}
            fullWidth size="small"
          />
          <TextField
            label="キャッチコピー（30文字以内）"
            value={editingService.catchcopy || ''}
            onChange={(e) => setEditingService({ ...editingService, catchcopy: e.target.value })}
            fullWidth size="small" inputProps={{ maxLength: 30 }}
          />
          <TextField
            label="サービス紹介文"
            value={editingService.description || ''}
            onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
            fullWidth size="small" multiline rows={3}
          />
          <TextField
            label="価格帯（例: 月額3万円〜）"
            value={editingService.price_range || ''}
            onChange={(e) => setEditingService({ ...editingService, price_range: e.target.value })}
            fullWidth size="small"
          />
          <TextField
            label="サービスURL"
            value={editingService.service_url || ''}
            onChange={(e) => setEditingService({ ...editingService, service_url: e.target.value })}
            fullWidth size="small"
          />
          <TextField
            label="クーポンコード"
            value={editingService.coupon_code || ''}
            onChange={(e) => setEditingService({ ...editingService, coupon_code: e.target.value })}
            fullWidth size="small"
          />
          <TextField
            label="申し込み方法"
            value={editingService.apply_method || ''}
            onChange={(e) => setEditingService({ ...editingService, apply_method: e.target.value })}
            fullWidth size="small" multiline rows={2}
          />

          {/* 課題タグ */}
          <FormControl fullWidth size="small">
            <InputLabel>課題タグ（複数選択可）</InputLabel>
            <Select
              multiple
              value={selectedTags}
              onChange={(e) => setSelectedTags(e.target.value as string[])}
              input={<OutlinedInput label="課題タグ（複数選択可）" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((v) => <Chip key={v} label={v} size="small" />)}
                </Box>
              )}
            >
              {PROBLEM_TAGS.map((tag) => (
                <MenuItem key={tag} value={tag}>{tag}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="表示優先度（大きいほど上位）"
            type="number"
            value={editingService.display_priority ?? 0}
            onChange={(e) => setEditingService({ ...editingService, display_priority: Number(e.target.value) })}
            fullWidth size="small"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingService.is_active ?? true}
                onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
              />
            }
            label="有効"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDialog(false)}>キャンセル</Button>
          <Button variant="contained" onClick={saveService}
            disabled={!editingService.service_name || selectedTags.length === 0}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
