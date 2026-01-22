# Page snapshot

```yaml
- generic [ref=e6]:
  - paragraph [ref=e7]: MA-Pilot
  - tablist [ref=e10]:
    - tab "ログイン" [selected] [ref=e11] [cursor=pointer]
    - tab "アカウント作成" [ref=e12] [cursor=pointer]
  - generic [ref=e14]:
    - generic [ref=e15]:
      - generic [ref=e16]:
        - text: メールアドレス
        - generic [ref=e17]: "*"
      - generic [ref=e18]:
        - textbox "メールアドレス" [active] [ref=e19]:
          - /placeholder: your@email.com
        - group:
          - generic: メールアドレス *
    - generic [ref=e20]:
      - generic:
        - text: パスワード
        - generic: "*"
      - generic [ref=e21]:
        - textbox "パスワード" [ref=e22]:
          - /placeholder: パスワードを入力
        - group:
          - generic: パスワード *
    - button "ログイン" [ref=e23] [cursor=pointer]: ログイン
    - button "パスワードを忘れた場合" [ref=e25] [cursor=pointer]
```