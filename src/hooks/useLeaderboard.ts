import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchLeaderboard,
  submitLeaderboardScore,
  type LeaderboardEntry,
} from "@/lib/api/leaderboards";

function getAnonymousUserId(): string {
  const key = "kult_anon_uid";
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, uid);
  }
  return uid;
}

function getAnonymousUsername(): string {
  const key = "kult_anon_username";
  let name = localStorage.getItem(key);
  if (!name) {
    name = `Player${Math.floor(Math.random() * 9999)}`;
    localStorage.setItem(key, name);
  }
  return name;
}

export function useLeaderboard(gameId: string) {
  const userId = useRef(getAnonymousUserId()).current;
  const username = useRef(getAnonymousUsername()).current;
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
      const leaderboard = await submitLeaderboardScore(gameId, userId, username, score);
      setEntries(leaderboard.entries);
    },
    [gameId, userId, username],
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
