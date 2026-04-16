#!/bin/bash
cd /root/archon
export IS_SANDBOX=1
export PATH="/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
exec bun run dev
