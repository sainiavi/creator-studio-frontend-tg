// Backend contract smoke test: auth flow, protected writes, public reads.
import { BACKEND, assert, fetchJson } from "./helpers.mjs";

export async function run() {
  // health + agent stack are public
  const health = await fetchJson(`${BACKEND}/api/health`);
  assert(health.status === 200 && health.body?.ok, "health endpoint responds");

  const stack = await fetchJson(`${BACKEND}/api/agents/stack`);
  assert(stack.status === 200 && stack.body?.models, "agent stack responds");

  // write endpoints require a token
  const unauthenticated = await fetchJson(`${BACKEND}/api/games/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateId: "flappy" })
  });
  assert(unauthenticated.status === 401, `writes require auth (got ${unauthenticated.status})`);

  // token endpoint issues a working token
  const tokenResponse = await fetchJson(`${BACKEND}/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "e2e-tester" })
  });
  assert(tokenResponse.status === 200 && tokenResponse.body?.token, "auth token issued");

  const authed = await fetchJson(`${BACKEND}/api/games/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenResponse.body.token}`
    },
    body: JSON.stringify({ templateId: "flappy", userId: "e2e-tester" })
  });
  assert(authed.status === 201, `authed create succeeds (got ${authed.status})`);

  // cleanup the created game
  const created = authed.body?.game;
  if (created?.id) {
    await fetchJson(`${BACKEND}/api/games/${created.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenResponse.body.token}` }
    });
  }

  // list endpoint with search
  const list = await fetchJson(`${BACKEND}/api/games/list?limit=3`);
  assert(list.status === 200 && Array.isArray(list.body?.games), "games list responds");
}
