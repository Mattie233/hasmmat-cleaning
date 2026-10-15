import "server-only";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
  }

  const url = new URL(configuredUrl);
  const isLocalDevelopment =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";

  if (url.protocol !== "https:" && !isLocalDevelopment) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS outside local development.");
  }

  return url.origin;
}
