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

// 共通スタイル（アクティビティ本体のデザイントークンに統一）
const fieldClass = "block w-full mt-1 border rounded-lg px-3 py-2 text-sm font-normal bg-white";
const fieldStyle = { borderColor: "var(--border)", color: "var(--fg)" } as const;
const primaryBtn = "bg-gradient-primary text-white rounded-full px-4 py-2 text-sm font-bold transition-transform active:scale-95 disabled:opacity-50";
const ghostBtn = "rounded-full px-4 py-2 text-sm font-bold transition-colors";
const ghostBtnStyle = { background: "var(--secondary)", color: "var(--muted-fg)" } as const;

// アクティビティからの Bearer トークンを全リクエストに付与する。
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

function Loading() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
    </div>
  );
}

export default function AdminDashboard({ scope, accessToken, selfDiscordId }: Props) {
  const canManage = scope === "super" || scope === "developer";
  const tabs: Tab[] = canManage ? ["proposals", "missions", "admins"] : ["proposals"];
  const [tab, setTab] = useState<Tab>("proposals");

  return (
    <TokenContext.Provider value={accessToken}>
      <div className="max-w-3xl mx-auto">
        <div className="tabs mb-5 flex-wrap">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`tab ${tab === t ? "active" : ""}`}>
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
        {/* 全タブを常にマウントしたまま表示のみ切り替える。
            起動時に裏で読み込まれるため、タブ移動時の再取得・スピナーが起きない。 */}
        <div style={{ display: tab === "proposals" ? "block" : "none" }}>
          <ProposalsManager />
        </div>
        {canManage && (
          <>
            <div style={{ display: tab === "missions" ? "block" : "none" }}>
              <MissionsManager />
            </div>
            <div style={{ display: tab === "admins" ? "block" : "none" }}>
              <AdminsManager selfDiscordId={selfDiscordId} />
            </div>
          </>
        )}
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

  if (loading) return <Loading />;

  const pending = proposals.filter((p) => p.status === "pending");
  const history = proposals.filter((p) => p.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      {msg && <p className="text-sm" style={{ color: "var(--destructive)" }}>{msg}</p>}

      <div>
        <h3 className="font-extrabold text-sm mb-2 flex items-center gap-2" style={{ color: "var(--fg)" }}>
          承認待ち <span className="badge">{pending.length}</span>
        </h3>
        <div className="flex flex-col gap-3">
          {pending.map((p) => (
            <div key={p.id} className="card p-4 flex flex-col gap-2">
              <p className="font-bold text-sm" style={{ color: "var(--fg)" }}>{p.title}</p>
              {p.description && <p className="text-xs" style={{ color: "var(--muted)" }}>{p.description}</p>}
              <p className="text-xs flex flex-wrap gap-1.5">
                <span className="badge-soft">提案者: {p.proposed_by_username ?? p.proposed_by_discord_id}</span>
                <span className="badge-soft">難易度{p.difficulty}</span>
                <span className="badge">{p.points}P</span>
              </p>
              {rejecting === p.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="border rounded-lg px-3 py-2 text-sm bg-white"
                    style={fieldStyle}
                    rows={3}
                    placeholder="却下理由を詳述（10文字以上・記録として保存されます）"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button disabled={busyId === p.id} onClick={() => act(p.id, { action: "reject", review_reason: reason })} className="rounded-full px-4 py-2 font-bold text-white text-sm disabled:opacity-50" style={{ background: "var(--destructive)" }}>却下を確定</button>
                    <button onClick={() => { setRejecting(null); setReason(""); }} className={ghostBtn} style={ghostBtnStyle}>戻る</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button disabled={busyId === p.id} onClick={() => act(p.id, { action: "approve" })} className={primaryBtn}>承認</button>
                  <button onClick={() => { setRejecting(p.id); setReason(""); }} className="rounded-full px-4 py-2 font-bold text-sm" style={{ background: "#fef2f2", color: "var(--destructive)" }}>却下</button>
                </div>
              )}
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>承認待ちの提案はありません。</p>}
        </div>
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="font-extrabold text-sm mb-2" style={{ color: "var(--fg)" }}>処理済み</h3>
          <div className="flex flex-col gap-2">
            {history.map((p) => (
              <div key={p.id} className="card p-3">
                <p className="text-sm flex items-center gap-2" style={{ color: "var(--fg)" }}>
                  <span>{p.title}</span>
                  <span
                    className="badge"
                    style={p.status === "approved"
                      ? { background: "var(--primary-50)", color: "var(--primary-700)" }
                      : { background: "#fef2f2", color: "var(--destructive)" }}
                  >
                    {PROPOSAL_STATUS_LABEL[p.status]}
                  </span>
                </p>
                {p.status === "rejected" && p.review_reason && (
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>却下理由: {p.review_reason}</p>
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

  // 新規作成できるのは「みんなでやろう」（general）のみ。部門別は提案から作られる。
  const generalCategories = categories.filter((c) => c.group_key !== "dept");
  const deptCategories = categories.filter((c) => c.group_key === "dept");

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      {msg && <p className="text-sm" style={{ color: "var(--destructive)" }}>{msg}</p>}

      <div className="flex flex-col gap-2">
        <h3 className="font-extrabold text-sm" style={{ color: "var(--fg)" }}>みんなでやろう</h3>
        <CreateMissionForm categories={generalCategories} onCreated={load} onError={setMsg} />
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
          <p className="text-sm" style={{ color: "var(--muted)" }}>カテゴリがありません。</p>
        )}
      </div>

      {deptCategories.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-extrabold text-sm" style={{ color: "var(--fg)" }}>部門別ミッション</h3>
          {deptCategories.map((c) => (
            <CategoryFolder
              key={c.slug}
              category={c}
              missions={missions.filter((m) => m.category_slug === c.slug)}
              onSaved={load}
              onError={setMsg}
            />
          ))}
        </div>
      )}
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
        style={{ background: open ? "var(--primary-50)" : "var(--bg-deep)" }}
      >
        <span className="font-bold text-sm flex items-center gap-2" style={{ color: "var(--fg)" }}>
          <span>{open ? "📂" : "📁"}</span>
          {category.title}
          <span className="badge-soft">{missions.length}</span>
        </span>
        <span style={{ color: "var(--primary-deep)" }}>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 p-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
          {missions.map((m) => (
            <MissionRowEditor key={m.id} mission={m} onSaved={onSaved} onError={onError} />
          ))}
          {missions.length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>このカテゴリにミッションはありません。</p>
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
      <button onClick={() => setOpen(true)} className={`self-start ${primaryBtn}`}>
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
      <label className="text-sm font-bold" style={{ color: "var(--muted-fg)" }}>カテゴリ
        <select className={fieldClass} style={fieldStyle} value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
        </select>
      </label>
      <label className="text-sm font-bold" style={{ color: "var(--muted-fg)" }}>提出タイプ
        <select className={fieldClass} style={fieldStyle} value={form.submission_type} onChange={(e) => setForm({ ...form, submission_type: e.target.value as SubmissionType })}>
          {(["NONE", "TEXT", "LINK"] as SubmissionType[]).map((s) => <option key={s} value={s}>{SUBMISSION_LABEL[s]}</option>)}
        </select>
      </label>
      <Input label="達成上限回数（空=無制限）" value={form.max_achievement_count} onChange={(v) => setForm({ ...form, max_achievement_count: v })} />
      <div className="flex gap-2 mt-1">
        <button disabled={saving} onClick={submit} className={primaryBtn}>{saving ? "保存中…" : "作成"}</button>
        <button onClick={() => setOpen(false)} className={ghostBtn} style={ghostBtnStyle}>キャンセル</button>
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    title: mission.title,
    description: mission.description ?? "",
    difficulty: mission.difficulty,
    points: mission.points,
    submission_type: mission.submission_type,
    max_achievement_count: mission.max_achievement_count?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);

  const archive = async () => {
    setSaving(true);
    onError(null);
    const res = await apiFetch(`/api/admin/missions/${mission.id}`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      onError(data.error ?? "アーカイブに失敗しました");
      setConfirmDelete(false);
    }
  };

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

  const isArchived = mission.archived_at !== null;

  if (!edit) {
    return (
      <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: "var(--bg-deep)", opacity: isArchived ? 0.5 : mission.is_hidden ? 0.55 : 1 }}>
        <div>
          <p className="font-bold text-sm" style={{ color: "var(--fg)" }}>
            {mission.title}
            {isArchived ? "（アーカイブ済み）" : mission.is_hidden ? "（非表示）" : ""}
          </p>
          <p className="text-xs mt-0.5 flex flex-wrap gap-1.5">
            <span className="badge-soft">難易度{mission.difficulty}</span>
            <span className="badge">{mission.points}P</span>
            <span className="badge-soft">{SUBMISSION_LABEL[mission.submission_type]}</span>
          </p>
        </div>
        {isArchived ? (
          <div className="flex gap-3 shrink-0">
            <button disabled={saving} onClick={() => patch({ archived: false })} className="text-sm font-bold" style={{ color: "var(--primary-deep)" }}>復元</button>
          </div>
        ) : confirmDelete ? (
          <div className="flex gap-2 shrink-0 items-center">
            <span className="text-xs" style={{ color: "var(--muted)" }}>アーカイブする？</span>
            <button disabled={saving} onClick={archive} className="text-sm font-bold" style={{ color: "var(--destructive)" }}>はい</button>
            <button onClick={() => setConfirmDelete(false)} className="text-sm font-bold" style={{ color: "var(--muted)" }}>いいえ</button>
          </div>
        ) : (
          <div className="flex gap-3 shrink-0">
            <button onClick={() => setEdit(true)} className="text-sm font-bold" style={{ color: "var(--primary-deep)" }}>編集</button>
            <button disabled={saving} onClick={() => patch({ is_hidden: !mission.is_hidden })} className="text-sm font-bold" style={{ color: "var(--muted)" }}>
              {mission.is_hidden ? "表示" : "非表示"}
            </button>
            <button onClick={() => setConfirmDelete(true)} className="text-sm font-bold" style={{ color: "var(--destructive)" }}>アーカイブ</button>
          </div>
        )}
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
        })} className={primaryBtn}>{saving ? "保存中…" : "保存"}</button>
        <button onClick={() => setEdit(false)} className={ghostBtn} style={ghostBtnStyle}>キャンセル</button>
      </div>
    </div>
  );
}

