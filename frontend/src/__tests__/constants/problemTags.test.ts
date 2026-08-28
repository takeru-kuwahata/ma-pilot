import { describe, it, expect } from 'vitest';
import { PROBLEM_TAGS } from '../../constants/problemTags';

describe('PROBLEM_TAGS', () => {
  it('「その他」を選択候補に含む（2026-08-29 安堂さん依頼）', () => {
    expect(PROBLEM_TAGS).toContain('その他');
  });

  it('既存の課題タグを取りこぼしていない', () => {
    const existing = [
      '集患_Web', '集患_MEO', '集患_SNS',
      '自費_カウンセリング', '自費_メニュー設計',
      'コスト_材料費', 'コスト_固定費',
      'スタッフ研修', 'リコール_システム', '予約_自動化',
      '人材育成', '増患', '収益増加', '診療業務サポート',
      '福利厚生', 'サービス代行', '節税/助成金/保険',
    ];
    existing.forEach((tag) => expect(PROBLEM_TAGS).toContain(tag));
  });

  it('重複や空文字を含まない', () => {
    expect(new Set(PROBLEM_TAGS).size).toBe(PROBLEM_TAGS.length);
    PROBLEM_TAGS.forEach((tag) => expect(tag.trim()).not.toBe(''));
  });
});
