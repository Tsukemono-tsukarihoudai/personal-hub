# personal-hub CLAUDE.md

## MDファイルの役割

| ファイル | 用途 |
|---|---|
| H:\Claude\notes\personal-hub\context.md | 現在地・ブロッカー・次のアクション |
| H:\Claude\notes\personal-hub\progress.md | 実装詳細・完了条件・変更履歴 |
| H:\Claude\notes\personal-hub\spec-*.md | 仕様定義 |
| H:\Claude\notes\personal-hub\cc-prompt-ux.md | フェーズ2プロンプト置き場 |

## 作業前

対象ファイルを読んでから修正する。読まずに修正しない。

## 作業中の自律検証（pushの前に必ず実行）

**V-match**: 期待する文字列・値が対象ファイルに存在するか確認する。
存在しない場合は修正してから次に進む。

**V-build**: `npm run build` を実行しtscエラー0を確認する。
エラーがあれば修正してから次に進む。

## 作業後のMD更新

**progress.md**
- 変更履歴テーブルに1行追記
- 完了した完了条件チェック項目を [x] に変更

**context.md**
- ブロッカーを更新（解消→削除、新規→追加）
- 作業ログに1行追加（6件目以降を削除して5件以内に保つ）
- 次のアクションを更新
- 50行を超えたら progress.md に移動して圧縮する

## Chatへの報告フォーマット

```
変更: [ファイル名] - [1行要約]
V-match: ✅/❌ [確認した値]
V-build: ✅/❌
push: ✅ / 待機中（[理由]）
```

全文表示はChatから明示的に求められた場合のみ行う。

## 外部待機中（rate limit・デプロイ待ち等）

次の作業のV-match・V-buildを完了させてからpushを待機する。
ブロッカーをcontext.mdに記録する。

## progress.md のサイズ管理

400行を超えたら以下を圧縮する：
- ✅完了の完了条件チェック項目 → 削除
- 完了済みのフェーズ2実装指示 → 変更履歴に1行記録して削除
- セットアップ手順 → 「完了済み」と1行記録して削除
