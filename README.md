## URL
### テスト環境(Devブランチ⇒CloudRun)
※サーバーレスなので暫くするとデータは揮発します<br>
https://homepage-tlnesjcoqq-an.a.run.app/


# ホームページとWebアプリ 
ホームページに、色々なWebアプリをどんどん追加する構成です  
## アプリ一覧
- チャットアプリ  
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
┃┃┣main.html (アプリ本体ののhtml)  
┃┃┣favicon.ico (ファビコン)  
┃┃┗robots.txt (googleクローラー等への指示)  
┃┣Typescript/ (フロントエンド関係)  
┃┃┣tsx/ (フロントエンドソースコード置き場)  
┃┃┃┣applicaton (Webアプリ本体)  
┃┃┃┣component (コンポーネント置き場)  
┃┃┃┣stylecheets (sass置き場)  
┃┃┃┗index.tsx (main.htmlから呼び出される基幹)  
┃┃┣tsconfig.json (Typescript設定)  
┃┃┗webpack.config.js (Webpack設定)  
┃┣Flask/ (バックエンドAPI置き場)  
┃┣requirements.txt (必要なライブラリ一覧)  
┃┣Dockerfile (環境構築方法の記述,CaaSへのデプロイ用)  
┃┗wsgi.py (Flask鯖本体/ルーティング等の処理実装箇所)  
┣assets (README.mdで使う画像置き場)  
┣.gitignore (git pushでpushしたくないファイル一覧)  
┣cloudbuild.yaml (CaaSへのデプロイ指示書)  
┣LICENSE (MIT: ご自由にお使いください)  
┗README.md この文書  


### どういう経緯で作られたの
元々就活の為に作ったアプリで、
就活再開とオンプレ環境で動くようにしたかったため再整備しているものです
旧レポジトリ
https://github.com/jSm449g4d/PF_apps


## Q.どうして↑の様なディレクトリ構成になったの?
#### A. 単に迷走しているだけです
Flask(Python)を**wsgi+Apache2.4+ubuntu**のサーバー上で運用する用途で開発された  
↓<br>
フロントエンドが弱いと指摘を受けてReact(Typescript)を導入  
↓<br>
デプロイの手間を省きたかったのでCloudBuild+CloudRunを導入  
↓<br>
各機能をFaaS(CloudRun)などに突っ込んで外部化しても個別に動くように、アイソレーションな仕組みにしよう(迷走)  
↓<br>
Firebase(BaaS)の導入⇒使い勝手が良くなかったので脱BaaS化  
