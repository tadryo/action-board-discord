interface Props {
  message: string;
}

export default function ErrorScreen({ message }: Props) {
  return (
    <div className="flex items-center justify-center h-screen bg-mirai-bg">
      <div className="text-center max-w-sm px-4">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="text-mirai-danger font-medium mb-2">エラーが発生しました</p>
        <p className="text-mirai-muted text-sm">{message}</p>
      </div>
    </div>
  );
}
