# review-slot-watcher-42

## 想定する利用者

42-Tokyo に所属する学生

## 概要

このリポジトリは、42-Tokyo でのレビュースロットを監視するために作られました
`FT_URL` に監視したいスロットのURLを記述し、cronで提起実行することで、Slotを監視することができます。
現在はDiscordのWebhookを `DISCORD_WEBHOOK_URL` に記述するこによって、特定のChannelにSlot情報を投稿するようになっています。

[Intro to Webhooks – Discord](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks)

## local で使用する場合

- 最低でも、 node, yarn, chromium のインストールが必要です(現状Linuxでのみ動作確認をしています)
- install の方法
  - node の install
    - [OS の package manager 経由](https://nodejs.dev/download/package-manager/)
    - [nvm 経由](https://github.com/nvm-sh/nvm)
    - [nodenv, anyenv 経由](https://github.com/nodenv/nodenv)
  - [yarn の install](https://classic.yarnpkg.com/lang/en/docs/install/#debian-stable)
  - chromium の install

### 動作を確認する

```bash
$ git clone ssh://git@github.com/AkkyOrz/review-slot-watcher-42
$ cd review-slot-watcher-42
$ cat << EOF > .env
TOKYO_42_USERNAME="sample_user"
TOKYO_42_PASSWORD="password"
FT_URL="https://projects.intra.42.fr/projects/<project-name>/slots?team_id=<id>"
DISCORD_WEBHOOK_URL="<webhook-url>"
ENVIRONMENT=browser # ブラウザのキャッシュを使用したい場合に指定する
BROWSER_EXECUTABLE_PATH="/snap/bin/chromium" # snapでinstallしたchromiumの場合 (which chromium-browserで取得可能)
USER_DATA_DIR="/home/<username>/snap/chromium/common/chromium" # snapでinstallしたchromiumの場合 (chrome://versionを確認するとそれっぽいものが確認できるかも)
EOF
$ npm install -g yarn
$ yarn
$ yarn start # headless mode
# yarn dev でブラウザが起動する
```

### cron で毎日決まった時刻に起動する

> (注意)
> 常時稼働しているマシンを自宅に持っている方向けです(デスクトップ PC とかでも大丈夫です)

```bash
$ crontab -e
# example
1,16,31,46 * * * * /path/to/yarn --cwd /path/to/review-slot-watcher-42 start 2>> /path/to/error.log >> /path/to/result.log
```

うまく行かない場合はログファイルを確認してみると解決するかもしれません。

## 貢献

Issue/PR をお待ちしています。
なにか問題や質問などあれば @akito 宛にメンション・DM をしてください。
