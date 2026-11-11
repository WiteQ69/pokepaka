declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_EMAIL_SHA256?: string;
  }
}
