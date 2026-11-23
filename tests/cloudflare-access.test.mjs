import assert from "node:assert/strict";
import test from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifiedAccessEmail } from "../lib/cloudflare-access.ts";
import { isAdminEmail } from "../lib/admin-access.ts";

const issuer = "https://dg-test.cloudflareaccess.com";
const audience = "dg-admin-audience";
const { publicKey, privateKey } = await generateKeyPair("RS256", { extractable: true });
const jwk = { ...await exportJWK(publicKey), kid: "test-key", alg: "RS256", use: "sig" };
const keys = createLocalJWKSet({ keys: [jwk] });

function sign(claims = {}, options = {}) {
  return new SignJWT({ email: "ADMIN@example.com", ...claims })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(options.issuer ?? issuer)
    .setAudience(options.audience ?? audience)
    .setIssuedAt()
    .setExpirationTime(options.expiration ?? "5m")
    .sign(privateKey);
}

test("accepts a valid Access token and normalizes the email", async () => {
  assert.equal(await verifiedAccessEmail(await sign(), issuer, audience, keys), "admin@example.com");
});

test("rejects absent, malformed, expired and wrong-audience tokens", async () => {
  assert.equal(await verifiedAccessEmail(null, issuer, audience, keys), null);
  assert.equal(await verifiedAccessEmail("not-a-jwt", issuer, audience, keys), null);
  assert.equal(await verifiedAccessEmail(await sign({}, { expiration: -10 }), issuer, audience, keys), null);
  assert.equal(await verifiedAccessEmail(await sign({}, { audience: "other-app" }), issuer, audience, keys), null);
  assert.equal(await verifiedAccessEmail(await sign({}, { issuer: "https://other.cloudflareaccess.com" }), issuer, audience, keys), null);
});

test("rejects invalid configuration and tokens without an email", async () => {
  assert.equal(await verifiedAccessEmail(await sign(), "https://example.com", audience, keys), null);
  assert.equal(await verifiedAccessEmail(await sign(), issuer, undefined, keys), null);
  assert.equal(await verifiedAccessEmail(await sign({ email: null }), issuer, audience, keys), null);
});

test("allows the owner and additional administrators by exact email", () => {
  const config = {
    DG_ADMIN_EMAIL: "Owner@Example.com",
    DG_ADMIN_EMAILS: "second@example.com, Third@Example.com ",
  };
  assert.equal(isAdminEmail("owner@example.com", config), true);
  assert.equal(isAdminEmail("SECOND@example.com", config), true);
  assert.equal(isAdminEmail("third@example.com", config), true);
  assert.equal(isAdminEmail("second@example.com.evil", config), false);
  assert.equal(isAdminEmail("visitor@example.com", config), false);
  assert.equal(isAdminEmail(null, config), false);
  assert.equal(isAdminEmail("owner@example.com", {}), false);
});
