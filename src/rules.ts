import type { ProbeDocument, RuleDefinition, RuleFinding } from './types.js';

type PatternRule = {
  id: string;
  title: string;
  severity: RuleDefinition['severity'];
  category: RuleDefinition['category'];
  description: string;
  hint: string;
  patterns: RegExp[];
  message: string;
};

const patternRules: PatternRule[] = [
  {
    id: 'PP001',
    title: 'Ambiguous Authority',
    severity: 'medium',
    category: 'authority',
    description: 'Flags instructions that imply unclear or shifting priority between people, files, or systems.',
    hint: 'State the authority order explicitly, for example: system > organization > repository > task > user notes.',
    patterns: [
      /\b(highest|top|ultimate)\s+priority\b/i,
      /\boverride\s+(all|any|previous|system|developer|user)\s+instructions?\b/i,
      /\bignore\s+(all|any|previous|earlier|system|developer|user)\s+instructions?\b/i,
      /\bthe\s+only\s+source\s+of\s+truth\b/i
    ],
    message: 'This wording can create ambiguous or unsafe instruction authority.'
  },
  {
    id: 'PP002',
    title: 'Unsafe External Action',
    severity: 'high',
    category: 'external-action',
    description: 'Finds instructions that authorize publishing, messaging, payments, or destructive remote actions without consent.',
    hint: 'Require explicit confirmation before external side effects such as sending, posting, purchasing, pushing, or deleting remote data.',
    patterns: [
      /\b(send|email|message|dm|post|tweet|publish|push|deploy|purchase|buy|pay|charge|transfer)\b.{0,48}\b(without asking|without confirmation|automatically|immediately|directly)\b/i,
      /\b(always|freely|automatically)\b.{0,48}\b(send|email|message|dm|post|tweet|publish|push|deploy|purchase|buy|pay|charge|transfer)\b/i,
      /\bdo not ask\b.{0,48}\b(before|prior to)?\s*(sending|posting|publishing|pushing|deploying|buying|paying)\b/i
    ],
    message: 'This instruction appears to permit an external action without explicit confirmation.'
  },
  {
    id: 'PP004',
    title: 'Brittle Absolute Path',
    severity: 'low',
    category: 'portability',
    description: 'Flags local absolute paths that make reusable instruction files brittle.',
    hint: 'Use repository-relative paths or name the environment-specific path as local configuration.',
    patterns: [
      /(?:^|[\s"'(])\/Users\/[A-Za-z0-9._-]+\/[^\s"'`)]+/,
      /(?:^|[\s"'(])\/home\/[A-Za-z0-9._-]+\/[^\s"'`)]+/,
      /[A-Za-z]:\\Users\\[A-Za-z0-9._-]+\\[^\s"'`)]+/
    ],
    message: 'This absolute local path may not work for other users or machines.'
  }
];

export const rules: RuleDefinition[] = [
  ...patternRules.map(toRuleDefinition),
  {
    id: 'PP003',
    title: 'Missing Privacy Boundary',
    severity: 'high',
    category: 'privacy',
    description: 'Requires instructions to define boundaries for private, confidential, personal, or secret data.',
    hint: 'Add a short privacy rule covering secrets, personal data, and when information may be shared externally.',
    check(document) {
      const hasPrivacyBoundary = /\b(private|privacy|confidential|secret|secrets|personal data|credentials|token|api key)\b/i.test(document.content)
        && /\b(do not|don't|never|ask|confirm|permission|redact|avoid sharing|stay private)\b/i.test(document.content);

      if (hasPrivacyBoundary) {
        return [];
      }

      return [
        finding(document, {
          ruleId: 'PP003',
          severity: 'high',
          line: 1,
          column: 1,
          message: 'This instruction file does not define a privacy or secret-handling boundary.',
          hint: 'Add a privacy section that says private data, secrets, and credentials must not be shared externally without explicit approval.',
          excerpt: firstNonBlankLine(document)
        })
      ];
    }
  },
  {
    id: 'PP005',
    title: 'Conflicting Rules',
    severity: 'high',
    category: 'consistency',
    description: 'Detects common direct contradictions around asking, publishing, destructive commands, and privacy.',
    hint: 'Choose one policy and remove or qualify the conflicting instruction.',
    check(document) {
      const findings: RuleFinding[] = [];
      const text = document.content;
      const conflicts = [
        {
          allow: /\b(push|publish|deploy|post|send)\b.{0,60}\b(directly|automatically|without asking|without confirmation)\b/i,
          deny: /\b(never|do not|don't|ask before|confirm before)\b.{0,60}\b(push|publish|deploy|post|send)\b/i,
          message: 'This file both permits and restricts external publishing or messaging actions.'
        },
        {
          allow: /\b(delete|remove|destroy|wipe)\b.{0,60}\b(freely|without asking|automatically|immediately)\b/i,
          deny: /\b(never|do not|don't|ask before|confirm before)\b.{0,60}\b(delete|remove|destroy|wipe)\b/i,
          message: 'This file both permits and restricts destructive actions.'
        },
        {
          allow: /\b(share|paste|send|upload)\b.{0,60}\b(secrets?|credentials?|tokens?|api keys?|private data)\b/i,
          deny: /\b(never|do not|don't|redact|keep private)\b.{0,60}\b(secrets?|credentials?|tokens?|api keys?|private data)\b/i,
          message: 'This file contains conflicting guidance about sharing sensitive data.'
        }
      ];

      for (const conflict of conflicts) {
        if (!conflict.allow.test(text) || !conflict.deny.test(text)) {
          continue;
        }

        const line = findFirstLine(document.lines, conflict.allow) ?? findFirstLine(document.lines, conflict.deny) ?? 1;
        findings.push(finding(document, {
          ruleId: 'PP005',
          severity: 'high',
          line,
          column: 1,
          message: conflict.message,
          hint: 'Remove one side of the contradiction, or add a clear exception that explains which rule wins.',
          excerpt: document.lines[line - 1]?.trim() ?? ''
        }));
      }

      return findings;
    }
  }
];

export function getRule(id: string): RuleDefinition | undefined {
  return rules.find((rule) => rule.id.toLowerCase() === id.toLowerCase());
}

function toRuleDefinition(rule: PatternRule): RuleDefinition {
  return {
    id: rule.id,
    title: rule.title,
    severity: rule.severity,
    category: rule.category,
    description: rule.description,
    hint: rule.hint,
    check(document) {
      const findings: RuleFinding[] = [];

      document.lines.forEach((line, index) => {
        for (const pattern of rule.patterns) {
          const match = pattern.exec(line);
          if (!match) {
            continue;
          }

          findings.push(finding(document, {
            ruleId: rule.id,
            severity: rule.severity,
            line: index + 1,
            column: Math.max(1, match.index + 1),
            message: rule.message,
            hint: rule.hint,
            excerpt: line.trim()
          }));
          break;
        }
      });

      return findings;
    }
  };
}

function finding(
  document: ProbeDocument,
  input: Omit<RuleFinding, 'file'>
): RuleFinding {
  return {
    file: document.path,
    ...input
  };
}

function firstNonBlankLine(document: ProbeDocument): string {
  return document.lines.find((line) => line.trim().length > 0)?.trim() ?? '';
}

function findFirstLine(lines: string[], pattern: RegExp): number | undefined {
  for (const [index, line] of lines.entries()) {
    if (pattern.test(line)) {
      return index + 1;
    }
  }

  return undefined;
}
