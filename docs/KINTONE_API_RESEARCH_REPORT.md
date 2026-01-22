# キントーン（kintone）API連携 技術調査レポート

**調査日**: 2025-12-25
**対象システム**: MA-Pilot（歯科医院経営分析システム）
**調査目的**: kintoneに保存されている印刷物の過去注文データを取得し、再注文機能を実装する

---

## 1. 技術的可能性

### ✅ 結論: **実装可能（○）**

kintoneは完全なREST APIを提供しており、外部システム（React/FastAPI）からのデータ取得は問題なく実装可能です。

### 1.1 REST APIの提供状況

**提供状況**: ○（充実）

- **kintone REST API**が公式に提供されている
- エンドポイント形式: `https://{SUBDOMAIN}.cybozu.com/k/v1/records.json`
- JSON形式でのデータ取得・登録・更新・削除が可能
- 公式ドキュメント: [kintone REST API 共通仕様](https://cybozu.dev/ja/kintone/docs/rest-api/overview/kintone-rest-api-overview/)

### 1.2 認証方式

kintoneは以下4つの認証方式をサポート:

| 認証方式 | 概要 | 推奨度 | セキュリティ |
|---------|------|--------|------------|
| **APIトークン認証** | アプリごとに生成するトークンを使用 | ★★★★★ | 高 |
| パスワード認証 | ログイン名とパスワードをBASE64エンコード | ★★☆☆☆ | 中 |
| セッション認証 | ブラウザログイン時のセッション使用 | ★☆☆☆☆ | 低 |
| OAuth 2.0 | OAuth 2.0プロトコル使用 | ★★★★☆ | 高 |

**推奨**: APIトークン認証（外部システム連携に最適）

#### APIトークン認証の実装方法

```python
import requests

headers = {
    'X-Cybozu-API-Token': 'YOUR_API_TOKEN',
    'Content-Type': 'application/json'
}

params = {
    'app': 'APP_ID',
    'query': 'order_date > "2024-01-01"',
    'limit': 100
}

response = requests.get(
    'https://YOUR_SUBDOMAIN.cybozu.com/k/v1/records.json',
    headers=headers,
    params=params
)

records = response.json()['records']
```

**メリット**:
- ユーザーID・パスワードを保持する必要がない
- アプリごとに権限を細かく設定可能（閲覧のみ、追加・編集など）
- セキュリティリスクを最小化
- トークンの無効化が容易

**参考**: [APIトークンを生成する | kintone ヘルプ](https://jp.cybozu.help/k/ja/user/app_settings/api_token.html)

### 1.3 外部システム（React/FastAPI）からのアクセス

**実装可能**: ○

- **フロントエンド（React）**: 直接アクセスは非推奨（APIトークンが露出）
- **バックエンド（FastAPI）**: ○ 推奨アプローチ

#### 推奨アーキテクチャ

```
React (Frontend)
    ↓ HTTP Request
FastAPI (Backend)
    ↓ kintone REST API
kintone (外部システム)
```

**理由**:
1. APIトークンをサーバー側で管理（環境変数）
2. セキュリティリスクの軽減
3. レート制限の管理が容易
4. エラーハンドリングの一元化

---

## 2. 実装工数の見積もり

### 前提条件
- kintoneアプリは既に構築済み
- APIトークンは発行済み
- 印刷物注文データのスキーマが確定している

### 2.1 工数見積もり詳細

| 作業項目 | 作業内容 | 見積工数 | 備考 |
|---------|---------|---------|------|
| **1. 環境設定** | `.env.local`にkintone認証情報追加 | 0.5時間 | KINTONE_API_TOKEN、SUBDOMAIN等 |
| **2. 型定義作成** | kintoneレコード型をTypeScriptで定義 | 1時間 | `src/types/index.ts`に追加 |
| **3. FastAPI連携実装** | kintoneデータ取得APIエンドポイント作成 | 3時間 | `/api/kintone/print-orders` |
| **4. エラーハンドリング** | レート制限、接続エラー対応 | 1.5時間 | HTTPステータス429対応含む |
| **5. フロントエンド統合** | React側でデータ取得・表示 | 3時間 | React Query使用 |
| **6. 再注文機能UI** | 過去注文一覧→再注文フォーム遷移 | 2時間 | MUI使用 |
| **7. テスト** | 単体テスト・結合テスト | 2時間 | レート制限テスト含む |
| **8. ドキュメント作成** | API仕様書・設定手順書 | 1時間 | `docs/KINTONE_INTEGRATION.md` |

**合計工数**: **14時間（約2日）**

### 2.2 工数内訳グラフ

```
認証・接続実装:   ████░░░░░░ 4.5時間 (32%)
データ取得API:    ████████░░ 8.0時間 (57%)
テスト・文書化:   ███░░░░░░░ 3.0時間 (21%)
                  ─────────────────────
                  合計: 14時間 (約2日)
```

### 2.3 リスクバッファ

- **想定外のスキーマ変更**: +2時間
- **kintone側のカスタマイズ必要**: +4時間
- **レート制限対応の複雑化**: +2時間

**最大想定工数**: 22時間（約3日）

---

## 3. 制約事項・リスク

### 3.1 レート制限

| 制約項目 | スタンダードコース | ワイドコース | 備考 |
|---------|------------------|------------|------|
| **1日のAPIリクエスト数** | 10,000回/日/アプリ | 100,000回/日 | JST午前9時にリセット |
| **同時リクエスト数** | 100リクエスト/ドメイン | 100リクエスト/ドメイン | 超過時HTTP 429返却 |
| **1回の取得レコード数** | 最大500件 | 最大500件 | デフォルト100件 |
| **1回の登録/更新/削除** | 最大100件 | 最大100件 | - |
| **リクエストボディサイズ** | 最大50MB | 最大50MB | - |

**参考**: [kintone APIリクエスト数の上限](https://ascii.jp/elem/000/001/732/1732238/)

#### レート制限対策

1. **キャッシュ戦略**
   - バックエンドでkintoneデータを一時キャッシュ（Redis推奨）
   - キャッシュ有効期限: 1時間〜24時間
   - ユーザーリクエストはキャッシュから返却

2. **バッチ処理**
   - 深夜時間帯にデータ同期（午前0時〜6時）
   - MA-Pilot内部DBにコピーを保持

3. **レート制限監視**
   ```python
   if response.status_code == 429:
       # リトライ処理（指数バックオフ）
       time.sleep(2 ** retry_count)
   ```

### 3.2 料金プランによる制限

| プラン | 月額料金（1ユーザー） | APIリクエスト上限 | 推奨シーン |
|-------|-------------------|-----------------|----------|
| スタンダード | 1,500円 | 10,000回/日/アプリ | 小規模医院（1〜5件/日） |
| ワイドコース | 3,000円 | 100,000回/日 | 中〜大規模医院（多頻度アクセス） |

**MA-Pilot推奨**: スタンダードコース（キャッシュ併用）

**理由**:
- 再注文機能は1医院あたり1日数回程度の使用
- キャッシュ戦略で実質APIリクエストを削減
- コスト効率が高い

**参考**: [kintoneの料金プランは？](https://www.rshd.co.jp/news/kintone-2-2.html)

### 3.3 セキュリティ上の考慮事項

| リスク項目 | 対策 | 実装場所 |
|-----------|------|---------|
| **APIトークン漏洩** | 環境変数（.env.local）で管理、Gitコミット禁止 | バックエンド |
| **不正アクセス** | MA-Pilot側でユーザー認証（Supabase Auth） | フロントエンド |
| **データ改ざん** | kintone側で閲覧専用トークン発行 | kintone設定 |
| **ネットワーク盗聴** | HTTPS通信必須 | インフラ |
| **CORS制約** | バックエンド経由でアクセス（フロントエンド直接アクセス禁止） | アーキテクチャ |

#### APIトークンの安全な管理

```yaml
# .env.local（Gitignore必須）
KINTONE_SUBDOMAIN=your-subdomain
KINTONE_API_TOKEN=your-secure-token
KINTONE_APP_ID=123
```

```python
# FastAPI実装例
import os
from fastapi import HTTPException

KINTONE_TOKEN = os.getenv('KINTONE_API_TOKEN')
if not KINTONE_TOKEN:
    raise HTTPException(status_code=500, detail="kintone API token not configured")
```

### 3.4 データ量制約

| 制約 | 影響 | 対策 |
|-----|------|------|
| 500件/回の取得上限 | 大量データ取得時に複数リクエスト必要 | オフセットまたはカーソルAPI使用 |
| 100件/回の登録上限 | 一括登録に制限 | バッチ処理で分割 |

#### 大量データ取得の実装例（カーソルAPI）

```python
import requests

def get_all_records(subdomain, api_token, app_id):
    """1万件超のレコードを取得"""
    # カーソル作成
    cursor_url = f"https://{subdomain}.cybozu.com/k/v1/records/cursor.json"
    create_cursor = {
        'app': app_id,
        'size': 500
    }

    cursor_resp = requests.post(
        cursor_url,
        headers={'X-Cybozu-API-Token': api_token},
        json=create_cursor
    )
    cursor_id = cursor_resp.json()['id']

    # レコード取得
    all_records = []
    while True:
        get_url = f"https://{subdomain}.cybozu.com/k/v1/records/cursor.json?id={cursor_id}"
        resp = requests.get(get_url, headers={'X-Cybozu-API-Token': api_token})
        data = resp.json()

        all_records.extend(data['records'])

        if not data['next']:
            break

    return all_records
```

**参考**: [kintoneのカーソルAPIを使用してpythonで大量のデータを取得する](https://zenn.dev/mima_ita/articles/b150f6154b0f96)

---

## 4. 代替案

### 4.1 kintone連携が難しい場合のフォールバック

| 代替案 | 概要 | メリット | デメリット |
|-------|------|---------|-----------|
| **CSV手動インポート** | kintoneからCSVエクスポート→MA-Pilotにインポート | 実装工数ゼロ | 手作業が必要、リアルタイム性なし |
| **MA-Pilot内DB保存** | kintoneとは別に注文履歴をMA-Pilot内に保存 | kintone不要、完全制御 | データ重複、kintoneとの同期必要 |
| **Webhook連携** | kintoneから新規注文時に自動通知 | リアルタイム、効率的 | kintone側のカスタマイズ必要 |

### 4.2 システム内DB保存との比較

| 項目 | kintone連携 | MA-Pilot内DB保存 |
|-----|------------|-----------------|
| **初期実装工数** | 14時間（2日） | 8時間（1日） |
| **ランニングコスト** | kintone利用料（1,500円/月〜） | なし |
| **データの一元性** | ○ kintoneがマスター | △ データ重複 |
| **リアルタイム性** | ○ API経由で最新 | × 手動同期 |
| **保守性** | ○ kintone側で管理 | △ 両方のメンテ必要 |
| **柔軟性** | △ kintoneスキーマに依存 | ○ 自由に設計可能 |

**推奨**: kintone連携（理由: データの一元管理、保守性の高さ）

### 4.3 Webhook連携（将来拡張案）

kintoneのWebhook機能を使えば、以下が可能:

1. **新規注文発生時**: kintone → MA-Pilot自動通知
2. **注文ステータス変更時**: リアルタイム同期
3. **在庫切れ通知**: kintone → MA-Pilotアラート

**実装例**:
```python
# FastAPI Webhook受信エンドポイント
@app.post("/api/webhooks/kintone/order-created")
async def handle_kintone_webhook(payload: dict):
    """kintoneから新規注文Webhookを受信"""
    order_id = payload['record']['$id']['value']
    order_data = payload['record']

    # MA-Pilot DBに保存
    await save_order_to_db(order_data)

    return {"status": "success"}
```

**参考**: [kintone Webhook機能](https://pepacomi.com/kintone/kintone-api/)

---

## 5. 2025年最新機能

### UPSERTモード（2025年1月追加）

**新機能**: レコード更新API（PUT）にUPSERTモードが追加され、APIリクエスト数を大幅削減可能。

**従来の方法**:
1. GETでレコード存在確認（1リクエスト）
2. 存在すればPUT、なければPOST（1リクエスト）
→ **合計2リクエスト**

**UPSERTモード**:
1. PUT（UPSERT）で存在チェック＋登録/更新を一度に実行
→ **合計1リクエスト**

**効果**: APIリクエスト数を50%削減

---

## 6. 実装推奨方針

### 6.1 推奨アプローチ

**Phase 1: MVP実装（優先度: 高）**

```yaml
実装内容:
  - FastAPIにkintoneデータ取得エンドポイント追加
  - APIトークン認証実装
  - Reactで過去注文一覧表示
  - 再注文フォームへのデータ自動入力

技術選定:
  - 認証方式: APIトークン認証
  - アーキテクチャ: React → FastAPI → kintone
  - キャッシュ: なし（MVP版は毎回API取得）
  - レート制限対策: なし（MVP版）

工数: 14時間（2日）
```

**Phase 2: パフォーマンス改善（優先度: 中）**

```yaml
実装内容:
  - Redis導入（キャッシュレイヤー）
  - レート制限監視・リトライ処理
  - カーソルAPI実装（大量データ対応）

工数: 8時間（1日）
```

**Phase 3: 高度な連携（優先度: 低）**

```yaml
実装内容:
  - Webhook連携（リアルタイム同期）
  - 双方向同期（MA-Pilot → kintone注文登録）
  - UPSERTモード活用

工数: 16時間（2日）
```

### 6.2 実装ロードマップ

```
Week 1
├── Day 1-2: Phase 1 MVP実装（14h）
└── Day 3:   テスト・デバッグ

Week 2
├── Day 4:   Phase 2 パフォーマンス改善（8h）
└── Day 5:   ドキュメント作成・レビュー

Week 3〜（将来）
└── Phase 3: Webhook等の高度な連携
```

### 6.3 環境変数設定

```bash
# .env.local（プロジェクトルート）

# kintone連携設定
KINTONE_SUBDOMAIN=your-subdomain
KINTONE_API_TOKEN=your-secure-token
KINTONE_PRINT_ORDERS_APP_ID=123
KINTONE_CACHE_TTL=3600  # 1時間キャッシュ
```

### 6.4 ディレクトリ構成

```
MA-Pilot/
├── frontend/
│   └── src/
│       ├── components/
│       │   └── PrintOrders/
│       │       ├── PastOrdersList.tsx      # 過去注文一覧
│       │       └── ReorderForm.tsx         # 再注文フォーム
│       ├── hooks/
│       │   └── useKintonePrintOrders.ts   # kintoneデータ取得Hook
│       └── types/
│           └── index.ts                    # kintoneレコード型追加
│
└── backend/
    └── src/
        ├── api/
        │   └── kintone.py                  # kintone連携API
        ├── services/
        │   └── kintone_service.py          # kintoneビジネスロジック
        └── types/
            └── index.ts                     # kintoneレコード型（共通）
```

---

## 7. セキュリティチェックリスト

- [ ] APIトークンは`.env.local`で管理
- [ ] `.env.local`は`.gitignore`に追加済み
- [ ] 本番環境ではVercel/Renderの環境変数設定を使用
- [ ] kintoneアプリのAPIトークン権限は「閲覧のみ」に設定
- [ ] FastAPIエンドポイントはSupabase Auth認証必須
- [ ] HTTPS通信のみ許可（HTTP禁止）
- [ ] エラーメッセージにAPIトークンを含めない
- [ ] ログにAPIトークンを出力しない

---

## 8. 参考資料

### 公式ドキュメント
- [kintone REST API 共通仕様](https://cybozu.dev/ja/kintone/docs/rest-api/overview/kintone-rest-api-overview/)
- [認証 - cybozu developer network](https://cybozu.dev/ja/kintone/docs/rest-api/overview/authentication/)
- [複数のレコードを取得する](https://cybozu.dev/ja/kintone/docs/rest-api/records/get-records/)
- [APIトークンを生成する | kintone ヘルプ](https://jp.cybozu.help/k/ja/user/app_settings/api_token.html)

### レート制限・制約
- [APIリクエスト数上限について](https://docs.krew.mescius.jp/krewdashboard/krewdashboard_apirequests.html)
- [ASCII.jp：APIリクエスト数の上限値などkintoneの制限値を把握する](https://ascii.jp/elem/000/001/732/1732238/)
- [kintone APIリクエスト数の超過メールが届いたら？](https://cybozu.dev/ja/kintone/tips/best-practices/performance/kintone-api-request-limit-exceeded-guide/)
- [kintone REST APIのレートリミットと対処法 | ISSUE](https://i-ssue.com/topics/97ab7a1c-7303-4fac-927b-3e457ac355b1)

### 実装例
- [Kintoneのレコードを全件取得するプログラム【Python】](https://nagatsuka.co.jp/2919/)
- [Pythonでkintone APIを使用して育児記録を可視化する（POST／GET）](https://zenn.dev/mnmnmmmn/articles/python_kintone_api)
- [kintone | Pythonとkintone APIを使ってレコードを追加・更新する](https://analyzegear.co.jp/blog/2523)
- [kintoneのカーソルAPIを使用してpythonで大量のデータを取得する](https://zenn.dev/mima_ita/articles/b150f6154b0f96)
- [GitHub - icoxfog417/pykintone: Python library to access kintone](https://github.com/icoxfog417/pykintone)
- [kintone REST API について (GET編)](https://qiita.com/RyBB/items/08cf511f1dbce6cf76bf)
- [pythonでkintoneアプリのレコードデータを取得する方法（1レコード）](https://qiita.com/guitar_ell_r/items/573e80d6b573278ac5b2)

### 外部システム連携
- [kintoneのAPI機能で外部システムと連携する | テクバン株式会社](https://biz.techvan.co.jp/tech-kintone/blog/001166.html)
- [kintone(キントーン) API連携とは？APIの基本と外部サービス連携](https://www.rshd.co.jp/news/kintone-api.html)
- [kintoneのAPI連携とは？できることや設定方法･外部連携サービスを徹底解説](https://www.comdec.jp/comdeclab/kintone-api/)
- [kintone（キントーン）のAPI連携とは？できることや2つの設定方法を徹底解説！](https://pepacomi.com/kintone/kintone-api/)
- [kintoneの外部システム連携で検討すべきポイント](https://cybozu.dev/ja/kintone/tips/best-practices/external-system-integration/key-considerations-when-integrating-with-external-systems-in-kintone/)

### 料金プラン
- [kintone(キントーン)の料金プランは？ライセンスやプランについて](https://www.rshd.co.jp/news/kintone-2-2.html)

---

## 9. 最終結論

### 実装可能性: ○（推奨）

**理由**:
1. ✅ kintone REST APIは充実しており、技術的に完全に実装可能
2. ✅ 認証方式（APIトークン）はセキュアかつシンプル
3. ✅ 実装工数は約2日（14時間）と合理的
4. ✅ レート制限はキャッシュ戦略で対応可能
5. ✅ Python/React両方で豊富な実装例が存在

### 推奨実装方針

```yaml
アプローチ: Phase 1 MVP → Phase 2 パフォーマンス改善
認証方式: APIトークン認証
アーキテクチャ: React → FastAPI → kintone（3層構造）
キャッシュ: Phase 2でRedis導入
総工数: Phase 1=14h, Phase 2=8h（合計22時間≒3日）
優先度: 高（ユーザー価値が明確、実装リスク低い）
```

### Next Steps

1. **Week 1**: kintoneアプリ構成確認、APIトークン発行
2. **Week 2**: Phase 1 MVP実装（14時間）
3. **Week 3**: テスト・デバッグ、ドキュメント作成
4. **Week 4**: 本番デプロイ、ユーザーフィードバック収集
5. **Week 5〜**: Phase 2 パフォーマンス改善（必要に応じて）

---

**調査者**: Claude Sonnet 4.5
**承認者**: （要確認）
**最終更新**: 2025-12-25
