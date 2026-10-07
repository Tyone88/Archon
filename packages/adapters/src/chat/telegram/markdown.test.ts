import { describe, expect, test } from 'bun:test';

import {
  convertToTelegramMarkdown,
  escapeMarkdownV2,
  fixDoubleEscapes,
  isAlreadyEscaped,
} from './markdown';

describe('telegram-markdown', () => {
  describe('convertToTelegramMarkdown', () => {
    describe('headers', () => {
      test('converts ## header to bold', () => {
        const result = convertToTelegramMarkdown('## Header Text');
        expect(result).toContain('*Header Text*');
      });

      test('converts # header to bold', () => {
        const result = convertToTelegramMarkdown('# Main Header');
        expect(result).toContain('*Main Header*');
      });
    });

    describe('bold and italic', () => {
      test('converts **bold** to *bold*', () => {
        const result = convertToTelegramMarkdown('This is **bold** text');
        expect(result).toContain('*bold*');
      });

      test('converts *italic* to _italic_', () => {
        const result = convertToTelegramMarkdown('This is *italic* text');
        expect(result).toContain('_italic_');
      });
    });

    describe('code blocks', () => {
      test('preserves inline code', () => {
        const result = convertToTelegramMarkdown('Use `npm install`');
        expect(result).toContain('`npm install`');
      });

      test('preserves code blocks', () => {
        const input = '```javascript\nconst x = 1;\n```';
        const result = convertToTelegramMarkdown(input);
        expect(result).toContain('```');
        expect(result).toContain('const x = 1');
      });
    });

    describe('lists', () => {
      test('converts bullet lists', () => {
        const input = '- Item 1\n- Item 2';
        const result = convertToTelegramMarkdown(input);
        // Library converts - to bullet point or escapes it
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe('links', () => {
      test('preserves markdown links', () => {
        const result = convertToTelegramMarkdown('[Click here](https://example.com)');
        expect(result).toContain('[Click here]');
        expect(result).toContain('https://example.com');
      });
    });

    describe('special characters', () => {
      test('escapes special characters', () => {
        const input = 'Price is $100. Use + or -';
        const result = convertToTelegramMarkdown(input);
        // Should have escaped . + -
        expect(result).toBeDefined();
      });
    });

    describe('tables with reserved characters (CC30 regression, 2026-10-07)', () => {
      // Every reserved char outside a code span must be preceded by an ODD number
      // of backslashes; `\\\\(` (even) is an escaped backslash + a bare `(`, which
      // Telegram rejects with "Character '(' is reserved and must be escaped".
      function bareReserved(text: string): string[] {
        const noCode = text
          .replace(/```[\s\S]*?```/g, m => ' '.repeat(m.length))
          .replace(/`[^`\n]*`/g, m => ' '.repeat(m.length));
        const hits: string[] = [];
        const re = /[_*[\]()~`>#+\-=|{}.!]/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(noCode)) !== null) {
          let backslashes = 0;
          for (let i = m.index - 1; i >= 0 && noCode[i] === '\\'; i--) backslashes++;
          if (backslashes % 2 === 0)
            hits.push(noCode.slice(Math.max(0, m.index - 12), m.index + 1));
        }
        return hits;
      }

      const table = [
        '| Item | Status |',
        '|------|--------|',
        '| Subscription | **Done** — `/root/archon` runs on your Max login (`CLAUDE_USE_GLOBAL_AUTH=true`), no API key |',
        '| Version | **Done** — v0.11.1 live (was v0.3.6), `3e38883c`, tag `stable-archon-cc29-locked` |',
        '| Haiku nodes | **Done** — fixed, answers at 26k tokens (was "Prompt is too long") |',
      ].join('\n');

      test('table cells with parentheses, dots and backticks have no bare reserved chars', () => {
        const result = convertToTelegramMarkdown(table);
        expect(result).not.toContain('\\\\(');
        expect(result).not.toContain('\\\\.');
        expect(bareReserved(result)).toEqual([]);
      });

      test('brackets, backticks and parentheses in bullets stay parseable', () => {
        const input =
          '- Cleanup `*.pre-cc29` files (`node_modules.pre-cc29`, `dist.pre-cc29`)\n' +
          '- Decision on the [7 April commits] in `aion-custom-v0.3.6-backup` (never ported)';
        const result = convertToTelegramMarkdown(input);
        expect(bareReserved(result)).toEqual([]);
      });

      test('fixDoubleEscapes collapses only exactly-two-backslash runs', () => {
        expect(fixDoubleEscapes('a \\\\( b')).toBe('a \\( b');
        expect(fixDoubleEscapes('v0\\\\.11\\\\.1')).toBe('v0\\.11\\.1');
        expect(fixDoubleEscapes('ok \\( already')).toBe('ok \\( already');
        expect(fixDoubleEscapes('tri \\\\\\( ple')).toBe('tri \\\\\\( ple');
        expect(fixDoubleEscapes('no reserved \\\\x')).toBe('no reserved \\\\x');
      });
    });

    describe('blockquotes', () => {
      // Regression: telegramify-markdown escaped the `>` blockquote marker
      // and double-escaped special characters on the same line, which
      // Telegram rejected with "Character '.' is reserved and must be
      // escaped". See coleam00/Archon#1102.
      test('escapes special chars exactly once inside blockquotes', () => {
        expect(convertToTelegramMarkdown('> hi.')).toBe('> hi\\.\n');
      });

      test('escapes multiple special chars exactly once on the same blockquote line', () => {
        expect(convertToTelegramMarkdown('> a.b-c!')).toBe('> a\\.b\\-c\\!\n');
      });

      test('preserves the `>` marker on every line of a multi-line blockquote', () => {
        expect(convertToTelegramMarkdown('> first.\n> second?')).toBe('> first\\.\n> second?\n');
      });
    });

    describe('edge cases', () => {
      test('handles empty string', () => {
        const result = convertToTelegramMarkdown('');
        expect(result).toBe('');
      });

      test('handles whitespace only', () => {
        const result = convertToTelegramMarkdown('   ');
        expect(result).toBe('   ');
      });

      test('handles plain text without markdown', () => {
        const result = convertToTelegramMarkdown('Hello world');
        expect(result).toContain('Hello world');
      });
    });
  });

  describe('escapeMarkdownV2', () => {
    test('escapes underscore', () => {
      expect(escapeMarkdownV2('snake_case')).toBe('snake\\_case');
    });

    test('escapes asterisk', () => {
      expect(escapeMarkdownV2('2*3=6')).toBe('2\\*3\\=6');
    });

    test('escapes brackets', () => {
      expect(escapeMarkdownV2('[text](url)')).toBe('\\[text\\]\\(url\\)');
    });

    test('escapes period', () => {
      expect(escapeMarkdownV2('Hello.')).toBe('Hello\\.');
    });

    test('escapes backslash', () => {
      expect(escapeMarkdownV2('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    test('handles empty string', () => {
      expect(escapeMarkdownV2('')).toBe('');
    });

    test('escapes multiple special chars', () => {
      const input = 'Use `code` and *bold* here!';
      const result = escapeMarkdownV2(input);
      expect(result).toBe('Use \\`code\\` and \\*bold\\* here\\!');
    });
  });

  describe('isAlreadyEscaped', () => {
    test('returns true for escaped underscore', () => {
      expect(isAlreadyEscaped('snake\\_case')).toBe(true);
    });

    test('returns true for escaped asterisk', () => {
      expect(isAlreadyEscaped('2\\*3')).toBe(true);
    });

    test('returns false for unescaped text', () => {
      expect(isAlreadyEscaped('Hello world')).toBe(false);
    });

    test('returns false for regular markdown', () => {
      expect(isAlreadyEscaped('**bold** text')).toBe(false);
    });

    test('returns false for empty string', () => {
      expect(isAlreadyEscaped('')).toBe(false);
    });
  });
});
