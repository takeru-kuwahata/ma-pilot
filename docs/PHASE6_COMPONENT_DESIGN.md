# Phase 6: ヒアリングシート機能 - コンポーネント設計書

**作成日**: 2025-12-26
**バージョン**: 1.0
**技術スタック**: React 18, TypeScript 5, MUI v6

---

## 1. コンポーネント一覧

| No | コンポーネント名 | 種類 | 用途 | 配置場所 |
|----|----------------|------|------|---------|
| 1 | HearingForm.tsx | ページ | ヒアリングフォームページ | `frontend/src/pages/` |
| 2 | HearingResult.tsx | ページ | ヒアリング結果表示ページ | `frontend/src/pages/` |
| 3 | CompanyManagement.tsx | ページ | 企業管理ページ（管理者専用） | `frontend/src/pages/admin/` |
| 4 | HearingFormSections.tsx | コンポーネント | フォームセクション（section1-3） | `frontend/src/components/hearing/` |
| 5 | AIAnalysisCard.tsx | コンポーネント | AI分析結果表示カード | `frontend/src/components/hearing/` |
| 6 | CompanyRecommendation.tsx | コンポーネント | 企業レコメンドカード | `frontend/src/components/hearing/` |
| 7 | Dashboard.tsx（改修） | ページ | タブUI追加（ヒアリング分析タブ） | `frontend/src/pages/` |

---

## 2. コンポーネント詳細設計

### 2.1 HearingForm.tsx

**種類**: ページコンポーネント

**ルート**: `/hearing`

**権限**: `clinic_owner`, `clinic_editor`

**責務**:
- PDFベースの質問フォームを表示
- ユーザー入力をバリデーション
- ヒアリング回答をAPIに送信
- Lstep ID連携時の自動認証

**Props**:
```typescript
interface HearingFormProps {
  // URLパラメータから取得
  lstepId?: string;
}
```

**State管理**:
```typescript
interface HearingFormState {
  formData: HearingFormData;
  isSubmitting: boolean;
  submitError: string | null;
}
```

**使用するMUIコンポーネント**:
- `Container`, `Paper`, `Typography`, `Stepper`, `Step`, `StepLabel`
- `TextField`, `Checkbox`, `FormControlLabel`, `RadioGroup`, `Radio`
- `Button`, `CircularProgress`, `Alert`

**API呼び出し**:
- `POST /api/hearings` - ヒアリング回答保存

**バリデーションルール**:
- section1.monthlyRevenue: 0以上の数値、必須
- section1.staffCount: 0以上の整数、必須
- section1.patientCount: 0以上の整数、必須
- section1.unitCount: 0以上の整数、必須
- section2.challenges: 1つ以上選択、必須
- section2.priorities: 1つ以上選択、必須
- section3.goals: 1つ以上選択、必須
- section3.timeline: 必須

**画面構成**:
```tsx
<Container>
  <Typography variant="h4">ヒアリングフォーム</Typography>

  {/* ステッパー（3ステップ） */}
  <Stepper activeStep={activeStep}>
    <Step><StepLabel>基本情報</StepLabel></Step>
    <Step><StepLabel>課題・優先事項</StepLabel></Step>
    <Step><StepLabel>目標・計画</StepLabel></Step>
  </Stepper>

  {/* フォームセクション */}
  <HearingFormSections
    activeStep={activeStep}
    formData={formData}
    onChange={handleFormChange}
  />

  {/* ナビゲーションボタン */}
  <Box>
    <Button onClick={handleBack}>戻る</Button>
    <Button onClick={handleNext}>次へ</Button>
    <Button onClick={handleSubmit}>送信</Button>
  </Box>
</Container>
```

---

### 2.2 HearingResult.tsx

**種類**: ページコンポーネント

**ルート**: `/hearing/result`

**権限**: `clinic_owner`, `clinic_editor`, `clinic_viewer`

**責務**:
- AI分析結果を表示
- 企業レコメンドを表示
- ヒアリング履歴一覧を表示

