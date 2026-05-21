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

# 2026-05-21: scrub CLAUDECODE-family env inherited from the PM2 daemon.
# The daemon was spawned inside a Claude Code session, so every child it
# starts inherits CLAUDECODE=1, CLAUDE_CODE_SESSION_ID, etc. Archon's
# runtime detects this and hangs silently on workflow execution (its own
# pre-flight warning + GitHub coleam00/Archon#1067). This is the fix for
# the 5-day Telegram silence observed on PID 3430752 (May 16 onward).
unset CLAUDECODE CLAUDE_CODE_SESSION_ID CLAUDE_CODE_ENTRYPOINT CLAUDE_CODE_EXECPATH CLAUDE_EFFORT

export IS_SANDBOX=1
export PATH="/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
exec bun src/index.ts
