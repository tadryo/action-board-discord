"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AdminRow, AdminScope, CategoryRow, DepartmentRow, MissionProposalRow, MissionRow, ProposalStatus, SubmissionType } from "@/types/database";

const SUBMISSION_LABEL: Record<SubmissionType, string> = {
  NONE: "提出なし",
  TEXT: "テキスト",
  LINK: "リンク",
};

const SCOPE_OPTIONS: { value: AdminScope; label: string }[] = [
  { value: "dept", label: "部門長・副部門長" },
  { value: "super", label: "代表・副代表" },
  { value: "developer", label: "開発者" },
];

// アクティビティからは Bearer トークン、/admin からは Cookie で認証する。
// トークンがあれば全リクエストに Authorization ヘッダを付ける。
const TokenContext = createContext<string | undefined>(undefined);

function useApiFetch() {
  const token = useContext(TokenContext);
  return useCallback(
    (path: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetch(path, { ...init, headers, cache: "no-store" });
    },
    [token],
  );
}

interface Props {
  scope: AdminScope;
  accessToken?: string;
  selfDiscordId?: string | null;
}

type Tab = "proposals" | "missions" | "admins";

const TAB_LABEL: Record<Tab, string> = {
  proposals: "提案承認",
  missions: "ミッション管理",
  admins: "メンバー権限",
};

