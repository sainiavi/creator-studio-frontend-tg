import { useCallback, useEffect, useState } from "react";
import { getCurrentUserId, getCurrentUsername } from "@/lib/identity";
import {
  fetchLeaderboard,
  submitLeaderboardScore,
  type LeaderboardEntry,
} from "@/lib/api/leaderboards";



export function useLeaderboard(gameId: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const leaderboard = await fetchLeaderboard(gameId);
      setEntries(leaderboard.entries);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  const submitScore = useCallback(
    async (score: number) => {
      const userId = getCurrentUserId();
      if (!userId) return;
      const username = getCurrentUsername();
      const leaderboard = await submitLeaderboardScore(gameId, userId, username, score);
      setEntries(leaderboard.entries);
    },
    [gameId],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLeaderboard(gameId)
      .then((leaderboard) => {
        if (!cancelled) setEntries(leaderboard.entries);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  return { entries, loading, refresh, submitScore };
}
