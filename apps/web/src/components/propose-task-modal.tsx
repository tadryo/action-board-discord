"use client";

import { useState } from "react";
import type { SubmissionType } from "@/types/database";

interface DeptOption {
  slug: string;
  title: string;
}

interface Props {
  accessToken: string;
  departments: DeptOption[];
  initialDepartment?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const SUBMISSION_LABEL: Record<SubmissionType, string> = {
  NONE: "提出なし",
  TEXT: "テキスト",
  LINK: "リンク",
};

export default function ProposeTaskModal({ accessToken, departments, initialDepartment, onClose, onSubmitted }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: 1,
    points: 10,
    submission_type: "NONE" as SubmissionType,
    department: initialDepartment ?? departments[0]?.slug ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        difficulty: Number(form.difficulty),
        points: Number(form.points),
        submission_type: form.submission_type,
        department: form.department,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setDone(true);
      onSubmitted();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "提案の送信に失敗しました");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(10,10,10,0.45)" }} onClick={onClose}>
      <div className="card w-full max-w-md max-h-[85vh] overflow-y-auto" style={{ overflowX: "hidden" }} onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-8 px-5">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-extrabold text-base mb-2" style={{ color: "var(--fg)" }}>提案を送信しました</p>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>部門長の承認をお待ちください。</p>
            <button onClick={onClose} className="bg-gradient-primary text-white rounded-full px-5 py-2 font-bold text-sm transition-transform active:scale-95">閉じる</button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-hero px-5 py-4">
              <h3 className="font-black text-lg" style={{ color: "#0a0a0a" }}>🎯 ミッションを提案</h3>
              <p className="text-xs mt-0.5 font-semibold" style={{ color: "var(--primary-deep)" }}>部門の仲間に手伝ってほしいことを提案しよう。</p>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {error && <p className="text-sm" style={{ color: "var(--destructive)" }}>{error}</p>}
              <Field label="タイトル">
                <input className={fieldClass} style={fieldStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="説明（任意）">
                <textarea className={fieldClass} style={fieldStyle} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <Field label="部門">
                <select className={fieldClass} style={fieldStyle} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  {departments.map((d) => <option key={d.slug} value={d.slug}>{d.title}</option>)}
                </select>
              </Field>
              <div className="flex gap-2">
                <Field label="難易度(1-5)" className="flex-1">
                  <input type="number" min={1} max={5} className={fieldClass} style={fieldStyle} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })} />
                </Field>
                <Field label="ポイント" className="flex-1">
                  <input type="number" min={1} className={fieldClass} style={fieldStyle} value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
                </Field>
              </div>
              <Field label="提出タイプ">
                <select className={fieldClass} style={fieldStyle} value={form.submission_type} onChange={(e) => setForm({ ...form, submission_type: e.target.value as SubmissionType })}>
                  {(["NONE", "TEXT", "LINK"] as SubmissionType[]).map((s) => <option key={s} value={s}>{SUBMISSION_LABEL[s]}</option>)}
                </select>
              </Field>
              <div className="flex gap-2 mt-1">
                <button disabled={saving} onClick={submit} className="bg-gradient-primary text-white rounded-full px-5 py-2 font-bold text-sm transition-transform active:scale-95 disabled:opacity-50">{saving ? "送信中…" : "提案する"}</button>
                <button onClick={onClose} className="rounded-full px-5 py-2 font-bold text-sm" style={{ background: "var(--secondary)", color: "var(--muted-fg)" }}>キャンセル</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const fieldClass = "w-full border rounded-lg px-3 py-2 text-sm bg-white";
const fieldStyle = { borderColor: "var(--border)", color: "var(--fg)" } as const;

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-sm font-bold ${className ?? ""}`} style={{ color: "var(--muted-fg)" }}>
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}
