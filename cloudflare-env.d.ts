declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    DG_ADMIN_EMAIL?: string;
    DG_ADMIN_EMAILS?: string;
    DG_AUTH_PROVIDER?: string;
    DG_ACCESS_TEAM_DOMAIN?: string;
    DG_ACCESS_AUD?: string;
  }
}
