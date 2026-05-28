"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UsersRound } from "lucide-react";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MissionIcon } from "@/features/missions/components/mission-icon";
import MissionAchievementStatus from "@/features/missions/components/mission-achievement-status";
import type { MissionWithAchievements } from "@/types/database";

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

interface Props {
  mission: MissionWithAchievements;
  accessToken: string;
  onAchieved: (pointsEarned: number) => void;
}

export default function MissionCard({ mission, accessToken, onAchieved }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [done, setDone] = useState(false);
  const [limitError, setLimitError] = useState(false);
  const [justRecorded, setJustRecorded] = useState(false);
  const [failed, setFailed] = useState(false);

  const hasReachedMaxAchievements =
    mission.max_achievement_count != null &&
    mission.achievement_count >= mission.max_achievement_count;
  const userAchievementCount = mission.achievement_count;
  const isDone = userAchievementCount > 0 || done;

  async function handleSubmit() {
    if (submitting) return;
    if (mission.submission_type === "TEXT" && text.trim() === "") return;
    setSubmitting(true);
    setLimitError(false);
    setFailed(false);
    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ mission_id: mission.id, submission_text: text.trim() || undefined }),
      });
      if (res.status === 409) { setLimitError(true); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const row = await res.json().catch(() => null) as { points_earned?: number } | null;
      setDone(true);
      setText("");
      setShowInput(false);
      setJustRecorded(true);
      setTimeout(() => setJustRecorded(false), 4000);
      onAchieved(row?.points_earned ?? mission.points);
    } catch (err) {
      console.error(err);
      setFailed(true);
    } finally {
      setSubmitting(false);
    }
  }

  function onCtaClick() {
    if (hasReachedMaxAchievements) return;
    if (mission.submission_type === "NONE") handleSubmit();
    else setShowInput((v) => !v);
  }

  return (
    <article style={{ width: 300 }}>
      <Card>
        <CardHeader className="relative">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full p-[3px]">
                <div className="flex items-center justify-center w-full h-full rounded-full bg-white">
                  {mission.icon_url
                    ? <MissionIcon src={mission.icon_url} alt={mission.title} size="md" />
                    : <span style={{ fontSize: 32 }}>{CATEGORY_EMOJI[mission.category_slug] ?? "🎯"}</span>}
                </div>
              </div>
              <MissionAchievementStatus
                hasReachedMaxAchievements={hasReachedMaxAchievements}
                userAchievementCount={userAchievementCount}
                maxAchievementCount={mission.max_achievement_count}
              />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg leading-tight mb-2 text-gray-900">{mission.title}</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardFooter className="flex flex-col items-stretch gap-4">
          {mission.description && (
            <p className="text-sm leading-relaxed text-gray-600">{mission.description}</p>
          )}

          <div className="flex flex-col items-start gap-1.5">
            <div className="flex items-center">
              <UsersRound className="size-4 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                みんなで{(mission.total_achievements ?? 0).toLocaleString()}回達成
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge>
                <span className="text-sm font-medium text-gray-700">難易度</span>
                <span className="ml-1">{"⭐".repeat(mission.difficulty)}</span>
              </Badge>
              <Badge className={clsx(mission.is_featured ? "bg-yellow-300/90 text-black" : "")}>
                <span className="text-sm font-medium text-gray-700">
                  {mission.points}P{mission.is_featured && <span className="ml-1">x 2</span>}
                </span>
              </Badge>
            </div>
          </div>

          {limitError && <p className="text-xs text-red-600">達成回数の上限に達しています</p>}
          {failed    && <p className="text-xs text-red-600">記録に失敗しました。もう一度お試しください。</p>}
          {justRecorded && (
            <div className="text-sm font-bold rounded-[10px] px-3 py-2 flex items-center gap-1.5"
              style={{ background: "var(--primary-50)", color: "var(--primary-deep)" }}>
              ✓ 達成を記録しました！ +{mission.points}P
            </div>
          )}

          {showInput && mission.submission_type !== "NONE" && !hasReachedMaxAchievements && (
            <input
              type={mission.submission_type === "LINK" ? "url" : "text"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={mission.submission_type === "LINK" ? "URLを入力..." : "内容を入力..."}
              className="w-full rounded-[10px] border px-3.5 py-2.5 text-sm bg-white focus:outline-none"
              style={{ borderColor: "var(--border)" }}
            />
          )}

          {showInput && mission.submission_type !== "NONE" && !hasReachedMaxAchievements ? (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                className="w-full py-6 text-base font-bold bg-primary hover:bg-primary/90 text-white border-none"
                onClick={handleSubmit}
                disabled={submitting || (mission.submission_type === "TEXT" && text.trim() === "")}
              >
                {submitting ? "登録中..." : "ミッション達成を記録"}
              </Button>
            </motion.div>
          ) : (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                className={clsx(
                  "w-full py-6 text-base font-bold border-none",
                  hasReachedMaxAchievements || isDone
                    ? "bg-yellow-300 hover:bg-yellow-300/90 text-black"
                    : "bg-primary hover:bg-primary/90 text-white",
                )}
                onClick={onCtaClick}
                disabled={submitting || hasReachedMaxAchievements}
              >
                {submitting
                  ? "..."
                  : hasReachedMaxAchievements
                  ? "ミッションクリア🎉"
                  : isDone ? "もう一回チャレンジ🔥" : "今すぐチャレンジ🔥"}
              </Button>
            </motion.div>
          )}
        </CardFooter>
      </Card>
    </article>
  );
}
