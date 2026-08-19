import type { TriggerReason } from './roasts';

export interface DetectionResult {
  readonly reason: TriggerReason;
  readonly lineCount: number;
  readonly characterCount: number;
  readonly signals: readonly string[];
}

interface ArtifactRule {
  readonly name: string;
  readonly pattern: RegExp;
}

const ARTIFACT_RULES: readonly ArtifactRule[] = [
  {
    name: 'Markdown code fence',
    pattern: /(^|\n)\s*```(?:[a-z][\w.+-]*)?\s*(?:\n|$)/im
  },
  {
    name: 'AI conversational comment',
    pattern:
      /(?:\/\/|#|\/\*)\s*(?:here(?:'s| is) (?:the|your|an?) (?:complete |updated )?code|replace (?:this )?with your actual implementation|make sure to (?:install|configure|replace)|ensure (?:you )?(?:install|configure|replace))/i
  },
  {
    name: 'OpenAI-style placeholder key',
    pattern: /["'`]sk-(?:proj-)?(?:\.\.\.|x{3,}|your[-_\s]?key|replace[-_\s]?me)["'`]?/i
  },
  {
    name: 'Generic secret placeholder',
    pattern:
      /(?:your[-_\s]?(?:api[-_\s]?)?(?:key|token)(?:[-_\s]?here)?|insert[-_\s]?(?:api[-_\s]?)?(?:key|token)[-_\s]?here|<\s*your[-_\s]?(?:api[-_\s]?)?(?:key|token)\s*>)/i
  },
  {
    name: 'AI answer preamble',
    pattern: /(?:^|\n)\s*(?:certainly|sure|of course)[!,.]?\s+(?:here(?:'s| is)|below is)/i
  }
];

export function countLines(text: string): number {
  if (text.length === 0) {
    return 0;
  }

  let lines = 1;
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) {
      lines += 1;
    }
  }
  return lines;
}

export function detectAiArtifacts(text: string): readonly string[] {
  const signals: string[] = [];

  for (const rule of ARTIFACT_RULES) {
    if (rule.pattern.test(text)) {
      signals.push(rule.name);
    }
  }

  return signals;
}

export function analyzeInsertion(
  text: string,
  configuredThreshold: number
): DetectionResult | undefined {
  if (text.length < 4) {
    return undefined;
  }

  const threshold = Math.max(5, Math.trunc(configuredThreshold));
  const lineCount = countLines(text);
  const artifactSignals = detectAiArtifacts(text);

  if (artifactSignals.length > 0) {
    return {
      reason: 'ai_junk_found',
      lineCount,
      characterCount: text.length,
      signals: artifactSignals
    };
  }

  if (lineCount >= threshold * 2) {
    return {
      reason: 'huge_paste',
      lineCount,
      characterCount: text.length,
      signals: ['Huge pasted block']
    };
  }

  if (lineCount >= threshold) {
    return {
      reason: 'medium_paste',
      lineCount,
      characterCount: text.length,
      signals: ['Large pasted block']
    };
  }

  return undefined;
}
