declare namespace Cloudflare {
  interface Env {
		DB?: D1Database;
		APP_ACCESS_CODE?: string;
		APP_SESSION_TOKEN?: string;
    BUCKET?: R2Bucket;
  }
}
