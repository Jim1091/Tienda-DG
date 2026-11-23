import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import { verifiedAccessEmail } from "../lib/cloudflare-access";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    if (env.DG_AUTH_PROVIDER === "cloudflare_access") {
      const path = new URL(request.url).pathname;
      const adminPath = path === "/admin" || path.startsWith("/admin/") ||
        path === "/api/admin" || path.startsWith("/api/admin/");
      const sessionPath = path === "/api/session";
      const headers = new Headers(request.headers);

      // Sites owns these headers in its runtime. On our Worker, only a signed
      // Cloudflare Access token can provide an administrator identity.
      for (const name of headers.keys()) {
        if (name.startsWith("oai-authenticated-user-")) headers.delete(name);
      }
      if (adminPath || sessionPath) {
        const sessionCookie = headers.get("cookie")?.split(";").map((part) => part.trim())
          .find((part) => part.startsWith("CF_Authorization="));
        const token = headers.get("cf-access-jwt-assertion") ??
          (sessionPath ? sessionCookie?.slice("CF_Authorization=".length) ?? null : null);
        const email = await verifiedAccessEmail(
          token,
          env.DG_ACCESS_TEAM_DOMAIN,
          env.DG_ACCESS_AUD,
        );
        const admin = !!email && !!env.DG_ADMIN_EMAIL &&
          email === env.DG_ADMIN_EMAIL.toLowerCase();
        if (adminPath && !admin) {
          return new Response("Acceso restringido", { status: 403 });
        }
        if (admin && email) {
          headers.set("oai-authenticated-user-id", email);
          headers.set("oai-authenticated-user-email", email);
        }
      }
      headers.delete("cf-access-jwt-assertion");
      request = new Request(request, { headers });
    }

    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};

export default worker;
