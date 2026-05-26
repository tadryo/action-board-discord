interface Props {
  message: string;
}

export default function ErrorScreen({ message }: Props) {
  return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-sm px-4">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="font-bold mb-2" style={{ color: "#dc2626" }}>エラーが発生しました</p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>{message}</p>
      </div>
    </div>
  );
}