**Props**:
```typescript
interface HearingResultProps {
  // URLパラメータから取得
  hearingId?: string;
}
```

**State管理**:
```typescript
interface HearingResultState {
  hearing: Hearing | null;
  analysis: HearingAnalysis | null;
  recommendations: Recommendation[];
  isLoading: boolean;
  error: string | null;
}
```

**使用するMUIコンポーネント**:
- `Container`, `Grid`, `Paper`, `Typography`, `Divider`
- `Chip`, `List`, `ListItem`, `ListItemText`
- `CircularProgress`, `Alert`, `Tabs`, `Tab`

**API呼び出し**:
- `GET /api/hearings/{id}/analysis` - AI分析結果取得
- `GET /api/hearings/{id}/recommendations` - 企業レコメンド取得

**画面構成**:
```tsx
<Container>
  <Typography variant="h4">ヒアリング分析結果</Typography>

  {/* AI分析結果カード */}
  <AIAnalysisCard
    analysis={analysis}
    isLoading={isLoading}
  />

  {/* 企業レコメンド */}
  <Typography variant="h5">おすすめ企業</Typography>
  <Grid container spacing={2}>
    {recommendations.map((rec) => (
      <Grid item xs={12} md={6} key={rec.id}>
        <CompanyRecommendation recommendation={rec} />
      </Grid>
    ))}
  </Grid>
</Container>
```

---

### 2.3 CompanyManagement.tsx

**種類**: ページコンポーネント

**ルート**: `/admin/companies`

**権限**: `system_admin`

**責務**:
- 企業一覧を表示
- 企業の新規作成、編集、削除
- CSV一括読込

**Props**: なし

