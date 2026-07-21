/** Where the user was before opening the reels / play feed. */
export const PLAY_RETURN_KEY = "kult-play-return-to";

export function isPlayPath(pathname: string) {
  return pathname.startsWith("/play/");
}

/** Call when routing from a non-play page into play. */
export function rememberPlayReturnPath(fromPathname: string, search = "") {
  if (isPlayPath(fromPathname)) return;
  const target = `${fromPathname}${search}` || "/";
  sessionStorage.setItem(PLAY_RETURN_KEY, target);
}

export function readPlayReturnPath(): string | null {
  return sessionStorage.getItem(PLAY_RETURN_KEY);
}

export function clearPlayReturnPath() {
  sessionStorage.removeItem(PLAY_RETURN_KEY);
}
