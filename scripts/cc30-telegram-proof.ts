// CC30 2026-10-07 — one-off proof: send a MarkdownV2 reply with a table, brackets,
// backticks and parentheses through Archon's own Telegram bot (Archon's token, from
// /root/archon/.env). Prints the Telegram message_id on success. Run from /root/archon.
import { Bot } from 'grammy';
import { convertToTelegramMarkdown } from '../packages/adapters/src/chat/telegram/markdown';

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = (process.env.TELEGRAM_ALLOWED_USER_IDS ?? '').split(',')[0]?.trim();
if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN / TELEGRAM_ALLOWED_USER_IDS missing');

const text = [
  '**CC30 Telegram MarkdownV2 proof** (2026-10-07) — table, [brackets], `backticks`, (parentheses).',
  '',
  '| Item | Status |',
  '|------|--------|',
  '| Subscription | **Done** — `/root/archon` runs on your Max login (`CLAUDE_USE_GLOBAL_AUTH=true`), no API key |',
  '| Version | **Done** — v0.11.1 live (was v0.3.6), `3e38883c`, tag `stable-archon-cc29-locked` |',
  '| Haiku nodes | **Done** — fixed, answers at 26k tokens (was "Prompt is too long") |',
  '',
  '- Cleanup `*.pre-cc29` files (`node_modules.pre-cc29`, `dist.pre-cc29`)',
  '- Decision on the [7 April commits] in `aion-custom-v0.3.6-backup` (never ported)',
  '',
  'If you can read this with formatting intact, the MarkdownV2 path works (no plain-text fallback).',
].join('\n');

const formatted = convertToTelegramMarkdown(text);
const bot = new Bot(token);
const res = await bot.api.sendMessage(Number(chatId), formatted, { parse_mode: 'MarkdownV2' });
console.log(
  JSON.stringify({
    ok: true,
    message_id: res.message_id,
    chat: res.chat.id,
    entities: (res.entities ?? []).length,
  })
);