**State管理**:
```typescript
interface CompanyManagementState {
  companies: Company[];
  selectedCompany: Company | null;
  isDialogOpen: boolean;
  isCsvDialogOpen: boolean;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

**使用するMUIコンポーネント**:
- `Container`, `Paper`, `Typography`, `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`
- `Button`, `IconButton`, `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`
- `TextField`, `Chip`, `Pagination`, `CircularProgress`, `Alert`

**API呼び出し**:
- `GET /api/companies` - 企業一覧取得
- `POST /api/companies` - 企業作成
- `PUT /api/companies/{id}` - 企業更新
- `DELETE /api/companies/{id}` - 企業削除
- `POST /api/companies/import-csv` - CSV一括読込

**画面構成**:
```tsx
<Container>
  <Typography variant="h4">企業管理</Typography>

  {/* アクションボタン */}
  <Box>
    <Button onClick={handleOpenDialog}>新規企業作成</Button>
    <Button onClick={handleOpenCsvDialog}>CSV一括読込</Button>
  </Box>

  {/* 企業一覧テーブル */}
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>企業名</TableCell>
        <TableCell>カテゴリ</TableCell>
        <TableCell>タグ</TableCell>
        <TableCell>有効</TableCell>
        <TableCell>操作</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {companies.map((company) => (
        <TableRow key={company.id}>
          <TableCell>{company.name}</TableCell>
          <TableCell>{company.category}</TableCell>
          <TableCell>
            {company.tags.map((tag) => (
              <Chip label={tag} key={tag} />
            ))}
          </TableCell>
          <TableCell>{company.isActive ? '有効' : '無効'}</TableCell>
          <TableCell>
            <IconButton onClick={() => handleEdit(company)}>編集</IconButton>
            <IconButton onClick={() => handleDelete(company.id)}>削除</IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>

  {/* ページネーション */}
  <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} />

  {/* 企業作成・編集ダイアログ */}
  <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
    <DialogTitle>{selectedCompany ? '企業編集' : '新規企業作成'}</DialogTitle>
    <DialogContent>
      <TextField label="企業名" value={formData.name} onChange={handleChange} />
      {/* その他フィールド */}
    </DialogContent>
    <DialogActions>
      <Button onClick={handleCloseDialog}>キャンセル</Button>
      <Button onClick={handleSave}>保存</Button>
    </DialogActions>
  </Dialog>

  {/* CSV一括読込ダイアログ */}
  <Dialog open={isCsvDialogOpen} onClose={handleCloseCsvDialog}>
    <DialogTitle>CSV一括読込</DialogTitle>
    <DialogContent>
      <input type="file" accept=".csv" onChange={handleFileChange} />
    </DialogContent>
    <DialogActions>
      <Button onClick={handleCloseCsvDialog}>キャンセル</Button>
      <Button onClick={handleCsvUpload}>アップロード</Button>
    </DialogActions>
  </Dialog>
</Container>
```

---

### 2.4 HearingFormSections.tsx

**種類**: コンポーネント

**責務**:
- ヒアリングフォームのセクション（section1-3）を表示
- 親コンポーネントからのデータ受け取り・変更通知

**Props**:
```typescript
interface HearingFormSectionsProps {
  activeStep: number;              // 現在のステップ（0-2）
  formData: HearingFormData;       // フォームデータ
  onChange: (data: HearingFormData) => void;  // データ変更時のコールバック
}
```

**使用するMUIコンポーネント**:
- `Box`, `Typography`, `TextField`, `Checkbox`, `FormControlLabel`, `RadioGroup`, `Radio`, `FormGroup`

**画面構成**:
```tsx
<Box>
  {activeStep === 0 && (
    <Box>
      <Typography variant="h6">基本情報</Typography>
      <TextField label="月商（円）" type="number" value={formData.responseData.section1.monthlyRevenue} />
      <TextField label="スタッフ数（人）" type="number" value={formData.responseData.section1.staffCount} />
      {/* その他フィールド */}
    </Box>
  )}

  {activeStep === 1 && (
    <Box>
      <Typography variant="h6">課題・優先事項</Typography>
      <FormGroup>
        {CHALLENGE_CATEGORIES.map((category) => (
          <FormControlLabel
            key={category}
            control={<Checkbox checked={formData.responseData.section2.challenges.includes(category)} />}
            label={category}
          />
        ))}
      </FormGroup>
      {/* その他フィールド */}
    </Box>
  )}

  {activeStep === 2 && (
    <Box>
      <Typography variant="h6">目標・計画</Typography>
      <TextField label="目標" multiline rows={4} value={formData.responseData.section3.goals} />
      {/* その他フィールド */}
    </Box>
  )}
</Box>
```

---

### 2.5 AIAnalysisCard.tsx

**種類**: コンポーネント

**責務**:
- AI分析結果（強み・課題）を表示
- 分析ステータス（処理中、完了、失敗）を表示

**Props**:
```typescript
interface AIAnalysisCardProps {
  analysis: HearingAnalysis | null;
  isLoading: boolean;
}
```

**使用するMUIコンポーネント**:
- `Card`, `CardContent`, `Typography`, `Chip`, `List`, `ListItem`, `ListItemText`, `CircularProgress`, `Alert`

**画面構成**:
```tsx
<Card>
  <CardContent>
    <Typography variant="h5">AI分析結果</Typography>

    {isLoading && <CircularProgress />}

    {analysis && analysis.analysisStatus === 'completed' && (
      <>
        {/* 強み */}
        <Typography variant="h6">強み</Typography>
        <List>
          {analysis.strongPoints.map((point, index) => (
            <ListItem key={index}>
              <ListItemText primary={point} />
            </ListItem>
          ))}
        </List>

        {/* 課題 */}
        <Typography variant="h6">課題</Typography>
        <List>
          {analysis.challenges.map((challenge, index) => (
            <ListItem key={index}>
              <Chip label={priorityToLabel(challenge.priority)} color={challenge.priority === 'high' ? 'error' : 'default'} />
              <ListItemText
                primary={challenge.category}
                secondary={challenge.description}
              />
            </ListItem>
          ))}
        </List>
      </>
    )}

    {analysis && analysis.analysisStatus === 'failed' && (
      <Alert severity="error">{analysis.errorMessage}</Alert>
    )}
  </CardContent>
</Card>
```

---

### 2.6 CompanyRecommendation.tsx

**種類**: コンポーネント

**責務**:
- 企業レコメンドカードを表示
- マッチングスコアを星評価で表示
- 企業詳細（名称、説明、連絡先）を表示

**Props**:
```typescript
interface CompanyRecommendationProps {
  recommendation: Recommendation;
}
```

**使用するMUIコンポーネント**:
- `Card`, `CardContent`, `CardActions`, `Typography`, `Chip`, `Rating`, `Button`, `Link`

**画面構成**:
```tsx
<Card>
  <CardContent>
    <Typography variant="h6">{recommendation.company.name}</Typography>
    <Chip label={recommendation.company.category} />

    {/* マッチングスコア（星評価） */}
    <Rating value={matchScoreToStars(recommendation.matchScore)} readOnly />
    <Typography variant="body2">マッチングスコア: {recommendation.matchScore}</Typography>

    {/* 企業説明 */}
    <Typography variant="body2">{recommendation.company.serviceDescription}</Typography>

    {/* タグ */}
    <Box>
      {recommendation.company.tags.map((tag) => (
        <Chip label={tag} key={tag} size="small" />
      ))}
    </Box>
  </CardContent>

  <CardActions>
    <Button size="small" href={`mailto:${recommendation.company.contactEmail}`}>
      問い合わせ
    </Button>
    <Button size="small" component={Link} href={recommendation.company.websiteUrl} target="_blank">
      Webサイト
    </Button>
  </CardActions>
</Card>
```

---

### 2.7 Dashboard.tsx（改修）

**種類**: ページコンポーネント（既存）

**ルート**: `/dashboard`

**権限**: `clinic_owner`, `clinic_editor`, `clinic_viewer`

**改修内容**:
- タブUIを追加（「数値分析」「ヒアリング分析」）
- 「ヒアリング分析」タブで最新分析結果を表示

**新規Props**: なし

**新規State**:
```typescript
interface DashboardState {
  // 既存State...

  // 新規追加
  activeTab: number;  // 0: 数値分析, 1: ヒアリング分析
  latestHearing: Hearing | null;
  latestAnalysis: HearingAnalysis | null;
  recommendations: Recommendation[];
}
```

**新規API呼び出し**:
- `GET /api/hearings/latest` - 最新ヒアリング取得
- `GET /api/hearings/{id}/analysis` - 最新分析結果取得
- `GET /api/hearings/{id}/recommendations` - 企業レコメンド取得

**画面構成（改修部分）**:
```tsx
<Container>
  <Typography variant="h4">経営ダッシュボード</Typography>

  {/* タブUI */}
  <Tabs value={activeTab} onChange={handleTabChange}>
    <Tab label="数値分析" />
    <Tab label="ヒアリング分析" />
  </Tabs>

  {/* 数値分析タブ（既存） */}
  {activeTab === 0 && (
    <Box>
      {/* 既存のダッシュボード内容 */}
    </Box>
  )}

  {/* ヒアリング分析タブ（新規） */}
  {activeTab === 1 && (
    <Box>
      {latestAnalysis ? (
        <>
          <AIAnalysisCard analysis={latestAnalysis} isLoading={false} />

          <Typography variant="h5">おすすめ企業</Typography>
          <Grid container spacing={2}>
            {recommendations.slice(0, 3).map((rec) => (
              <Grid item xs={12} md={4} key={rec.id}>
                <CompanyRecommendation recommendation={rec} />
              </Grid>
            ))}
          </Grid>

          <Button component={Link} to="/hearing/result">
            詳細を見る
          </Button>
        </>
      ) : (
        <Alert severity="info">
          まだヒアリングを実施していません。
          <Button component={Link} to="/hearing">ヒアリングを実施する</Button>
        </Alert>
      )}
    </Box>
  )}
</Container>
```

---

## 3. 状態管理方針

### 3.1 ローカルState（useState）

**使用箇所**:
- フォーム入力データ（HearingForm.tsx）
- ダイアログ開閉状態（CompanyManagement.tsx）
- ページネーション状態（CompanyManagement.tsx）

### 3.2 サーバーState（React Query）

**使用箇所**:
- API呼び出し結果のキャッシング
- ヒアリング一覧、企業一覧の取得・更新
- AI分析結果の取得

**主要なクエリキー**:
```typescript
const queryKeys = {
  hearings: (clinicId: string) => ['hearings', clinicId],
  latestHearing: (clinicId: string) => ['hearings', 'latest', clinicId],
  analysis: (hearingId: string) => ['analysis', hearingId],
  recommendations: (hearingId: string) => ['recommendations', hearingId],
  companies: (params: any) => ['companies', params],
};
```

### 3.3 グローバルState（Zustand）

**使用箇所**:
- ユーザー認証情報（既存）
- clinic_id（既存）

---

## 4. API呼び出しタイミング

### 4.1 HearingForm.tsx

- **マウント時**: なし
- **フォーム送信時**: `POST /api/hearings`

### 4.2 HearingResult.tsx

- **マウント時**: `GET /api/hearings/{id}/analysis`, `GET /api/hearings/{id}/recommendations`
- **5秒ごとにポーリング（分析中のみ）**: `GET /api/hearings/{id}/analysis`

### 4.3 CompanyManagement.tsx

- **マウント時**: `GET /api/companies`
- **ページ変更時**: `GET /api/companies`
- **企業作成時**: `POST /api/companies` → `GET /api/companies`（再取得）
- **企業更新時**: `PUT /api/companies/{id}` → `GET /api/companies`（再取得）
- **企業削除時**: `DELETE /api/companies/{id}` → `GET /api/companies`（再取得）

### 4.4 Dashboard.tsx

- **マウント時**: `GET /api/hearings/latest`
- **最新ヒアリングあり**: `GET /api/hearings/{id}/analysis`, `GET /api/hearings/{id}/recommendations`

---

## 5. エラーハンドリング

### 5.1 APIエラー表示

**使用コンポーネント**: MUI `Alert`

**表示タイミング**:
- API呼び出し失敗時
- バリデーションエラー時

**例**:
```tsx
{error && (
  <Alert severity="error" onClose={() => setError(null)}>
    {error}
  </Alert>
)}
```

### 5.2 ローディング表示

**使用コンポーネント**: MUI `CircularProgress`, `Skeleton`

**表示タイミング**:
- API呼び出し中
- AI分析処理中

**例**:
```tsx
{isLoading ? (
  <CircularProgress />
) : (
  <AIAnalysisCard analysis={analysis} isLoading={false} />
)}
```

---

## 6. レスポンシブ対応

### 6.1 ブレークポイント

MUI v6のデフォルトブレークポイントを使用:
- `xs`: 0px〜
- `sm`: 600px〜
- `md`: 900px〜
- `lg`: 1200px〜
- `xl`: 1536px〜

### 6.2 レイアウト調整

**PC表示**:
- 企業レコメンド: 2カラムグリッド（Grid xs={12} md={6}）
- フォーム: 中央寄せ（maxWidth='md'）

**スマホ表示**:
- 企業レコメンド: 1カラムグリッド（Grid xs={12}）
- フォーム: フル幅

---

## 7. アクセシビリティ

### 7.1 ARIAラベル

**必須箇所**:
- フォーム入力（TextField label属性）
- ボタン（Button aria-label属性）
- アイコンボタン（IconButton aria-label属性）

### 7.2 キーボード操作

**対応箇所**:
- フォーム入力: Tab/Shift+Tab での移動
- ダイアログ: Escキーで閉じる
- ボタン: Enterキーで実行

---

## 8. テスト方針

### 8.1 ユニットテスト（Jest + React Testing Library）

**テスト対象**:
- コンポーネントのレンダリング
- ユーザーインタラクション（ボタンクリック、入力等）
- バリデーションロジック

### 8.2 統合テスト

**テスト対象**:
- API呼び出し〜レスポンス表示の一連の流れ
- エラーハンドリング

---

**作成者**: Claude Code
**最終更新日**: 2025-12-26
