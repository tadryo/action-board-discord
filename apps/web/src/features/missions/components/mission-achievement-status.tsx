import { CheckIcon, CircleDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  hasReachedMaxAchievements: boolean;
  userAchievementCount: number;
  maxAchievementCount: number | null;
}

export default function MissionAchievementStatus({ hasReachedMaxAchievements, userAchievementCount, maxAchievementCount }: Props) {
  if (hasReachedMaxAchievements) {
    return (
      <Badge variant="outline" className="text-[0.625rem] px-2 bg-neutral-950 -mt-3">
        <CheckIcon size={14} className="mr-1 text-white" />
        <span className="text-white">達成済み</span>
      </Badge>
    );
  }

  if (maxAchievementCount !== null) {
    return (
      <Badge variant="outline" className="text-[0.625rem] px-2 bg-white -mt-3">
        {userAchievementCount > 0
          ? <CheckIcon size={14} className="mr-1" />
          : <CircleDashed size={14} className="mr-1" />}
        {userAchievementCount}/{maxAchievementCount}回達成
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-[0.625rem] px-2 bg-white -mt-3">
      {userAchievementCount > 0
        ? <CheckIcon size={14} className="mr-1" />
        : <CircleDashed size={14} className="mr-1" />}
      {userAchievementCount}回達成
    </Badge>
  );
}