export default function AdminDashboard({ scope, accessToken, selfDiscordId }: Props) {
  const canManage = scope === "super" || scope === "developer";
  const tabs: Tab[] = canManage ? ["proposals", "missions", "admins"] : ["proposals"];
  const [tab, setTab] = useState<Tab>("proposals");

  return (
    <TokenContext.Provider value={accessToken}>
      <div>
        <div className="flex gap-2 mb-5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-full text-sm font-bold"
              style={tab === t ? { background: "#0f766e", color: "#fff" } : { background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
        {tab === "proposals" && <ProposalsManager />}
        {tab === "missions" && canManage && <MissionsManager />}
        {tab === "admins" && canManage && <AdminsManager selfDiscordId={selfDiscordId} />}
      </div>
    </TokenContext.Provider>
  );
}

const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  pending: "承認待ち",
  approved: "承認済み",
  rejected: "却下",
};

function ProposalsManager() {
  const apiFetch = useApiFetch();
  const [proposals, setProposals] = useState<MissionProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch("/api/admin/proposals");
    if (res.ok) {
      const data = (await res.json()) as { proposals: MissionProposalRow[] };
      setProposals(data.proposals);
    }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    setMsg(null);
    const res = await apiFetch(`/api/admin/proposals/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusyId(null);
    if (res.ok) {
      setRejecting(null);
      setReason("");
      load();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(data.error ?? "処理に失敗しました");
    }
  };

  if (loading) return <p className="text-sm" style={{ color: "#6b7280" }}>読み込み中…</p>;

  const pending = proposals.filter((p) => p.status === "pending");
  const history = proposals.filter((p) => p.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      {msg && <p className="text-sm" style={{ color: "#dc2626" }}>{msg}</p>}

      <div>
        <h3 className="font-bold text-sm mb-2" style={{ color: "#111827" }}>承認待ち（{pending.length}）</h3>
        <div className="flex flex-col gap-3">
          {pending.map((p) => (
            <div key={p.id} className="card p-4 flex flex-col gap-2">
              <p className="font-bold text-sm" style={{ color: "#111827" }}>{p.title}</p>
              {p.description && <p className="text-xs" style={{ color: "#6b7280" }}>{p.description}</p>}
              <p className="text-xs" style={{ color: "#6b7280" }}>提案者: {p.proposed_by_username ?? p.proposed_by_discord_id}・難易度{p.difficulty}・{p.points}P</p>
              {rejecting === p.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="border rounded px-2 py-1.5 text-sm"
                    rows={3}
                    placeholder="却下理由を詳述（10文字以上・記録として保存されます）"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button disabled={busyId === p.id} onClick={() => act(p.id, { action: "reject", review_reason: reason })} className="px-3 py-1.5 rounded-lg font-bold text-white text-sm" style={{ background: "#dc2626" }}>却下を確定</button>
                    <button onClick={() => { setRejecting(null); setReason(""); }} className="px-3 py-1.5 rounded-lg font-bold text-sm" style={{ background: "#f3f4f6", color: "#374151" }}>戻る</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button disabled={busyId === p.id} onClick={() => act(p.id, { action: "approve" })} className="px-3 py-1.5 rounded-lg font-bold text-white text-sm" style={{ background: "#0f766e" }}>承認</button>
                  <button onClick={() => { setRejecting(p.id); setReason(""); }} className="px-3 py-1.5 rounded-lg font-bold text-sm" style={{ background: "#fef2f2", color: "#dc2626" }}>却下</button>
                </div>
              )}
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm" style={{ color: "#6b7280" }}>承認待ちの提案はありません。</p>}
        </div>
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-2" style={{ color: "#111827" }}>処理済み</h3>
          <div className="flex flex-col gap-2">
            {history.map((p) => (
              <div key={p.id} className="card p-3">
                <p className="text-sm" style={{ color: "#111827" }}>
                  {p.title} <span className="font-bold" style={{ color: p.status === "approved" ? "#0f766e" : "#dc2626" }}>{PROPOSAL_STATUS_LABEL[p.status]}</span>
                </p>
                {p.status === "rejected" && p.review_reason && (
                  <p className="text-xs mt-1" style={{ color: "#6b7280" }}>却下理由: {p.review_reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MissionsManager() {
  const apiFetch = useApiFetch();
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch("/api/admin/missions");
    if (res.ok) {
      const data = (await res.json()) as { missions: MissionRow[]; categories: CategoryRow[] };
      setMissions(data.missions);
      setCategories(data.categories);
    }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  // 「みんなでやろう」カテゴリのみ管理対象
  const generalCategories = categories.filter((c) => c.group_key !== "dept");

  if (loading) return <p className="text-sm" style={{ color: "#6b7280" }}>読み込み中…</p>;

  return (
    <div className="flex flex-col gap-6">
      {msg && <p className="text-sm" style={{ color: "#dc2626" }}>{msg}</p>}
      <CreateMissionForm categories={generalCategories} onCreated={load} onError={setMsg} />
      <div className="flex flex-col gap-2">
        {generalCategories.map((c) => (
          <CategoryFolder
            key={c.slug}
            category={c}
            missions={missions.filter((m) => m.category_slug === c.slug)}
            onSaved={load}
            onError={setMsg}
          />
        ))}
        {generalCategories.length === 0 && (
          <p className="text-sm" style={{ color: "#6b7280" }}>カテゴリがありません。</p>
        )}
      </div>
    </div>
  );
}

function CategoryFolder({ category, missions, onSaved, onError }: {
  category: CategoryRow;
  missions: MissionRow[];
  onSaved: () => void;
  onError: (m: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: "#f9fafb" }}
      >
        <span className="font-bold text-sm flex items-center gap-2" style={{ color: "#111827" }}>
          <span style={{ color: "#6b7280" }}>{open ? "📂" : "📁"}</span>
          {category.title}
          <span className="font-normal" style={{ color: "#9ca3af" }}>（{missions.length}）</span>
        </span>
        <span style={{ color: "#9ca3af" }}>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 p-3" style={{ borderTop: "1px solid #f3f4f6" }}>
          {missions.map((m) => (
            <MissionRowEditor key={m.id} mission={m} onSaved={onSaved} onError={onError} />
          ))}
          {missions.length === 0 && (
            <p className="text-sm" style={{ color: "#6b7280" }}>このカテゴリにミッションはありません。</p>
          )}
        </div>
      )}
    </div>
  );
}

function CreateMissionForm({ categories, onCreated, onError }: {
  categories: CategoryRow[];
  onCreated: () => void;
  onError: (m: string | null) => void;
}) {
  const apiFetch = useApiFetch();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    difficulty: 1,
    points: 10,
    submission_type: "NONE" as SubmissionType,
    max_achievement_count: "",
    category_slug: categories[0]?.slug ?? "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    onError(null);
    const res = await apiFetch("/api/admin/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug,
        title: form.title,
        description: form.description || null,
        difficulty: Number(form.difficulty),
        points: Number(form.points),
        submission_type: form.submission_type,
        max_achievement_count: form.max_achievement_count ? Number(form.max_achievement_count) : null,
        category_slug: form.category_slug,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setForm((f) => ({ ...f, slug: "", title: "", description: "", max_achievement_count: "" }));
      setOpen(false);
      onCreated();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      onError(data.error ?? "作成に失敗しました");
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="self-start px-4 py-2 rounded-lg font-bold text-white text-sm" style={{ background: "#0f766e" }}>
        ＋ 新しいミッション
      </button>
    );
  }

  return (
    <div className="card p-4 flex flex-col gap-2">
      <Input label="slug（英小文字・数字・-）" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
      <Input label="タイトル" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
      <Input label="説明" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      <div className="flex gap-2">
        <NumberInput label="難易度(1-5)" value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v })} />
        <NumberInput label="ポイント" value={form.points} onChange={(v) => setForm({ ...form, points: v })} />
      </div>
      <label className="text-sm font-bold" style={{ color: "#374151" }}>カテゴリ
        <select className="block w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold" style={{ color: "#374151" }}>提出タイプ
        <select className="block w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.submission_type} onChange={(e) => setForm({ ...form, submission_type: e.target.value as SubmissionType })}>
          {(["NONE", "TEXT", "LINK"] as SubmissionType[]).map((s) => <option key={s} value={s}>{SUBMISSION_LABEL[s]}</option>)}
        </select>
      </label>
      <Input label="達成上限回数（空=無制限）" value={form.max_achievement_count} onChange={(v) => setForm({ ...form, max_achievement_count: v })} />
      <div className="flex gap-2 mt-1">
        <button disabled={saving} onClick={submit} className="px-4 py-2 rounded-lg font-bold text-white text-sm" style={{ background: "#0f766e" }}>{saving ? "保存中…" : "作成"}</button>
        <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg font-bold text-sm" style={{ background: "#f3f4f6", color: "#374151" }}>キャンセル</button>
      </div>
    </div>
  );
}

function MissionRowEditor({ mission, onSaved, onError }: {
  mission: MissionRow;
  onSaved: () => void;
  onError: (m: string | null) => void;
}) {
  const apiFetch = useApiFetch();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    title: mission.title,
    description: mission.description ?? "",
    difficulty: mission.difficulty,
    points: mission.points,
    submission_type: mission.submission_type,
    max_achievement_count: mission.max_achievement_count?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    onError(null);
    const res = await apiFetch(`/api/admin/missions/${mission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setEdit(false);
      onSaved();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      onError(data.error ?? "更新に失敗しました");
    }
  };

  if (!edit) {
    return (
      <div className="card p-3 flex items-center justify-between" style={mission.is_hidden ? { opacity: 0.5 } : undefined}>
        <div>
          <p className="font-bold text-sm" style={{ color: "#111827" }}>{mission.title} {mission.is_hidden && "（非表示）"}</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>難易度{mission.difficulty}・{mission.points}P・{SUBMISSION_LABEL[mission.submission_type]}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEdit(true)} className="text-sm font-bold" style={{ color: "#0f766e" }}>編集</button>
          <button disabled={saving} onClick={() => patch({ is_hidden: !mission.is_hidden })} className="text-sm font-bold" style={{ color: "#6b7280" }}>
            {mission.is_hidden ? "表示" : "非表示"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 flex flex-col gap-2">
      <Input label="タイトル" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
      <Input label="説明" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      <div className="flex gap-2">
        <NumberInput label="難易度(1-5)" value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v })} />
        <NumberInput label="ポイント" value={form.points} onChange={(v) => setForm({ ...form, points: v })} />
      </div>
      <Input label="達成上限回数（空=無制限）" value={form.max_achievement_count} onChange={(v) => setForm({ ...form, max_achievement_count: v })} />
      <div className="flex gap-2 mt-1">
        <button disabled={saving} onClick={() => patch({
          title: form.title,
          description: form.description || null,
          difficulty: Number(form.difficulty),
          points: Number(form.points),
          submission_type: form.submission_type,
          max_achievement_count: form.max_achievement_count ? Number(form.max_achievement_count) : null,
        })} className="px-4 py-2 rounded-lg font-bold text-white text-sm" style={{ background: "#0f766e" }}>{saving ? "保存中…" : "保存"}</button>
        <button onClick={() => setEdit(false)} className="px-4 py-2 rounded-lg font-bold text-sm" style={{ background: "#f3f4f6", color: "#374151" }}>キャンセル</button>
      </div>
    </div>
  );
}

