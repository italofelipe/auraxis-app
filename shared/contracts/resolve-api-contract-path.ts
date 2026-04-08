const PATH_TOKEN_PATTERN = /\{([^}]+)\}/g;

export const resolveApiContractPath = (
  pathTemplate: string,
  params: Record<string, string>,
): string => {
  return pathTemplate.replace(PATH_TOKEN_PATTERN, (match, tokenName: string) => {
    const rawValue = params[tokenName];

    if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
      throw new Error(
        `Missing API contract path param "${tokenName}" for "${pathTemplate}".`,
      );
    }

    return encodeURIComponent(rawValue);
  });
};
