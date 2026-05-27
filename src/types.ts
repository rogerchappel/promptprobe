export type Severity = 'low' | 'medium' | 'high';

export type OutputFormat = 'text' | 'json' | 'markdown';

export type RuleCategory =
  | 'authority'
  | 'external-action'
  | 'privacy'
  | 'portability'
  | 'consistency';

export type ProbeDocument = {
  path: string;
  content: string;
  lines: string[];
};

export type RuleDefinition = {
  id: string;
  title: string;
  severity: Severity;
  category: RuleCategory;
  description: string;
  hint: string;
  check: (document: ProbeDocument) => RuleFinding[];
};

export type RuleFinding = {
  ruleId: string;
  severity: Severity;
  file: string;
  line: number;
  column: number;
  message: string;
  hint: string;
  excerpt: string;
};

export type PromptProbeConfig = {
  files: string[];
  exclude: string[];
  ignoredRules: string[];
  failOn: Severity;
  format: OutputFormat;
};

export type ScanOptions = {
  cwd: string;
  inputs: string[];
  config?: Partial<PromptProbeConfig>;
  includeDefaultFiles?: boolean;
};

export type ScanResult = {
  cwd: string;
  files: string[];
  findings: RuleFinding[];
  summary: {
    filesScanned: number;
    findings: number;
    high: number;
    medium: number;
    low: number;
  };
};

export const severityRank: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3
};
