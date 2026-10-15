const allowedAuthDestinations = new Set([
  "/admin",
  "/staff/jobs",
  "/staff/reset-password",
]);

export function safeAuthDestination(
  requestedPath: string | null,
  fallback = "/staff/jobs",
) {
  if (!requestedPath || !allowedAuthDestinations.has(requestedPath)) {
    return fallback;
  }

  return requestedPath;
}
