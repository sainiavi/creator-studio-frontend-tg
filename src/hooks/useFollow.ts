import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFollowStatus, toggleFollowApi } from "@/lib/api/social";

function getAnonymousUserId(): string {
  const key = "kult_anon_uid";
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, uid);
  }
  return uid;
}

/** Real follow state for a creator, persisted on the backend. */
export function useFollow(creatorId: string | null | undefined) {
  const userId = useRef(getAnonymousUserId()).current;
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);

  useEffect(() => {
    if (!creatorId) return;
    let cancelled = false;
    fetchFollowStatus(creatorId, userId)
      .then((status) => {
        if (cancelled) return;
        setFollowing(status.following);
        setFollowers(status.followers);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [creatorId, userId]);

  const toggle = useCallback(async () => {
    if (!creatorId) return;
    // optimistic flip; reconciled with the server response
    setFollowing((f) => !f);
    try {
      const status = await toggleFollowApi(creatorId, userId);
      setFollowing(status.following);
      setFollowers(status.followers);
    } catch {
      setFollowing((f) => !f);
    }
  }, [creatorId, userId]);

  const isSelf = creatorId === userId;
  return { following, followers, toggle, isSelf };
}
