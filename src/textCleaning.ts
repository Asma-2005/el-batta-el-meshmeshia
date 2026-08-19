export interface CleaningResult {
  readonly text: string;
  readonly changed: boolean;
  readonly removedLineCount: number;
}

const LEADING_FENCE = /^\s*```(?:[a-z][\w.+-]*)?\s*\n/i;
const TRAILING_FENCE = /\n\s*```\s*$/i;
const AI_COMMENT_LINE =
  /^\s*(?:\/\/|#|\/\*)\s*(?:here(?:'s| is) (?:the|your|an?) (?:complete |updated )?code|replace (?:this )?with your actual implementation|make sure to (?:install|configure|replace)|ensure (?:you )?(?:install|configure|replace)).*?(?:\*\/)?\s*$/gim;

function lineCount(text: string): number {
  if (text.length === 0) {
    return 0;
  }
  return text.split('\n').length;
}

export function cleanAiText(input: string): CleaningResult {
  if (input.length === 0) {
    return { text: input, changed: false, removedLineCount: 0 };
  }

  const eol = input.includes('\r\n') ? '\r\n' : '\n';
  const normalizedInput = input.replace(/\r\n/g, '\n');
  const beforeLines = lineCount(normalizedInput);

  let cleaned = normalizedInput.replace(LEADING_FENCE, '');
  cleaned = cleaned.replace(TRAILING_FENCE, '');
  cleaned = cleaned.replace(AI_COMMENT_LINE, '');
  cleaned = cleaned.replace(/[ \t]+$/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/^\n+|\n+$/g, '');

  const output = eol === '\r\n' ? cleaned.replace(/\n/g, '\r\n') : cleaned;
  const afterLines = lineCount(cleaned);

  return {
    text: output,
    changed: output !== input,
    removedLineCount: Math.max(0, beforeLines - afterLines)
  };
}
