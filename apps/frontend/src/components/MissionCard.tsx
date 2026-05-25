import { useState } from "react";
import type { MissionWithAchievements } from "../types/database";

interface Props {
  mission: MissionWithAchievements;
  accessToken: string;
  onAchieved: () => void;
}

const DIFFICULTY_COLORS = ["", "text-discord-green", "text-blue-400", "text-discord-yellow", "text-orange-400", "text-discord-red"];
const DIFFICULTY_LABELS = ["", "★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★"];

export default function MissionCard({ mission, accessToken, onAchieved }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [done, setDone] = useState(false);
  const [limitError, setLimitError] = useState(false);

  const canAchieve =
    !mission.is_completed &&
    (mission.max_achievement_count === null || mission.achievement_count < mission.max_achievement_count);

  async function handleSubmit() {
    if (submitting) return;
    if (mission.submission_type === "TEXT" && text.trim() === "") return;

    setSubmitting(true);
    setLimitError(false);
    try {
      // Supabase に直接書き込まず、認証済みバックエンド API を経由する
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Discord access_token でバックエンドが本人確認する
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          mission_id: mission.id,
          submission_text: text.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        setLimitError(true);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setDone(true);
      setText("");
      setShowInput(false);
      onAchieved();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`bg-discord-surface rounded-lg p-4 border transition-colors ${
        mission.is_completed ? "border-discord-green/30 opacity-75" : "border-white/5 hover:border-discord-brand/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-snug">{mission.title}</h3>
          {mission.description && (
            <p className="text-discord-muted text-xs mt-1 leading-relaxed">{mission.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-mono ${DIFFICULTY_COLORS[mission.difficulty]}`}>
              {DIFFICULTY_LABELS[mission.difficulty]}
            </span>
            <span className="text-xs text-discord-brand font-semibold">+{mission.points}pt</span>
            {mission.max_achievement_count !== null && (
              <span className="text-xs text-discord-muted">
                {mission.achievement_count}/{mission.max_achievement_count}回
              </span>
            )}
          </div>
          {limitError && (
            <p className="text-discord-red text-xs mt-1">達成回数の上限に達しています</p>
          )}
        </div>

        <div className="flex-shrink-0">
          {mission.is_completed || done ? (
            <span className="text-discord-green text-lg">✅</span>
          ) : canAchieve ? (
            <button
              onClick={() => {
                if (mission.submission_type === "NONE") {
                  handleSubmit();
                } else {
                  setShowInput((v) => !v);
                }
              }}
              className="bg-discord-brand hover:bg-discord-brand/80 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
            >
              達成
            </button>
          ) : null}
        </div>
      </div>

      {showInput && mission.submission_type !== "NONE" && !mission.is_completed && (
        <div className="mt-3 flex gap-2">
          <input
            type={mission.submission_type === "LINK" ? "url" : "text"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={mission.submission_type === "LINK" ? "URLを入力..." : "内容を入力..."}
            className="flex-1 bg-discord-card border border-white/10 rounded px-3 py-1.5 text-sm text-discord-text placeholder:text-discord-muted focus:outline-none focus:border-discord-brand/60"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || text.trim() === ""}
            className="bg-discord-green hover:bg-discord-green/80 disabled:opacity-50 text-discord-card text-xs font-bold px-3 py-1.5 rounded transition-colors"
          >
            {submitting ? "..." : "送信"}
          </button>
        </div>
      )}
    </div>
  );
}
