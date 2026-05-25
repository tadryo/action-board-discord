export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-discord-bg">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-discord-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-discord-muted text-sm">Discordで認証中...</p>
      </div>
    </div>
  );
}
