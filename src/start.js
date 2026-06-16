// Entry launcher. The container has two jobs:
//   - On Apify (env APIFY_IS_AT_HOME is always set on the platform) → run the HTTP
//     Standby server (main.js) that powers the hosted, pay-per-call endpoint.
//   - Anywhere else (Glama's build/test harness, a plain `docker run`, local) → run
//     the stdio MCP server (stdio.js), the standard transport Glama spawns and
//     introspects to compute the Tool Definition Quality score. No Apify needed.
if (process.env.APIFY_IS_AT_HOME) {
  await import('./main.js');
} else {
  await import('./stdio.js');
}
