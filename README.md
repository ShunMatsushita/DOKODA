# DOKODA (どこだ？)

**[遊ぶ → https://dokoda-ux9t.onrender.com/](https://dokoda-ux9t.onrender.com/)**

ドブル（Dobble / Spot It!）にインスパイアされたオンラインパーティーカードゲーム。

どの2枚のカードにも **必ず1つだけ共通するシンボル** があります。他のプレイヤーより先に見つけてタップしましょう！

## 特徴

- 2〜8人のオンラインマルチプレイヤー対戦
- 射影平面（位数7）に基づく57枚のカード、各8シンボル
- 57種のオリジナルSVGシンボル（自然・動物・食べ物・日本テーマなど）
- 3つのゲームモード
- リアルタイム WebSocket 通信
- ホストによるゲーム設定カスタマイズ

## ゲームモード

| モード | ルール | 勝利条件 |
|--------|--------|----------|
| **ザ・タワー** | 中央カードと手札の共通シンボルを見つける | 手札を最初になくした人の勝ち |
| **ザ・ウェル** | 中央カードと手元カードの共通シンボルを見つける | 最も多くカードを獲得した人の勝ち |
| **タイムアタック** | 全員で協力して共通シンボルを見つける | 制限時間内に全カードクリアで勝利 |

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Node.js + Express + Socket.io
- **共有パッケージ**: TypeScript（型定義・カード生成ロジック・定数）
- **構成**: npm workspaces によるモノレポ

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（フロント: 5173 / バック: 3001）
npm run dev

# ビルド
npm run build
```

## プロジェクト構成

```
DOKODA/
├── shared/          # 共有パッケージ（型定義・カード生成・定数）
│   └── src/
│       ├── types.ts
│       ├── cards.ts
│       └── constants.ts
├── server/          # バックエンド（Express + Socket.io）
│   └── src/
│       ├── index.ts
│       ├── room.ts
│       ├── game.ts
│       └── events.ts
├── client/          # フロントエンド（React + Vite）
│   └── src/
│       ├── App.tsx
│       ├── pages/       # Home, Lobby, Countdown, Game, Result
│       ├── components/  # Card, Rules
│       ├── symbols/     # 57種のSVGシンボル
│       └── styles/
└── package.json     # ワークスペース設定
```

## 遊び方

1. トップ画面で名前を入力して「部屋を作る」
2. 表示されるルームコードを他のプレイヤーに共有
3. 他のプレイヤーはルームコードを入力して「参加する」
4. ホストがゲームモード・設定を選んで「ゲーム開始」
5. 2枚のカードに共通するシンボルを見つけてタップ！

## デプロイ (Render)

Render で Web Service を手動作成:

| 設定項目 | 値 |
|----------|-----|
| **Environment** | Node |
| **Build Command** | `npm ci --include=dev && npm run build` |
| **Start Command** | `NODE_ENV=production node server/dist/index.js` |
| **Environment Variable** | `NODE_ENV` = `production` |

本番ではサーバーがAPI・WebSocket・フロントエンド静的ファイルを一括配信します。

## ライセンス

MIT
