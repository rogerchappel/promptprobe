import { loadConfig, normalizeConfig } from './config.js';
import { readDocument, resolveInputFiles } from './files.js';
import { rules } from './rules.js';
import { severityRank, type PromptProbeConfig, type RuleFinding, type ScanOptions, type ScanResult } from './types.js';

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const baseConfig = options.config ? normalizeConfig(options.config) : await loadConfig(options.cwd);
  const config: PromptProbeConfig = {
    ...baseConfig,
    files: options.inputs.length > 0 ? options.inputs : baseConfig.files
  };
  const files = await resolveInputFiles(options.cwd, config.files, config.exclude);
  const ignored = new Set(config.ignoredRules.map((rule) => rule.toUpperCase()));
  const activeRules = rules.filter((rule) => !ignored.has(rule.id));
  const findings: RuleFinding[] = [];

  for (const file of files) {
    const document = await readDocument(options.cwd, file);
    for (const rule of activeRules) {
      findings.push(...rule.check(document));
    }
  }

  findings.sort((left, right) =>
    left.file.localeCompare(right.file) ||
    left.line - right.line ||
    left.column - right.column ||
    left.ruleId.localeCompare(right.ruleId)
  );

  return {
    cwd: options.cwd,
    files,
    findings,
    summary: {
      filesScanned: files.length,
      findings: findings.length,
      high: findings.filter((finding) => finding.severity === 'high').length,
      medium: findings.filter((finding) => finding.severity === 'medium').length,
      low: findings.filter((finding) => finding.severity === 'low').length
    }
  };
}

export function hasFailingFindings(result: ScanResult, failOn: PromptProbeConfig['failOn']): boolean {
  return result.findings.some((finding) => severityRank[finding.severity] >= severityRank[failOn]);
}
