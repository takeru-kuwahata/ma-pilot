# Page snapshot

```yaml
- generic [ref=e6]:
  - paragraph [ref=e7]: MA-Pilot
  - tablist [ref=e10]:
    - tab "ログイン" [selected] [ref=e11] [cursor=pointer]: ログイン
    - tab "アカウント作成" [ref=e12] [cursor=pointer]
  - generic [ref=e14]:
    - generic [ref=e15]:
      - generic:
        - text: メールアドレス
        - generic: "*"
      - generic [ref=e16]:
        - textbox "メールアドレス" [ref=e17]:
          - /placeholder: your@email.com
        - group:
          - generic: メールアドレス *
    - generic [ref=e18]:
      - generic:
        - text: パスワード
        - generic: "*"
      - generic [ref=e19]:
        - textbox "パスワード" [ref=e20]:
          - /placeholder: パスワードを入力
        - group:
          - generic: パスワード *
    - button "ログイン" [ref=e21] [cursor=pointer]: ログイン
    - button "パスワードを忘れた場合" [active] [ref=e23] [cursor=pointer]
```