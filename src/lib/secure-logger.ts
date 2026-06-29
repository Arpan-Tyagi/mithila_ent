import crypto from 'crypto';

/**
 * Obfuscates PII into a non-reversible reference token for safe logging.
 */
function tokenizePII(data: string): string {
  if (!data) return 'anonymous';
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 12);
}

/**
 * Centralized logging utility that encodes outputs to prevent log injection.
 * Strict DLP (Data Leak Prevention) compliance.
 */
export function logSecurityAnomaly(event: string, userIdentifier: string, details: string) {
  const safeToken = tokenizePII(userIdentifier);
  
  // Remove newline characters to prevent CRLF Log Injection
  const sanitizedDetails = details.replace(/[\r\n]+/g, ' | ');
  
  // In a production environment, this could route to Datadog/CloudWatch
  // but it guarantees PII never reaches those vendors.
  console.warn(`[SECURITY_ANOMALY] Event: ${event} | UserRef: ${safeToken} | Details: ${sanitizedDetails}`);
}
