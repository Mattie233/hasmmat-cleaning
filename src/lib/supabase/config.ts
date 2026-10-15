const invalidConfigurationMessage =
  "Supabase configuration is invalid. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super(invalidConfigurationMessage);
    this.name = "SupabaseConfigurationError";
  }
}

export function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new SupabaseConfigurationError();
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new SupabaseConfigurationError();
  }

  const localDevelopment =
    parsedUrl.hostname === "localhost" ||
    parsedUrl.hostname === "127.0.0.1" ||
    parsedUrl.hostname === "[::1]";
  if (
    (parsedUrl.protocol !== "https:" &&
      !(localDevelopment && parsedUrl.protocol === "http:")) ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    throw new SupabaseConfigurationError();
  }

  return { url, publishableKey };
}
