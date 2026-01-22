# Phase 6: ヒアリングシート機能 - Claude API統合設計書

**作成日**: 2025-12-26
**バージョン**: 1.0
**使用AI**: Claude API（Anthropic）

---

## 1. Claude API概要

### 1.1 基本情報

| 項目 | 内容 |
|------|------|
| API名 | Claude API |
| プロバイダー | Anthropic |
| モデル | Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) |
| エンドポイント | `https://api.anthropic.com/v1/messages` |
| 認証方式 | APIキー（x-api-key ヘッダー） |
| レート制限 | 60リクエスト/分（Tier 1） |
| 最大トークン数 | 入力: 200,000トークン、出力: 8,192トークン |

### 1.2 コスト（2025年12月時点）

| 項目 | 価格 |
|------|------|
| 入力トークン | $3.00 / 1M tokens |
| 出力トークン | $15.00 / 1M tokens |
| 1回分析想定コスト | 入力500トークン + 出力300トークン = 約$0.006（約0.9円） |
| 月間想定コスト（30医院×4回） | 120回 × $0.006 = $0.72（約108円） |

**備考**: 為替レート1ドル=150円で試算

---

## 2. APIキー管理

### 2.1 環境変数設定

**ファイル**: `.env.local`

**設定項目**:
```bash
# Claude API設定
CLAUDE_API_KEY=sk-ant-api03-xxxxx...
CLAUDE_MODEL=claude-sonnet-4-5-20250929
CLAUDE_MAX_TOKENS=1024
CLAUDE_TEMPERATURE=0.7
```

### 2.2 セキュリティ要件

- **APIキーの保護**:
  - `.env.local`ファイルは`.gitignore`に追加済み（コミット禁止）
  - 本番環境では環境変数（Render.com）で設定
  - ログにAPIキーを出力しない

- **APIキーローテーション**: 3ヶ月ごと

- **アクセス制限**: バックエンドサーバーのみがAPIキーにアクセス可能（フロントエンドには公開しない）

---

## 3. プロンプトテンプレート設計

### 3.1 システムプロンプト

```
あなたは歯科医院の経営コンサルタントです。
ヒアリング回答データを分析し、クリニックの強みと課題を抽出してください。

## 分析方針
1. 強み: 3〜5個の箇条書き
2. 課題: カテゴリ別に整理し、優先度（high/medium/low）を付与

## 出力フォーマット
JSONフォーマットで返却してください。
{
  "strong_points": ["強み1", "強み2", ...],
  "challenges": [
    {"category": "カテゴリ名", "description": "課題詳細", "priority": "high|medium|low"}
  ]
}
```

### 3.2 ユーザープロンプト（テンプレート）

```python
def generate_user_prompt(response_data: HearingResponseData) -> str:
    """
    ヒアリング回答データからユーザープロンプトを生成
    """
    section1 = response_data['section1']
    section2 = response_data['section2']
    section3 = response_data['section3']

    prompt = f"""
以下のヒアリング回答データを分析してください。

## 基本情報
- 月商: {section1['monthlyRevenue']:,}円
- スタッフ数: {section1['staffCount']}人
- 月間患者数: {section1['patientCount']}人
- ユニット数: {section1['unitCount']}台
"""

    if section1.get('openingYear'):
        prompt += f"- 開業年: {section1['openingYear']}年\n"

    if section1.get('location'):
        prompt += f"- 立地: {section1['location']}\n"

    prompt += f"""
## 課題・優先事項
- 課題: {', '.join(section2['challenges'])}
- 優先事項: {', '.join(section2['priorities'])}
"""

    if section2.get('challengeDetails'):
        prompt += f"- 課題詳細: {section2['challengeDetails']}\n"

    prompt += f"""
## 目標・計画
- 目標: {', '.join(section3['goals'])}
- 達成期限: {section3['timeline']}
"""

    if section3.get('notes'):
        prompt += f"- その他メモ: {section3['notes']}\n"

    prompt += """
上記のデータから、このクリニックの強みと課題を抽出してください。
JSONフォーマットで返却してください。
"""

    return prompt
```

### 3.3 プロンプト例（実際の入力例）

