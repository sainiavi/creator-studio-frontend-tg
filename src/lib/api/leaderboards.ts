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
