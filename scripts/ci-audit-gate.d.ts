export type AuditFinding = {
  pkg: string;
  severity: string;
  id: string;
};

export type AuditReport = {
  vulnerabilities?: Record<
    string,
    {
      severity?: string;
      nodes?: string[];
      via?: (| string
        | {
            source?: string | number;
            severity?: string;
            url?: string;
            title?: string;
          })[];
    }
  >;
};

export function collectFindings(
  audit: AuditReport,
  resolveVersion?: (nodePath: string) => string,
): AuditFinding[];