**入力**:
```
以下のヒアリング回答データを分析してください。

## 基本情報
- 月商: 5,000,000円
- スタッフ数: 10人
- 月間患者数: 150人
- ユニット数: 4台
- 開業年: 2024年
- 立地: 駅前

## 課題・優先事項
- 課題: スタッフ採用, 集患, Webマーケティング
- 優先事項: スタッフ採用, Webマーケティング
- 課題詳細: 求人に応募が少なく、SNS運用のノウハウが不足している

## 目標・計画
- 目標: 月商600万円達成, スタッフ12名体制
- 達成期限: 6ヶ月以内
- その他メモ: 開業1年目、駅前立地で集患力はあるが、スタッフ不足で診療時間を拡大できない

上記のデータから、このクリニックの強みと課題を抽出してください。
JSONフォーマットで返却してください。
```

**期待される出力**:
```json
{
  "strong_points": [
    "駅前立地で集患力が高い",
    "開業1年目で月商500万円を達成している",
    "スタッフ10名で一定の体制が整っている",
    "明確な目標（月商600万円、スタッフ12名）が設定されている"
  ],
  "challenges": [
    {
      "category": "スタッフ採用",
      "description": "求人応募が少なく、スタッフ採用が進まない。現状10名だが目標12名に対して2名不足。",
      "priority": "high"
    },
    {
      "category": "Webマーケティング",
      "description": "SNS運用のノウハウが不足しており、オンラインでの集患・ブランディングに課題がある。",
      "priority": "high"
    },
    {
      "category": "診療効率化",
      "description": "スタッフ不足により診療時間を拡大できず、ユニット稼働率が低下している可能性がある。",
      "priority": "medium"
    }
  ]
}
```

---

## 4. API統合実装

### 4.1 バックエンド実装（Python/FastAPI）

**ファイル**: `backend/src/services/ai_service.py`

```python
import os
import json
import requests
from typing import Dict, List, Any
from pydantic import BaseModel

class Challenge(BaseModel):
    category: str
    description: str
    priority: str  # 'high' | 'medium' | 'low'

class AnalysisResult(BaseModel):
    strong_points: List[str]
    challenges: List[Challenge]

class ClaudeApiService:
    def __init__(self):
        self.api_key = os.getenv('CLAUDE_API_KEY')
        self.model = os.getenv('CLAUDE_MODEL', 'claude-sonnet-4-5-20250929')
        self.max_tokens = int(os.getenv('CLAUDE_MAX_TOKENS', 1024))
        self.temperature = float(os.getenv('CLAUDE_TEMPERATURE', 0.7))
        self.base_url = 'https://api.anthropic.com/v1/messages'

    def analyze_hearing(self, response_data: Dict[str, Any]) -> AnalysisResult:
        """
        ヒアリング回答データをClaude APIで分析
        """
        system_prompt = self._get_system_prompt()
        user_prompt = self._generate_user_prompt(response_data)

        try:
            response = self._call_claude_api(system_prompt, user_prompt)
            result = self._parse_response(response)
            return result
        except Exception as e:
            raise Exception(f"Claude API分析失敗: {str(e)}")

    def _get_system_prompt(self) -> str:
        return """あなたは歯科医院の経営コンサルタントです。
ヒアリング回答データを分析し、クリニックの強みと課題を抽出してください。

## 分析方針
1. 強み: 3〜5個の箇条書き
2. 課題: カテゴリ別に整理し、優先度（high/medium/low）を付与

## 出力フォーマット
JSONフォーマットで返却してください。
{
  "strong_points": ["強み1", "強み2", ...],
  "challenges": [
    {"category": "カテゴリ名", "description": "課題詳細", "priority": "high|medium|low"}
  ]
}
"""

    def _generate_user_prompt(self, response_data: Dict[str, Any]) -> str:
        # 3.2節のプロンプトテンプレートを実装
        section1 = response_data['section1']
        section2 = response_data['section2']
        section3 = response_data['section3']

        prompt = f"""以下のヒアリング回答データを分析してください。

## 基本情報
- 月商: {section1['monthlyRevenue']:,}円
- スタッフ数: {section1['staffCount']}人
- 月間患者数: {section1['patientCount']}人
- ユニット数: {section1['unitCount']}台
"""
        # 以下省略（3.2節参照）

        return prompt

    def _call_claude_api(self, system_prompt: str, user_prompt: str, retries: int = 3) -> str:
        """
        Claude APIを呼び出し（リトライロジック付き）
        """
        headers = {
            'x-api-key': self.api_key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        }

        payload = {
            'model': self.model,
            'max_tokens': self.max_tokens,
            'temperature': self.temperature,
            'system': system_prompt,
            'messages': [
                {'role': 'user', 'content': user_prompt}
            ]
        }

        for attempt in range(retries):
            try:
                response = requests.post(
                    self.base_url,
                    headers=headers,
                    json=payload,
                    timeout=30
                )
                response.raise_for_status()

                data = response.json()
                return data['content'][0]['text']

            except requests.exceptions.Timeout:
                if attempt == retries - 1:
                    raise Exception("Claude APIタイムアウト")
                continue

            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 429:  # レート制限
                    if attempt == retries - 1:
                        raise Exception("Claude APIレート制限超過")
                    # 指数バックオフ
                    import time
                    time.sleep(2 ** attempt)
                    continue
                else:
                    raise Exception(f"Claude API HTTPエラー: {e.response.status_code}")

            except Exception as e:
                raise Exception(f"Claude API呼び出し失敗: {str(e)}")

    def _parse_response(self, response_text: str) -> AnalysisResult:
        """
        Claude APIレスポンスをパースしてAnalysisResultに変換
        """
        try:
            # JSON部分を抽出（```json ... ``` のマークダウンを除去）
            if '```json' in response_text:
                start = response_text.find('```json') + 7
                end = response_text.find('```', start)
                json_str = response_text[start:end].strip()
            else:
                json_str = response_text.strip()

            data = json.loads(json_str)

            # バリデーション
            if 'strong_points' not in data or 'challenges' not in data:
                raise ValueError("レスポンス形式が不正です")

            return AnalysisResult(**data)

        except Exception as e:
            raise Exception(f"レスポンスパースエラー: {str(e)}")
