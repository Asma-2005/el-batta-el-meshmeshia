import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeInsertion, countLines, detectAiArtifacts } from '../src/detector';
import { cleanAiText } from '../src/textCleaning';
import { getRandomRoast } from '../src/roasts';

function lines(count: number): string {
  return Array.from({ length: count }, (_, index) => `const value${index} = ${index};`).join('\n');
}

test('countLines handles empty, one-line, and multi-line text', () => {
  assert.equal(countLines(''), 0);
  assert.equal(countLines('hello'), 1);
  assert.equal(countLines('a\nb\nc'), 3);
});

test('medium and huge block thresholds are classified correctly', () => {
  assert.equal(analyzeInsertion(lines(34), 35), undefined);
  assert.equal(analyzeInsertion(lines(35), 35)?.reason, 'medium_paste');
  assert.equal(analyzeInsertion(lines(70), 35)?.reason, 'huge_paste');
});

test('AI artifacts outrank block size', () => {
  const suspicious = `\`\`\`typescript\n${lines(80)}\n\`\`\``;
  const result = analyzeInsertion(suspicious, 35);
  assert.equal(result?.reason, 'ai_junk_found');
  assert.ok(result?.signals.includes('Markdown code fence'));
});

test('artifact rules catch conversational comments and placeholders', () => {
  assert.ok(detectAiArtifacts('// Here is the complete code').length > 0);
  assert.ok(detectAiArtifacts('const key = "your_api_key_here";').length > 0);
  assert.equal(detectAiArtifacts('const apiKey = process.env.API_KEY;').length, 0);
});

test('cleanAiText removes surrounding fences and AI comment lines', () => {
  const input = [
    '```typescript',
    '// Here is the complete code you requested',
    '',
    '',
    'const answer = 42;',
    '',
    '',
    '',
    '```'
  ].join('\n');

  const result = cleanAiText(input);
  assert.equal(result.text, 'const answer = 42;');
  assert.equal(result.changed, true);
  assert.ok(result.removedLineCount > 0);
});

test('cleanAiText preserves normal comments and CRLF line endings', () => {
  const input = '// Explain why this branch exists\r\nconst ok = true;\r\n\r\n';
  const result = cleanAiText(input);
  assert.equal(result.text, '// Explain why this branch exists\r\nconst ok = true;');
  assert.ok(result.text.includes('\r\n'));
});

test('cleanAiText leaves already-clean one-line code unchanged', () => {
  const input = 'const duck = "senior";';
  assert.deepEqual(cleanAiText(input), {
    text: input,
    changed: false,
    removedLineCount: 0
  });
});

test('mixed Arabic and English roasts isolate left-to-right developer terms', () => {
  const hugeRoast = getRandomRoast('huge_paste', () => 0);
  const junkRoast = getRandomRoast('ai_junk_found', () => 0);
  assert.match(hugeRoast.message, /\u2066Review\u2069/);
  assert.match(junkRoast.message, /\u2066“Here is the code”\u2069/);
});
