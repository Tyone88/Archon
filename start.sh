#!/bin/bash
# Production launcher for archon-web.
# Must `exec` directly into bun so PM2's signal (SIGINT/SIGTERM) reaches the
# server process — otherwise the SIGINT/SIGTERM handler at
# packages/server/src/index.ts:618 never runs and `await telegram.stop()`
# (which releases the Telegram getUpdates session via bot.api.close()) never
# fires, producing 409 cascades on the next launch. See CC27 (2026-05-10).
#
# `bun --filter @archon/server start` was the previous form. It spawns the
# actual server as a child of the workspace-runner process; signals to the
# runner do NOT propagate to the child, leaving orphans that hold port 3090
# and the Telegram poll.
cd /root/archon/packages/server
export IS_SANDBOX=1
export PATH="/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
exec bun src/index.ts
