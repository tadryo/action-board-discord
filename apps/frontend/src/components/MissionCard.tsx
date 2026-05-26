import { useState } from "react";
import type { MissionWithAchievements } from "../types/database";

interface Props {
  mission: MissionWithAchievements;
  accessToken: string;
  onAchieved: () => void;
}

function DifficultyStars({ difficulty }: { difficulty: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`難易度 ${difficulty}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < difficulty ? "text-mirai-gold" : "text-mirai-border"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function MissionCard({ mission, accessToken, onAchieved }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [done, setDone] = useState(false);
  const [limitError, setLimitError] = useState(false);

  const completed = mission.is_completed || done;
  const canAchieve =
    !mission.is_completed &&
    (mission.max_achievement_count === null || mission.achievement_count < mission.max_achievement_count);

  async function handleSubmit() {
    if (submitting) return;
    if (mission.submission_type === "TEXT" && text.trim() === "") return;

    setSubmitting(true);
    setLimitError(false);
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
      onAchieved();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`bg-mirai-surface rounded-2xl p-4 border shadow-card flex flex-col transition-shadow ${
        completed ? "border-mirai-primary/30" : "border-mirai-border hover:shadow-cardHover"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <DifficultyStars difficulty={mission.difficulty} />
        <span className="bg-mirai-primarySoft text-mirai-primaryDark text-xs font-bold px-2.5 py-1 rounded-full">
          +{mission.points}pt
        </span>
      </div>

      <h3 className="font-bold text-base leading-snug text-mirai-text">{mission.title}</h3>
      {mission.description && (
        <p className="text-mirai-muted text-xs mt-1.5 leading-relaxed flex-1">{mission.description}</p>
      )}

      {mission.max_achievement_count !== null && (
        <p className="text-mirai-muted text-xs mt-2 font-medium">
          {mission.achievement_count}/{mission.max_achievement_count}回達成
        </p>
      )}

      {limitError && (
        <p className="text-mirai-danger text-xs mt-2">達成回数の上限に達しています</p>
      )}

      {showInput && mission.submission_type !== "NONE" && !completed && (
        <input
          type={mission.submission_type === "LINK" ? "url" : "text"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={mission.submission_type === "LINK" ? "URLを入力..." : "内容を入力..."}
          className="mt-3 w-full bg-mirai-bg border border-mirai-border rounded-lg px-3 py-2 text-sm text-mirai-text placeholder:text-mirai-muted focus:outline-none focus:border-mirai-primary focus:ring-2 focus:ring-mirai-primary/20"
        />
      )}

      <div className="mt-3">
        {completed ? (
          <div className="w-full text-center bg-mirai-primarySoft text-mirai-primaryDark text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <span>✓</span> 達成済み
          </div>
        ) : !canAchieve ? (
          <div className="w-full text-center bg-mirai-bg text-mirai-muted text-sm font-medium py-2.5 rounded-xl">
            達成済み
          </div>
        ) : showInput && mission.submission_type !== "NONE" ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || (mission.submission_type === "TEXT" && text.trim() === "")}
            className="w-full bg-mirai-primary hover:bg-mirai-primaryDark disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
          >
            {submitting ? "送信中..." : "送信する"}
          </button>
        ) : (
          <button
            onClick={() => {
              if (mission.submission_type === "NONE") {
                handleSubmit();
              } else {
                setShowInput(true);
              }
            }}
            disabled={submitting}
            className="w-full bg-mirai-primary hover:bg-mirai-primaryDark disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
          >
            {submitting ? "..." : "今すぐチャレンジ🔥"}
          </button>
        )}
      </div>
    </div>
  );
}