```

### 4.2 エンドポイント実装

**ファイル**: `backend/src/routers/hearings.py`

```python
from fastapi import APIRouter, BackgroundTasks, HTTPException
from services.ai_service import ClaudeApiService
from models.hearing import Hearing, HearingAnalysis

router = APIRouter()

@router.post("/api/hearings/{hearing_id}/analyze")
async def analyze_hearing(hearing_id: str, background_tasks: BackgroundTasks):
    """
    AI分析実行（非同期タスク）
    """
    # ヒアリング取得
    hearing = await get_hearing_by_id(hearing_id)
    if not hearing:
        raise HTTPException(status_code=404, detail="ヒアリングが見つかりません")

    # 分析レコード作成（status='processing'）
    analysis = HearingAnalysis(
        hearing_id=hearing_id,
        analysis_status='processing'
    )
    await save_analysis(analysis)

    # バックグラウンドタスクとして分析実行
    background_tasks.add_task(execute_analysis, hearing_id, hearing.response_data)

    return {"message": "AI分析を開始しました"}


async def execute_analysis(hearing_id: str, response_data: dict):
    """
    AI分析を実行してDBに保存
    """
    try:
        # Claude API呼び出し
        ai_service = ClaudeApiService()
        result = ai_service.analyze_hearing(response_data)

        # 分析結果をDBに保存
        await update_analysis(
            hearing_id=hearing_id,
            strong_points=result.strong_points,
            challenges=[c.dict() for c in result.challenges],
            analysis_status='completed'
        )

        # 企業マッチングロジック実行
        await execute_company_matching(hearing_id)

    except Exception as e:
        # エラー時はステータスを'failed'に更新
        await update_analysis(
            hearing_id=hearing_id,
            analysis_status='failed',
            error_message=str(e)
        )
