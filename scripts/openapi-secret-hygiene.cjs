const GENERATED_TOKEN_LITERAL_REGEX =
  /"token":\s*"(eyJ[^"\n]+|[A-Za-z0-9_-]{24,})"/g;
const GENERATED_REFRESH_TOKEN_LITERAL_REGEX =
  /"refresh_token":\s*"(eyJ[^"\n]+|[A-Za-z0-9_-]{24,})"/g;
const GENERATED_REQUEST_ID_LITERAL_REGEX =
  /X-Request-ID[^"\n]*"([a-f0-9]{32,})"/gi;

const cloneJson = (value) => JSON.parse(JSON.stringify(value));
const SAFE_PLACEHOLDERS = new Set([
  "req-example-id",
  "refresh-token-example",
  "captcha-token-example",
  "jwt-example-token",
  "example-token",
]);

const sanitizeExampleScalar = (value, pathSegments) => {
  if (typeof value !== "string") {
    return value;
  }

  if (SAFE_PLACEHOLDERS.has(value)) {
    return value;
  }

  const loweredSegments = pathSegments.map((segment) =>
    String(segment).toLowerCase(),
  );

  if (loweredSegments.includes("x-request-id")) {
    return "req-example-id";
  }

  if (loweredSegments.includes("refresh_token")) {
    return "refresh-token-example";
  }

  if (loweredSegments.includes("captcha_token")) {
    return "captcha-token-example";
  }

  if (loweredSegments.includes("token")) {
    return value.startsWith("eyJ") ? "jwt-example-token" : "example-token";
  }

  return value;
};

const sanitizeOpenApiNode = (node, pathSegments = [], insideExample = false) => {
  if (Array.isArray(node)) {
    return node.map((entry, index) =>
      sanitizeOpenApiNode(entry, [...pathSegments, index], insideExample),
    );
  }

  if (node && typeof node === "object") {
    const sanitizedNode = {};

    for (const [key, value] of Object.entries(node)) {
      const nextInsideExample =
        insideExample || key === "example" || key === "default";
      sanitizedNode[key] = sanitizeOpenApiNode(
        value,
        [...pathSegments, key],
        nextInsideExample,
      );
    }

    return sanitizedNode;
  }

  if (insideExample) {
    return sanitizeExampleScalar(node, pathSegments);
  }

  return node;
};

const sanitizeOpenApiDocument = (document) => {
  return sanitizeOpenApiNode(cloneJson(document));
};

const findUnsafeOpenApiExamples = (document) => {
  const sanitized = sanitizeOpenApiDocument(document);
  const findings = [];

  const walk = (originalNode, sanitizedNode, pathSegments = []) => {
    if (Array.isArray(originalNode) && Array.isArray(sanitizedNode)) {
      originalNode.forEach((entry, index) => {
        walk(entry, sanitizedNode[index], [...pathSegments, index]);
      });
      return;
    }

    if (
      originalNode &&
      typeof originalNode === "object" &&
      sanitizedNode &&
      typeof sanitizedNode === "object"
    ) {
      for (const [key, value] of Object.entries(originalNode)) {
        walk(value, sanitizedNode[key], [...pathSegments, key]);
      }
      return;
    }

    if (originalNode !== sanitizedNode) {
      findings.push({
        path: pathSegments.join("."),
        original: originalNode,
        sanitized: sanitizedNode,
      });
    }
  };

  walk(document, sanitized);
  return findings;
};

const collectRegexMatches = (text, regex, label) => {
  const matches = [];
  for (const match of text.matchAll(regex)) {
    matches.push({
      label,
      literal: match[0],
      index: match.index ?? -1,
    });
  }
  return matches;
};

const findUnsafeGeneratedTypeExamples = (generatedTypesText) => {
  return [
    ...collectRegexMatches(
      generatedTypesText,
      GENERATED_TOKEN_LITERAL_REGEX,
      "token example",
    ),
    ...collectRegexMatches(
      generatedTypesText,
      GENERATED_REFRESH_TOKEN_LITERAL_REGEX,
      "refresh token example",
    ),
    ...collectRegexMatches(
      generatedTypesText,
      GENERATED_REQUEST_ID_LITERAL_REGEX,
      "request id example",
    ),
  ];
};

module.exports = {
  findUnsafeGeneratedTypeExamples,
  findUnsafeOpenApiExamples,
  sanitizeOpenApiDocument,
};
