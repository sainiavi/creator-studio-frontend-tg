import { api } from "../api";

export type SocialStats = {
  likes: { liked: boolean; count: number };
  comments: { count: number };
  favorites: { favorited: boolean; count: number };
  shares: { count: number };
};

export type Comment = {
  _id: string;
  gameId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
};

export type CommentsPage = {
  comments: Comment[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ─── Aggregate ─────────────────────────────────────────────────────────────

export async function fetchSocialStats(gameId: string, userId?: string): Promise<SocialStats> {
  const params = userId ? { userId } : {};
  const { data } = await api.get(`/social/stats/${gameId}`, { params });
  return data;
}

// ─── Likes ─────────────────────────────────────────────────────────────────

export async function toggleLike(gameId: string, userId: string) {
  const { data } = await api.post("/social/likes/toggle", { gameId, userId });
  return data as { liked: boolean; count: number };
}

export async function fetchLikeStatus(gameId: string, userId?: string) {
  const params = userId ? { userId } : {};
  const { data } = await api.get(`/social/likes/${gameId}`, { params });
  return data as { liked: boolean; count: number };
}

// ─── Comments ──────────────────────────────────────────────────────────────

export async function postComment(
  gameId: string,
  userId: string,
  username: string,
  text: string,
) {
  const { data } = await api.post("/social/comments", { gameId, userId, username, text });
  return data as { comment: Comment; count: number };
}

export async function fetchComments(gameId: string, page = 1, limit = 20) {
  const { data } = await api.get(`/social/comments/${gameId}`, { params: { page, limit } });
  return data as CommentsPage;
}

export async function removeComment(commentId: string, userId: string) {
  const { data } = await api.delete(`/social/comments/${commentId}`, { data: { userId } });
  return data as { deleted: boolean };
}

// ─── Favorites ─────────────────────────────────────────────────────────────

export async function toggleFavorite(gameId: string, userId: string) {
  const { data } = await api.post("/social/favorites/toggle", { gameId, userId });
  return data as { favorited: boolean; count: number };
}

export async function fetchFavoriteStatus(gameId: string, userId?: string) {
  const params = userId ? { userId } : {};
  const { data } = await api.get(`/social/favorites/${gameId}`, { params });
  return data as { favorited: boolean; count: number };
}

// ─── Shares ────────────────────────────────────────────────────────────────

export type SharePlatform = "link" | "twitter" | "discord" | "telegram" | "whatsapp" | "embed" | "instagram" | "email";

export async function recordShare(
  gameId: string,
  userId: string,
  platform: SharePlatform = "link",
) {
  const { data } = await api.post("/social/shares", { gameId, userId, platform });
  return data as { shared: boolean; count: number };
}

export async function fetchShareCount(gameId: string) {
  const { data } = await api.get(`/social/shares/${gameId}`);
  return data as { count: number };
}
