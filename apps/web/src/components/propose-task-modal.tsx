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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="card p-5 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-4">
            <p className="font-bold text-base mb-2" style={{ color: "#111827" }}>提案を送信しました</p>
            <p className="text-sm mb-4" style={{ color: "#6b7280" }}>部門長の承認をお待ちください。</p>
            <button onClick={onClose} className="px-4 py-2 rounded-lg font-bold text-white text-sm" style={{ background: "#0f766e" }}>閉じる</button>
          </div>
        ) : (
          <>
            <h3 className="font-black text-base mb-3" style={{ color: "#111827" }}>タスクを提案</h3>
            {error && <p className="text-sm mb-2" style={{ color: "#dc2626" }}>{error}</p>}
            <div className="flex flex-col gap-2">
              <Field label="タイトル">
                <input className="w-full border rounded px-2 py-1.5 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="説明（任意）">
                <textarea className="w-full border rounded px-2 py-1.5 text-sm" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
              <Field label="部門">
                <select className="w-full border rounded px-2 py-1.5 text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  {departments.map((d) => <option key={d.slug} value={d.slug}>{d.title}</option>)}
                </select>
              </Field>
              <div className="flex gap-2">
                <Field label="難易度(1-5)" className="flex-1">
                  <input type="number" min={1} max={5} className="w-full border rounded px-2 py-1.5 text-sm" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })} />
                </Field>
                <Field label="ポイント" className="flex-1">
                  <input type="number" min={1} className="w-full border rounded px-2 py-1.5 text-sm" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
                </Field>
              </div>
              <Field label="提出タイプ">
                <select className="w-full border rounded px-2 py-1.5 text-sm" value={form.submission_type} onChange={(e) => setForm({ ...form, submission_type: e.target.value as SubmissionType })}>
                  {(["NONE", "TEXT", "LINK"] as SubmissionType[]).map((s) => <option key={s} value={s}>{SUBMISSION_LABEL[s]}</option>)}
                </select>
              </Field>
              <div className="flex gap-2 mt-2">
                <button disabled={saving} onClick={submit} className="px-4 py-2 rounded-lg font-bold text-white text-sm" style={{ background: "#0f766e" }}>{saving ? "送信中…" : "提案する"}</button>
                <button onClick={onClose} className="px-4 py-2 rounded-lg font-bold text-sm" style={{ background: "#f3f4f6", color: "#374151" }}>キャンセル</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-sm font-bold ${className ?? ""}`} style={{ color: "#374151" }}>
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}
