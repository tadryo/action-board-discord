import { useState } from "react";
import type { MissionWithAchievements } from "../types/database";

interface Props {
  mission: MissionWithAchievements;
  accessToken: string;
  onAchieved: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  "learn-student-team": "📚",
  "join-discord": "💬",
  "learn-with-quiz": "❓",
  "share-and-spread": "📣",
  "invite-friends": "🤝",
  "join-events": "📅",
  "learn-policies": "📖",
  vote: "🗳️",
};

function difficultyStars(difficulty: number) {
  return "⭐".repeat(Math.max(1, Math.min(5, difficulty)));
}

export default function MissionCard({ mission, accessToken, onAchieved }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [done, setDone] = useState(false);
  const [limitError, setLimitError] = useState(false);
  const [justRecorded, setJustRecorded] = useState(false);
  const [failed, setFailed] = useState(false);

  const reachedMax =
    mission.max_achievement_count != null &&
    mission.achievement_count >= mission.max_achievement_count;
  const isDone = mission.achievement_count > 0 || done;

  const buttonText = reachedMax
    ? "ミッションクリア 🎉"
    : isDone
    ? "もう一回チャレンジ 🔥"
    : "今すぐチャレンジ 🔥";
  const buttonClass = reachedMax || isDone ? "btn btn-yellow" : "btn btn-primary";

  async function handleSubmit() {
    if (submitting) return;
    if (mission.submission_type === "TEXT" && text.trim() === "") return;

    setSubmitting(true);
    setLimitError(false);
    setFailed(false);
    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      setJustRecorded(true);
      setTimeout(() => setJustRecorded(false), 4000);
      onAchieved();
    } catch (err) {
      console.error(err);
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  }

  function onCtaClick() {
    if (reachedMax) return;
    if (mission.submission_type === "NONE") {
      handleSubmit();
    } else {
      setShowInput((v) => !v);
    }
  }

  return (
    <article className="mission-card" style={{ width: 300 }}>
      <div className="flex gap-3.5 items-start">
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="avatar"
            style={{ width: 72, height: 72, fontSize: 32 }}
          >
            {CATEGORY_EMOJI[mission.category_slug] ?? "🎯"}
          </div>
          {mission.max_achievement_count != null ? (
            <div
              className="text-[0.72rem] font-bold text-center"
              style={{ color: reachedMax ? "var(--primary-deep)" : "var(--muted)" }}
            >
              {mission.achievement_count}/{mission.max_achievement_count}回
            </div>
          ) : mission.achievement_count > 0 ? (
            <div className="text-[0.72rem] font-bold" style={{ color: "var(--primary-deep)" }}>
              {mission.achievement_count}回達成
            </div>
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[1.05rem] leading-snug font-extrabold" style={{ color: "#1f2937" }}>
            {mission.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {mission.description && (
          <p className="text-sm leading-relaxed" style={{ color: "#404040" }}>
            {mission.description}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="badge-soft">難易度 {difficultyStars(mission.difficulty)}</span>
          <span className="badge">{mission.points}P</span>
        </div>
        {limitError && (
          <p className="text-xs" style={{ color: "#dc2626" }}>
            達成回数の上限に達しています
          </p>
        )}
        {failed && (
          <p className="text-xs" style={{ color: "#dc2626" }}>
            記録に失敗しました。もう一度お試しください。
          </p>
        )}
        {justRecorded && (
          <div
            className="text-sm font-bold rounded-[10px] px-3 py-2 flex items-center gap-1.5"
            style={{ background: "var(--primary-50)", color: "var(--primary-deep)" }}
          >
            ✓ 達成を記録しました！ +{mission.points}P
          </div>
        )}
      </div>

      {showInput && mission.submission_type !== "NONE" && !reachedMax && (
        <input
          type={mission.submission_type === "LINK" ? "url" : "text"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={mission.submission_type === "LINK" ? "URLを入力..." : "内容を入力..."}
          className="w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-white focus:outline-none"
          style={{ borderColor: "var(--border)" }}
        />
      )}

      {showInput && mission.submission_type !== "NONE" && !reachedMax ? (
        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: "0.95rem 1rem", fontWeight: 800 }}
          onClick={handleSubmit}
          disabled={submitting || (mission.submission_type === "TEXT" && text.trim() === "")}
        >
          {submitting ? "登録中..." : "ミッション達成を記録"}
        </button>
      ) : (
        <button
          className={buttonClass}
          style={{ width: "100%", padding: "0.95rem 1rem", fontWeight: 800 }}
          onClick={onCtaClick}
          disabled={submitting || reachedMax}
        >
          {submitting ? "..." : buttonText}
        </button>
      )}
    </article>
  );
}