interface BoardMember {
  discord_user_id: string;
  username: string | null;
  avatar: string | null;
}

function avatarUrl(discordUserId: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(discordUserId) % 5}.png`;
  return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatar}.png?size=64`;
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

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      {msg && <p className="text-sm" style={{ color: "var(--destructive)" }}>{msg}</p>}
      <div className="card p-4 flex flex-col gap-2">
        <p className="font-extrabold text-sm" style={{ color: "var(--fg)" }}>メンバーに権限を付与 / 更新</p>
        <label className="text-sm font-bold" style={{ color: "var(--muted-fg)" }}>メンバー
          <select
            className={fieldClass}
            style={fieldStyle}
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
        <label className="text-sm font-bold" style={{ color: "var(--muted-fg)" }}>権限
          <select className={fieldClass} style={fieldStyle} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as AdminScope })}>
            {SCOPE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        {form.scope === "dept" && (
          <label className="text-sm font-bold" style={{ color: "var(--muted-fg)" }}>部門
            <select className={fieldClass} style={fieldStyle} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {departments.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select>
          </label>
        )}
        <button disabled={saving || !form.discord_user_id} onClick={submit} className={`self-start ${primaryBtn}`}>{saving ? "保存中…" : "付与 / 更新"}</button>
      </div>
      <div className="flex flex-col gap-2">
        {admins.map((a) => {
          const member = members.find((m) => m.discord_user_id === a.discord_user_id);
          return (
          <div key={a.id} className="card p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl(a.discord_user_id, member?.avatar ?? null)}
                alt={a.username ?? a.discord_user_id}
                className="w-9 h-9 rounded-full object-cover shrink-0"
                onError={(ev) => { (ev.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png"; }}
              />
              <div className="min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: "var(--fg)" }}>{a.username ?? a.discord_user_id} <span className="font-normal" style={{ color: "var(--muted)" }}>{a.title}</span></p>
                <p className="text-xs mt-0.5">
                  <span className="badge-soft">{SCOPE_OPTIONS.find((s) => s.value === a.scope)?.label}{a.department && `・${deptName(a.department)}`}</span>
                </p>
              </div>
            </div>
            {a.discord_user_id !== selfDiscordId && (
              <button onClick={() => revoke(a.discord_user_id)} className="text-sm font-bold shrink-0" style={{ color: "var(--destructive)" }}>削除</button>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-sm font-bold" style={{ color: "var(--muted-fg)" }}>{label}
      <input className={fieldClass} style={fieldStyle} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="text-sm font-bold flex-1" style={{ color: "var(--muted-fg)" }}>{label}
      <input type="number" className={fieldClass} style={fieldStyle} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
