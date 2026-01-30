# LLM API Key Validator

LLM（GPT / Gemini / Claude）のAPIキーの有効性をチェックするChrome拡張機能。

## 対応サービス

| サービス | キー形式 |
|---------|---------|
| OpenAI (GPT) | `sk-...` |
| Anthropic (Claude) | `sk-ant-...` |
| Google (Gemini) | `AIza...` |

## インストール

1. このリポジトリをクローン
2. Chromeで `chrome://extensions` を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. クローンしたフォルダを選択

## 使い方

1. 拡張機能アイコンをクリック
2. APIキーを入力
3. 「チェック」ボタンをクリック
4. 結果が表示される

## ファイル構成

```
├── manifest.json   # 拡張機能の設定
├── popup.html      # UI
├── popup.css       # スタイル
└── popup.js        # 検証ロジック
```

## 注意事項

- APIキーは外部に送信されません（各サービスのAPIエンドポイントへの検証リクエストのみ）
- Anthropic APIの検証には最小限のリクエスト（1トークン）を送信します
