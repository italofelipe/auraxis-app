/**
 * Masks the local part of an email address while preserving the domain.
 *
 * Used in confirmation flows where the full email should not be re-displayed
 * verbatim (security best practice: avoid user enumeration through screens).
 *
 * @param email - Raw email address. May be null/empty.
 * @returns Masked email or empty string if input is invalid.
 *
 * @example
 *   maskEmail("italo@auraxis.com") // => "it****@auraxis.com"
 *   maskEmail("ab@x.io")           // => "a*@x.io"
 *   maskEmail("a@x.io")            // => "*@x.io"
 *   maskEmail("invalid")           // => ""
 */
export const maskEmail = (email: string | null | undefined): string => {
  if (!email) {
    return "";
  }

  const trimmed = email.trim();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    return "";
  }

  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex);
  const visibleChars = localPart.length <= 2 ? 1 : 2;
  const visible = localPart.slice(0, visibleChars);
  const hiddenLength = Math.max(localPart.length - visibleChars, 1);
  return `${visible}${"*".repeat(hiddenLength)}${domainPart}`;
};
