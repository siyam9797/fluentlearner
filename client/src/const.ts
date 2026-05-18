export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// returnPath is encoded inside the state parameter (as JSON) so the redirectUri
// stays clean (no query params) and the OAuth provider can safely append ?code=&state=.
// The state JSON contains both the redirectUri (for token exchange) and returnPath (for post-login redirect).
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const currentPath = returnPath || window.location.pathname;
  // Clean redirectUri without any query params — prevents double-? bug
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // Encode both redirectUri and returnPath into state as JSON → base64
  const statePayload = JSON.stringify({ redirectUri, returnPath: currentPath });
  const state = btoa(statePayload);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
