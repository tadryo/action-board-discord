-- 既存の提案の提案者名を、users に同期済みのサーバーニックネームで補正する。
-- 以前はDiscordのグローバル名/ユーザー名を保存していたため、ニックネームと食い違っていた。
UPDATE mission_proposals mp
   SET proposed_by_username = u.username
  FROM users u
 WHERE u.discord_user_id = mp.proposed_by_discord_id;
