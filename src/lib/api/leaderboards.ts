import { api } from "../api";

export type LeaderboardEntry = {
  rank: number;
  gameId: string;
  userId: string;
  username: string;
  score: number;
  createdAt: string;
  updatedAt?: string;
  zeroGStorage?: ZeroGStoragePointer;
};

export type Leaderboard = {
  gameId: string;
  entries: LeaderboardEntry[];
  zeroGStorage?: ZeroGStoragePointer;
};

export type CreatorScoreEntry = {
  rank: number;
  id: string;
  creatorId: string;
  name: string;
  creatorScore: number;
  lifetimeScore: number;
  updatedAt?: string | null;
};

export type KultPointsEntry = {
  rank: number;
  id: string;
  userId: string;
  walletAddress: string;
  name: string;
  kultPoints: number;
  lifetimePoints: number;
  updatedAt?: string | null;
};

export type LeaderboardRange = "weekly" | "monthly" | "allTime";

export type AggregateLeaderboard<TEntry> = {
  kind: "creator-score" | "kult-points";
  metric: "creatorScore" | "kultPoints";
  range: LeaderboardRange;
  entries: TEntry[];
};

export type ZeroGStoragePointer = {
  objectType: string;
  objectId: string;
  status: "uploaded" | "skipped" | "failed";
  contentHash: string;
  rootHash?: string | null;
  txHash?: string | null;
  uri: string;
  byteLength: number;
};

export async function fetchLeaderboard(gameId: string, limit = 500) {
  const { data } = await api.get(`/leaderboards/${gameId}`, { params: { limit } });
  return data as Leaderboard;
}

export async function fetchCreatorScoreLeaderboard(limit = 100, range: LeaderboardRange = "allTime") {
  const { data } = await api.get("/leaderboards/creators", { params: { limit, range } });
  return data as AggregateLeaderboard<CreatorScoreEntry>;
}

export async function fetchKultPointsLeaderboard(limit = 100, range: LeaderboardRange = "allTime") {
  const { data } = await api.get("/leaderboards/kult-points", { params: { limit, range } });
  return data as AggregateLeaderboard<KultPointsEntry>;
}

export async function submitLeaderboardScore(
  gameId: string,
  userId: string,
  username: string,
  score: number,
) {
  const { data } = await api.post(`/leaderboards/${gameId}/scores`, {
    userId,
    username,
    score,
  });
  return data as Leaderboard;
}
