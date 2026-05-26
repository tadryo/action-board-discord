export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
        />
        <p className="text-sm" style={{ color: "var(--muted)" }}>Discordで認証中...</p>
      </div>
    </div>
  );
}
