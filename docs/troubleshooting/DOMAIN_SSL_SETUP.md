# MA-Pilot カスタムドメイン・SSL設定ガイド

本番環境でカスタムドメインを使用し、SSL証明書を設定する手順をまとめています。

## 目次

1. [前提条件](#前提条件)
2. [フロントエンド（Vercel）のドメイン設定](#フロントエンドvercelのドメイン設定)
3. [バックエンド（Render.com）のドメイン設定](#バックエンドrendercomのドメイン設定)
4. [DNS設定](#dns設定)
5. [SSL証明書設定](#ssl証明書設定)
6. [環境変数の更新](#環境変数の更新)
7. [動作確認](#動作確認)
8. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

### 必要なもの
- [x] 独自ドメイン（例: `yourdomain.com`）
- [x] ドメイン管理権限（DNS設定変更が可能）
- [x] Vercelプロジェクト（フロントエンド）
- [x] Render.comプロジェクト（バックエンド）

### 推奨ドメイン構成

| サービス | サブドメイン | 用途 |
|---------|------------|------|
| フロントエンド | `app.yourdomain.com` | ユーザーアクセス用 |
| バックエンド | `api.yourdomain.com` | APIエンドポイント |

または、ルートドメインを使用:

| サービス | ドメイン | 用途 |
|---------|---------|------|
| フロントエンド | `yourdomain.com` | ユーザーアクセス用 |
| バックエンド | `api.yourdomain.com` | APIエンドポイント |

---

## フロントエンド（Vercel）のドメイン設定

### 1. Vercelダッシュボードでドメイン追加

1. https://vercel.com/dashboard にログイン
2. プロジェクトを選択
3. **Settings > Domains** に移動
4. "Add" ボタンをクリック

### 2. ドメインを入力

#### サブドメインの場合
```
app.yourdomain.com
```

#### ルートドメインの場合
```
yourdomain.com
```

"Add" をクリック。

### 3. DNS設定の確認

Vercelが推奨するDNS設定が表示されます:

#### サブドメインの場合（CNAME）
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

#### ルートドメインの場合（A Record）
```
Type: A
Name: @
Value: 76.76.21.21
```

### 4. DNSプロバイダーで設定

お使いのDNSプロバイダー（例: Cloudflare, Route53, GoDaddy）で上記のレコードを追加します。

詳細は [DNS設定](#dns設定) を参照してください。

### 5. 検証待ち

DNS設定後、Vercelが自動的にドメインを検証します（数分〜最大48時間）。

検証完了後、ステータスが "Valid" になります。

### 6. SSL証明書の自動発行

Vercelが自動的にLet's Encrypt証明書を発行します。

---

## バックエンド（Render.com）のドメイン設定

### 1. Render.comダッシュボードでカスタムドメイン追加

1. https://dashboard.render.com にログイン
2. Web Serviceを選択
3. **Settings > Custom Domains** に移動
4. "Add Custom Domain" をクリック

### 2. ドメインを入力

```
api.yourdomain.com
```

"Save" をクリック。

### 3. DNS設定の確認

Render.comが表示するCNAMEレコードをメモします:

```
Type: CNAME
Name: api
Value: <your-service>.onrender.com
```

例:
```
Type: CNAME
Name: api
Value: ma-pilot-backend.onrender.com
```

### 4. DNSプロバイダーで設定

お使いのDNSプロバイダーで上記のCNAMEレコードを追加します。

### 5. 検証待ち

DNS設定後、Render.comが自動的にドメインを検証します（数分〜最大48時間）。

検証完了後、ステータスが "Verified" になります。

### 6. SSL証明書の自動発行

Render.comが自動的にLet's Encrypt証明書を発行します。

---

## DNS設定

### Cloudflareの場合

1. Cloudflareダッシュボードにログイン
2. ドメインを選択
3. **DNS > Records** に移動
4. "Add record" をクリック

#### フロントエンド（サブドメイン）
```
Type: CNAME
Name: app
Target: cname.vercel-dns.com
Proxy status: DNS only（灰色のクラウド）
TTL: Auto
```

#### フロントエンド（ルートドメイン）
```
Type: A
Name: @
IPv4 address: 76.76.21.21
Proxy status: DNS only（灰色のクラウド）
TTL: Auto
```

#### バックエンド
```
Type: CNAME
Name: api
Target: ma-pilot-backend.onrender.com
Proxy status: DNS only（灰色のクラウド）
TTL: Auto
```

"Save" をクリック。

### Route53の場合

1. AWS Route53コンソールにログイン
2. Hosted Zoneを選択
3. "Create record" をクリック

#### フロントエンド（サブドメイン）
```
Record name: app
Record type: CNAME
Value: cname.vercel-dns.com
TTL: 300
Routing policy: Simple routing
```

#### バックエンド
```
Record name: api
Record type: CNAME
Value: ma-pilot-backend.onrender.com
TTL: 300
Routing policy: Simple routing
```

"Create records" をクリック。

### GoDaddyの場合

1. GoDaddyアカウントにログイン
2. ドメインを選択
3. **DNS > Manage Zones** に移動
4. "Add" をクリック

#### フロントエンド（サブドメイン）
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: 1 Hour
```

#### バックエンド
```
Type: CNAME
Name: api
Value: ma-pilot-backend.onrender.com
TTL: 1 Hour
```

"Save" をクリック。

### その他のDNSプロバイダー

上記と同様の手順で、CNAMEレコードまたはAレコードを追加してください。

---

## SSL証明書設定

### Vercel（フロントエンド）

#### 自動発行
Vercelは以下を自動的に実行します:
- Let's Encrypt証明書の取得
- 証明書の自動更新（90日ごと）
- HTTPSへの自動リダイレクト

#### 確認方法
1. Vercel > Settings > Domains
2. カスタムドメインのステータスが "Valid" であることを確認
3. "SSL Certificate" が "Active" であることを確認

### Render.com（バックエンド）

#### 自動発行
Render.comは以下を自動的に実行します:
- Let's Encrypt証明書の取得
- 証明書の自動更新（90日ごと）
- HTTPSへの自動リダイレクト

#### 確認方法
1. Render.com > Settings > Custom Domains
2. カスタムドメインのステータスが "Verified" であることを確認
3. "SSL Certificate" が "Active" であることを確認

### SSL証明書の種類

両サービスともLet's Encrypt証明書を使用:
- **DV（Domain Validation）証明書**
- **無料**
- **自動更新**
- **ブラウザで緑の鍵マーク表示**

---

## 環境変数の更新

カスタムドメイン設定後、環境変数を更新する必要があります。

### Vercel（フロントエンド）

1. Vercel > Settings > Environment Variables
2. 以下を編集:

```bash
VITE_BACKEND_URL=https://api.yourdomain.com
```

3. "Save" をクリック
4. Deployments > Redeploy を実行

### Render.com（バックエンド）

1. Render.com > Environment
2. 以下を編集:

```bash
FRONTEND_URL=https://app.yourdomain.com
```

または、ルートドメインの場合:
```bash
FRONTEND_URL=https://yourdomain.com
```

3. "Save Changes" をクリック
4. 自動的に再デプロイされます

### GitHub Secrets

GitHub Actionsでデプロイする場合、Secretsも更新:

1. GitHub > Settings > Secrets and variables > Actions
2. 以下を編集:

```
BACKEND_URL=https://api.yourdomain.com
```

---

## 動作確認

### 1. DNS伝播確認

```bash
# Linuxの場合
dig app.yourdomain.com
dig api.yourdomain.com

# Windowsの場合
nslookup app.yourdomain.com
nslookup api.yourdomain.com
```

正しいIPアドレスが返ってくることを確認。

### 2. HTTPSアクセス確認

#### フロントエンド
```bash
curl -I https://app.yourdomain.com
```

期待される応答:
```
HTTP/2 200
```

#### バックエンド
```bash
curl https://api.yourdomain.com/health
```

期待される応答:
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

### 3. SSL証明書確認

ブラウザで以下にアクセス:
```
https://app.yourdomain.com
https://api.yourdomain.com
```

アドレスバーに緑の鍵マークが表示されることを確認。

証明書の詳細を確認:
- 発行者: Let's Encrypt
- 有効期限: 90日後

### 4. HTTPリダイレクト確認

```bash
# HTTPでアクセス
curl -I http://app.yourdomain.com
```

期待される応答:
```
HTTP/1.1 301 Moved Permanently
Location: https://app.yourdomain.com
```

HTTPSに自動リダイレクトされることを確認。

---

## トラブルシューティング

### DNS伝播に時間がかかる

**問題**: DNS設定後、数時間経ってもドメインが反映されない

**解決策**:
- DNS伝播には最大48時間かかる場合があります
- https://dnschecker.org で伝播状況を確認
- TTLを短く設定（例: 300秒）すると伝播が早くなります

### Vercelで"Invalid Configuration"エラー

**問題**: Vercelでドメインが "Invalid Configuration" になる

**解決策**:
1. DNS設定が正しいか再確認
2. CNAMEレコードが `cname.vercel-dns.com` を指しているか確認
3. Cloudflareを使用している場合、Proxy statusを "DNS only" に変更

### Render.comで"Not Verified"のまま

**問題**: Render.comでドメインが "Not Verified" のまま

**解決策**:
1. CNAMEレコードが正しいか再確認
2. `<your-service>.onrender.com` を正確に入力しているか確認
3. DNS伝播を待つ（最大48時間）

### SSL証明書が発行されない

**問題**: SSL証明書が "Pending" のまま

**解決策**:
1. ドメインが正しく検証されているか確認
2. DNSレコードが正しいか確認
3. 数時間待つ（証明書発行には時間がかかる場合があります）

### CORS エラーが発生する

**問題**: カスタムドメイン設定後、CORSエラーが発生

**解決策**:
1. バックエンドの `FRONTEND_URL` を新しいドメインに更新
2. Render.comで再デプロイ
3. ブラウザキャッシュをクリア

### "Mixed Content"エラー

**問題**: HTTPSページ内でHTTPリソースが読み込まれる

**解決策**:
1. すべてのリソース（画像、スクリプト、CSS）がHTTPSであることを確認
2. `http://` を `https://` に変更
3. または相対パスを使用（`//` で始まる）

---

## カスタムドメインのベストプラクティス

### WWW vs 非WWW

#### 推奨: 非WWWをメインにする
```
メインドメイン: yourdomain.com
リダイレクト: www.yourdomain.com → yourdomain.com
```

#### Vercel設定
1. `yourdomain.com` を追加
2. `www.yourdomain.com` を追加
3. Vercelが自動的にwwwから非wwwにリダイレクト

### サブドメイン構成

#### 本番環境
```
app.yourdomain.com → フロントエンド
api.yourdomain.com → バックエンド
```

#### ステージング環境
```
staging.yourdomain.com → ステージングフロントエンド
api-staging.yourdomain.com → ステージングバックエンド
```

### DNS TTL設定

- **本番環境**: TTL 3600秒（1時間）推奨
- **テスト中**: TTL 300秒（5分）推奨

TTLを短くすると、DNS変更が早く反映されます。

---

## まとめ

カスタムドメイン設定の流れ:

1. **Vercelでドメイン追加** → `app.yourdomain.com`
2. **Render.comでドメイン追加** → `api.yourdomain.com`
3. **DNSレコード設定** → CNAMEレコードを追加
4. **SSL証明書自動発行** → Let's Encryptが自動取得
5. **環境変数更新** → 新しいドメインを設定
6. **動作確認** → HTTPS、ヘルスチェック

すべて完了すれば、独自ドメインでMA-Pilotにアクセスできます。

---

## 参考リンク

- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- [Render.com Custom Domains](https://render.com/docs/custom-domains)
- [Let's Encrypt](https://letsencrypt.org/)
- [DNS Checker](https://dnschecker.org/)
