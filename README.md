## URL

### テスト環境(Dev ブランチ ⇒CloudRun)

※サーバーレスなので暫くするとデータは揮発します<br>
https://homepage-tlnesjcoqq-an.a.run.app/

# ホームページと Web アプリ
ホームページに、色々な Web アプリをどんどん追加する構成です

## アプリ一覧
- チャットアプリ
- 栄養計算アプリ(開発中)

## 使用技術
### インフラ
- テスト環境: GCP(Cloudbuild, CloudRun) + Debian + Waitress
- 本番環境: 現在工事中
### フロントエンド
- React(Typescript)
- Redux
### バックエンド
- Flask(Python)
- SQLite3
### その他
- Sass
- Docker
- Webpack4
- bootstrap5
- fontawesome

## ディレクトリ構成
homepage/  
┣www/ (アプリ本体)  
┃┣html/ (公開ファイル置き場)  
┃┃┣static/(静的ファイル置き場)  
┃┃┃┣src/(アプリ本体のスクリプト置き場)  
┃┃┃┗img/(アプリで使う画像置き場)  
┃┃┣main.html (アプリ本体のの html)  
┃┃┣favicon.ico (ファビコン)  
┃┃┗robots.txt (google クローラー等への指示)  
┃┣Flask/ (バックエンド関係)  
┃┃┃┗(FlaskAPI モジュール連)  
┃┃┃ ┣config.json(main.py 単体運用用)  
┃┃┃ ┣main.html(main.py 単体運用用)  
┃┃┃ ┣main.py(FlaskAPI 本体)  
┃┃┃ ┗requirements.txt(main.py 単体運用用)  
┃┣Typescript/ (フロントエンド関係)  
┃┃┣tsx/ (フロントエンドソースコード置き場)  
┃┃┃┣applicaton (Web アプリ本体)  
┃┃┃┣component (コンポーネント置き場)  
┃┃┃┣stylecheets (sass 置き場)  
┃┃┃┗index.tsx (main.html から呼び出される基幹)  
┃┃┣tsconfig.json (Typescript 設定)  
┃┃┗webpack.config.js (Webpack 設定)  
┃┣tmp/ (揮発性ファイル置き場)  
┃┣keys/ (鍵置き場)  
┃┣requirements.txt (必要なライブラリ一覧)  
┃┣Dockerfile (環境構築方法の記述,CaaS へのデプロイ用)  
┃┗wsgi.py (Flask 鯖本体/ルーティング等の処理実装箇所)  
┣assets (README.md で使う画像置き場)  
┣.gitignore (git push で push したくないファイル一覧)  
┣cloudbuild.yaml (CaaS へのデプロイ指示書)  
┣LICENSE (MIT: ご自由にお使いください)  
┗README.md この文書

## 動かし方
/www/Dockerfile に書いてある通りに作業ば多分動きます

### どういう経緯で作られたの
元々就活の為に作ったアプリで、
就活再開とオンプレ環境で動くようにしたかったため再整備しているものです  
旧レポジトリ
https://github.com/jSm449g4d/PF_apps

## Q.どうして ↑ の様なディレクトリ構成になったの?
#### A. 単に迷走しているだけです
Flask(Python)を**wsgi+Apache2.4+ubuntu**の VPS 上で運用し、  
同 VPS にてリソースを**Apache2.4+wordpress**と共存させる仕様で開発された  
↓<br>
フロントエンドが弱いと指摘を受けて React(Typescript)を導入  
↓<br>
デプロイの手間を省きたかったので CloudBuild+CloudRun を導入  
↓<br>
各機能を FaaS(CloudFunction)などに突っ込んで外部化しても個別に動くように、アイソレーションな仕組みにしよう(迷走)  
↓<br>
Firebase(BaaS)の導入 ⇒ 使い勝手が良くなかったので脱 BaaS 化
#### 特徴
本番環境であるApache2.4のwwwフォルダに、このアプリのwwwフォルダをそのまま投入すれば動く様に設計しました。  
嘗てはwsgiを使うことを前提にしており、その名残で本体もwsgi.pyという名称です。  
しかし、waitressでサーバーを立てて逆串刺す方が手早いという結論に(名前詐欺)...  
/www/Flask/及び/www/Typescript/tsx/application/に入っている各モジュールは、  
wsgi.pyやindex.tsxが必要に応じて動的インポートする設計です。  
このようなアイソレーション化により、各種アプリや機能の交換や拡張が容易になります。  
特に、/www/Flask/の各モジュールは単体でもサーバーを建て、機能させることもできる仕様に設計しました。  
