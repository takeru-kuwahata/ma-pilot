# RenderのバックエンドURLの確認方法

## 手順1: Renderにログイン

1. ブラウザで https://dashboard.render.com/ にアクセス
2. ログインする

---

## 手順2: バックエンドサービスを探す

ダッシュボードに表示されているサービス一覧から、バックエンドのサービスを見つけます。

**探すポイント**:
- サービス名に「backend」「api」「ma-pilot」「ma-lstep」などが含まれている
- Type が「Web Service」になっている
- Language/Framework が「Python」になっている

---

## 手順3: URLを確認

サービス名をクリックすると、サービスの詳細ページが開きます。

**URLの場所**:

画面の上部に、以下のような形式でURLが表示されています：

```
https://【サービス名】.onrender.com
```

例：
- `https://ma-pilot-backend.onrender.com`
- `https://ma-lstep-api.onrender.com`
- `https://backend-abc123.onrender.com`

このURLをコピーしてください。

---

## 手順4: URLが正しいか確認

コピーしたURLの末尾に `/docs` を付けて、ブラウザでアクセスしてください。

例：
```
https://ma-pilot-backend.onrender.com/docs
```

**正しい場合**:
- FastAPIの「Swagger UI」というページが表示される
- ページタイトルが「MA-Pilot Backend API - Swagger UI」

**間違っている場合**:
- 404エラー
- 502 Bad Gateway
- サービスが見つからない

---

## もしサービスが見つからない場合

### パターン1: バックエンドをまだデプロイしていない

この場合、まずバックエンドをRenderにデプロイする必要があります。

デプロイ手順は `docs/DEPLOYMENT_GUIDE.md` を参照してください。

### パターン2: 別のアカウントでデプロイした

複数のRenderアカウントをお持ちの場合、別のアカウントでログインしてみてください。

### パターン3: サービス名を変更した

サービス一覧で、Type が「Web Service」で Language が「Python」のものを探してください。

---

## 確認できたら

RenderのバックエンドURLを以下の形式でコピーして、教えてください：

```
https://【サービス名】.onrender.com
```

そのURLを使って、Vercelの環境変数を設定します。

---

## 補足: Renderにバックエンドがない場合

もし、Renderにバックエンドサービスが存在しない場合、以下の2つの選択肢があります：

### 選択肢1: Renderにバックエンドをデプロイする（推奨）

新規でRenderにバックエンドをデプロイします。

### 選択肢2: ローカルのバックエンドを使う（一時的な対処）

Vercelの環境変数を設定せず、ローカル環境でのみ開発を続ける。

**ただし、この場合はVercelにデプロイしたフロントエンドは使えません。**

---

どちらの選択肢が良いか、教えてください。