interface BoardMember {
  discord_user_id: string;
  username: string | null;
  avatar: string | null;
}

function AdminsManager({ selfDiscordId }: { selfDiscordId?: string | null }) {
  const apiFetch = useApiFetch();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ discord_user_id: "", username: "", title: "部門長", scope: "dept" as AdminScope, department: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [adminsRes, usersRes] = await Promise.all([
      apiFetch("/api/admin/admins"),
      apiFetch("/api/admin/users"),
    ]);
    if (adminsRes.ok) {
      const data = (await adminsRes.json()) as { admins: AdminRow[]; departments: DepartmentRow[] };
      setAdmins(data.admins);
      setDepartments(data.departments);
      setForm((f) => ({ ...f, department: f.department || data.departments[0]?.slug || "" }));
    }
    if (usersRes.ok) {
      const data = (await usersRes.json()) as { users: BoardMember[] };
      setMembers(data.users);
    }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setSaving(true);
    setMsg(null);
    const res = await apiFetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discord_user_id: form.discord_user_id,
        username: form.username || null,
        title: form.title,
        scope: form.scope,
        department: form.scope === "dept" ? form.department : null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setForm((f) => ({ ...f, discord_user_id: "", username: "" }));
      load();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(data.error ?? "保存に失敗しました");
    }
  };

  const revoke = async (discordId: string) => {
    setMsg(null);
    const res = await apiFetch(`/api/admin/admins/${discordId}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(data.error ?? "削除に失敗しました");
    }
  };

  const deptName = (slug: string | null) => departments.find((d) => d.slug === slug)?.name ?? slug ?? "";

  if (loading) return <p className="text-sm" style={{ color: "#6b7280" }}>読み込み中…</p>;

  return (
    <div className="flex flex-col gap-6">
      {msg && <p className="text-sm" style={{ color: "#dc2626" }}>{msg}</p>}
      <div className="card p-4 flex flex-col gap-2">
        <p className="font-bold text-sm" style={{ color: "#111827" }}>メンバーに権限を付与 / 更新</p>
        <label className="text-sm font-bold" style={{ color: "#374151" }}>メンバー
          <select
            className="block w-full mt-1 border rounded px-2 py-1.5 text-sm font-normal"
            value={form.discord_user_id}
            onChange={(e) => {
              const m = members.find((x) => x.discord_user_id === e.target.value);
              setForm({ ...form, discord_user_id: e.target.value, username: m?.username ?? "" });
            }}
          >
            <option value="">選択してください</option>
            {members.map((m) => (
              <option key={m.discord_user_id} value={m.discord_user_id}>{m.username ?? m.discord_user_id}</option>
            ))}
          </select>
        </label>
        <Input label="役職名（例: 部門長）" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <label className="text-sm font-bold" style={{ color: "#374151" }}>権限
          <select className="block w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as AdminScope })}>
            {SCOPE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        {form.scope === "dept" && (
          <label className="text-sm font-bold" style={{ color: "#374151" }}>部門
            <select className="block w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {departments.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select>
          </label>
        )}
        <button disabled={saving || !form.discord_user_id} onClick={submit} className="self-start px-4 py-2 rounded-lg font-bold text-white text-sm" style={{ background: form.discord_user_id ? "#0f766e" : "#9ca3af" }}>{saving ? "保存中…" : "付与 / 更新"}</button>
      </div>
      <div className="flex flex-col gap-2">
        {admins.map((a) => (
          <div key={a.id} className="card p-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm" style={{ color: "#111827" }}>{a.username ?? a.discord_user_id} <span className="font-normal" style={{ color: "#6b7280" }}>{a.title}</span></p>
              <p className="text-xs" style={{ color: "#6b7280" }}>{SCOPE_OPTIONS.find((s) => s.value === a.scope)?.label}{a.department && `・${deptName(a.department)}`}</p>
            </div>
            {a.discord_user_id !== selfDiscordId && (
              <button onClick={() => revoke(a.discord_user_id)} className="text-sm font-bold" style={{ color: "#dc2626" }}>削除</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-sm font-bold" style={{ color: "#374151" }}>{label}
      <input className="block w-full mt-1 border rounded px-2 py-1.5 text-sm font-normal" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="text-sm font-bold flex-1" style={{ color: "#374151" }}>{label}
      <input type="number" className="block w-full mt-1 border rounded px-2 py-1.5 text-sm font-normal" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
