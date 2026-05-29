import { cookies, headers } from "next/headers";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-session";
import AdminDashboard from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

const SCOPE_LABEL: Record<string, string> = {
  developer: "開発者（全情報）",
  super: "代表・副代表（全権）",
  dept: "部門長・副部門長",
};

function authorizeUrl(origin: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID ?? process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? "";
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: `${origin}/admin/callback`,
    scope: "identify",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

const ERROR_MESSAGE: Record<string, string> = {
  no_code: "認証コードがありません。もう一度お試しください。",
  token: "Discord認証に失敗しました。",
  user: "Discordユーザー情報の取得に失敗しました。",
  forbidden: "この機能を利用する権限がありません。",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get(ADMIN_COOKIE)?.value);

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "";
  const origin = `${proto}://${host}`;

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f8fafc" }}>
        <div className="card p-8 max-w-sm w-full text-center">
          <h1 className="text-xl font-black mb-2" style={{ color: "#111827" }}>管理画面</h1>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Discordアカウントでログインしてください。</p>
          {error && ERROR_MESSAGE[error] && (
            <p className="text-sm mb-4" style={{ color: "#dc2626" }}>{ERROR_MESSAGE[error]}</p>
          )}
          <a
            href={authorizeUrl(origin)}
            className="inline-block w-full px-4 py-2.5 rounded-lg font-bold text-white"
            style={{ background: "#5865F2" }}
          >
            Discordでログイン
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6" style={{ background: "#f8fafc" }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black" style={{ color: "#111827" }}>管理画面</h1>
          <form action="/admin/logout" method="post">
            <button type="submit" className="text-sm font-bold" style={{ color: "#6b7280" }}>ログアウト</button>
          </form>
        </div>
        <div className="card p-5 mb-6">
          <p className="text-sm" style={{ color: "#374151" }}>
            ようこそ、<span className="font-bold">{session.name}</span> さん
          </p>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            権限: {SCOPE_LABEL[session.scope] ?? session.scope}
            {session.dept && `（${session.dept}）`}
          </p>
        </div>
        <AdminDashboard scope={session.scope} />
      </div>
    </main>
  );
}