```

---

## 5. トークン数見積もり

### 5.1 入力トークン数

| 項目 | トークン数 |
|------|----------|
| システムプロンプト | 約150トークン |
| ユーザープロンプト（基本情報） | 約100トークン |
| ユーザープロンプト（課題・優先事項） | 約50トークン |
| ユーザープロンプト（目標・計画） | 約50トークン |
| 自由記述欄（平均） | 約100トークン |
| **合計** | **約450トークン** |

### 5.2 出力トークン数

| 項目 | トークン数 |
|------|----------|
| 強み（3〜5個） | 約100トークン |
| 課題（3〜5個） | 約200トークン |
| **合計** | **約300トークン** |

### 5.3 1回分析あたりのコスト

```
入力: 450トークン × $3.00 / 1,000,000 = $0.00135
出力: 300トークン × $15.00 / 1,000,000 = $0.0045
合計: $0.00585 ≈ $0.006（約0.9円）
```

---

## 6. エラーハンドリング

### 6.1 エラー種類と対策

| エラー種類 | 対策 |
|-----------|------|
| APIキー不正 | 環境変数チェック、起動時にバリデーション |
| レート制限（429） | リトライロジック（指数バックオフ、最大3回） |
| タイムアウト | 30秒タイムアウト設定、リトライ |
| レスポンスパースエラー | try-catchでエラーログ記録、ステータス'failed'に設定 |
| ネットワークエラー | リトライロジック、エラーログ記録 |

### 6.2 エラーログ

**ログレベル**:
- INFO: API呼び出し開始・完了
- WARNING: リトライ発生
- ERROR: API呼び出し失敗、パースエラー

**ログフォーマット**:
```python
import logging

logger = logging.getLogger(__name__)

# INFO
logger.info(f"Claude API分析開始: hearing_id={hearing_id}")

# WARNING
logger.warning(f"Claude APIリトライ（{attempt + 1}/3回目）: hearing_id={hearing_id}")

# ERROR
logger.error(f"Claude API分析失敗: hearing_id={hearing_id}, error={str(e)}")
```

---

## 7. レート制限対策

### 7.1 Anthropic制限

- **レート制限**: 60リクエスト/分（Tier 1）
- **対策**: キュー管理（同時実行数を制限）

### 7.2 キュー管理実装

```python
import asyncio
from asyncio import Semaphore

# 同時実行数を10に制限
semaphore = Semaphore(10)

async def execute_analysis_with_semaphore(hearing_id: str, response_data: dict):
    async with semaphore:
        await execute_analysis(hearing_id, response_data)
```

---

## 8. パフォーマンス最適化

### 8.1 キャッシング

**対象**: なし（分析結果は毎回異なる可能性があるため）

### 8.2 非同期処理

**方式**: FastAPI BackgroundTasks

**理由**: ユーザーはAI分析完了を待たずに次の操作が可能

---

## 9. セキュリティ

### 9.1 個人情報保護

**送信データ**:
- 数値データ（月商、スタッフ数等）のみ送信
- 医院名、スタッフ名等の個人情報は送信しない

**Anthropicのデータ保持ポリシー**:
- APIリクエストデータは30日間保持（2025年12月時点）
- Trust & Safety（不正利用検知）目的のみ使用

### 9.2 ログ管理

**禁止事項**:
- APIキーをログに出力しない
- ヒアリング回答データの全文ログ出力を避ける（デバッグ時のみ）

---

## 10. テスト方針

### 10.1 ユニットテスト

**テスト対象**:
- プロンプト生成ロジック
- レスポンスパースロジック

**テストケース例**:
```python
def test_generate_user_prompt():
    response_data = {
        "section1": {
            "monthlyRevenue": 5000000,
            "staffCount": 10,
            "patientCount": 150,
            "unitCount": 4
        },
        # ...
    }
    prompt = ClaudeApiService()._generate_user_prompt(response_data)
    assert "月商: 5,000,000円" in prompt
    assert "スタッフ数: 10人" in prompt
```

### 10.2 統合テスト

**テスト対象**:
- Claude API呼び出し〜レスポンス取得
- エラーハンドリング

**注意事項**:
- 本番APIキーを使用しない（テスト用APIキー作成）
- レート制限に注意

---

## 11. 運用監視

### 11.1 監視項目

| 項目 | アラート条件 |
|------|------------|
| API呼び出し成功率 | 95%未満 |
| 平均レスポンス時間 | 10秒以上 |
| エラー発生率 | 5%以上 |
| 月間コスト | $10超過 |

### 11.2 ダッシュボード

**表示項目**:
- 日次API呼び出し回数
- 成功/失敗の内訳
- 平均レスポンス時間
- 月間累計コスト

---

**作成者**: Claude Code
**最終更新日**: 2025-12-26
