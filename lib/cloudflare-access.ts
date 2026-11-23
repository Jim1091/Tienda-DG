import { createRemoteJWKSet, jwtVerify } from "jose";

type KeyResolver = Parameters<typeof jwtVerify>[1];

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function teamOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !/^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(url.hostname) ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function remoteKeys(origin: string) {
  let keys = keySets.get(origin);
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`${origin}/cdn-cgi/access/certs`));
    keySets.set(origin, keys);
  }
  return keys;
}

/** Return a verified email only for a signed token from this Access application. */
export async function verifiedAccessEmail(
  token: string | null,
  teamDomain: string | undefined,
  audience: string | undefined,
  keys?: KeyResolver,
): Promise<string | null> {
  const origin = teamOrigin(teamDomain);
  if (!token || !origin || !audience) return null;

  try {
    const { payload } = await jwtVerify(token, keys ?? remoteKeys(origin), {
      issuer: origin,
      audience,
      algorithms: ["RS256"],
    });
    return typeof payload.email === "string" && payload.email.trim()
      ? payload.email.toLowerCase()
      : null;
  } catch {
    return null;
  }
}
