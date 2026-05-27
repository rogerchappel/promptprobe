import { rules } from './rules.js';
import type { OutputFormat, RuleDefinition, ScanResult } from './types.js';

export function formatScanResult(result: ScanResult, format: OutputFormat): string {
  if (format === 'json') {
    return `${JSON.stringify(result, null, 2)}\n`;
  }
  if (format === 'markdown') {
    return renderMarkdown(result);
  }
  return renderText(result);
}

export function formatRules(format: OutputFormat = 'text'): string {
  if (format === 'json') {
    return `${JSON.stringify(rules.map(publicRule), null, 2)}\n`;
  }
  if (format === 'markdown') {
    return `# PromptProbe Rules\n\n${rules.map((rule) => `## ${rule.id}: ${rule.title}\n\n- Severity: ${rule.severity}\n- Category: ${rule.category}\n- Hint: ${rule.hint}\n`).join('\n')}`;
  }
  return rules.map((rule) => `${rule.id} ${rule.severity.padEnd(6)} ${rule.title} - ${rule.hint}`).join('\n') + '\n';
}

function renderText(result: ScanResult): string {
  const lines = [
    `Scanned ${result.summary.filesScanned} file(s); ${result.summary.findings} finding(s): ${result.summary.high} high, ${result.summary.medium} medium, ${result.summary.low} low.`
  ];

  for (const finding of result.findings) {
    lines.push(`${finding.file}:${finding.line}:${finding.column} ${finding.severity.toUpperCase()} ${finding.ruleId} ${finding.message}`);
    lines.push(`  Hint: ${finding.hint}`);
    if (finding.excerpt) {
      lines.push(`  > ${finding.excerpt}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function renderMarkdown(result: ScanResult): string {
  const lines = [
    '# PromptProbe Report',
    '',
    `Scanned ${result.summary.filesScanned} file(s).`,
    '',
    `Findings: ${result.summary.findings} (${result.summary.high} high, ${result.summary.medium} medium, ${result.summary.low} low).`,
    ''
  ];

  for (const finding of result.findings) {
    lines.push(`## ${finding.ruleId}: ${finding.message}`, '');
    lines.push(`- Severity: ${finding.severity}`);
    lines.push(`- Location: \`${finding.file}:${finding.line}:${finding.column}\``);
    lines.push(`- Hint: ${finding.hint}`);
    if (finding.excerpt) {
      lines.push('', `> ${finding.excerpt}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}`;
}

function publicRule(rule: RuleDefinition): Omit<RuleDefinition, 'check'> {
  return {
    id: rule.id,
    title: rule.title,
    severity: rule.severity,
    category: rule.category,
    description: rule.description,
    hint: rule.hint
  };
}
