/**
 * Next.js Instrumentation Hook
 * 
 * This file runs ONCE when the Next.js server starts (server-side only).
 * It bootstraps the IMD Background Refresh Agent which proactively fetches
 * fresh data from IMD endpoints every 5 minutes — independent of any client request.
 *
 * This ensures data is ALWAYS fresh when the frontend fetches it,
 * even if no users have visited recently.
 */

export async function register() {
  // Only run on the server side (not during Edge runtime or client)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startIMDBackgroundAgent } = await import('./lib/imdBackgroundAgent');
    startIMDBackgroundAgent();
  }
}
