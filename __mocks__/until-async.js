/**
 * CJS stub for `until-async` (ESM-only package).
 * Used by MSW v2 internals to handle async callbacks gracefully.
 */
"use strict";

async function until(callback) {
  try {
    return [null, await callback()];
  } catch (error) {
    return [error, null];
  }
}

module.exports = { until };
