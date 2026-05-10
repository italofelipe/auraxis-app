/**
 * CJS stub for `@open-draft/deferred-promise` (ESM-only package).
 * Used by MSW v2 and @mswjs/interceptors internals.
 */
"use strict";

function createDeferredExecutor() {
  let resolve;
  let reject;
  const executor = (res, rej) => {
    resolve = res;
    reject = rej;
  };
  executor.resolve = (...args) => resolve(...args);
  executor.reject = (...args) => reject(...args);
  executor.state = "pending";
  return executor;
}

class DeferredPromise extends Promise {
  constructor(executor) {
    const deferredExecutor = createDeferredExecutor();
    super((resolve, reject) => {
      deferredExecutor.resolve = resolve;
      deferredExecutor.reject = reject;
      if (executor) {
        executor(resolve, reject);
      }
    });
    this.resolve = (...args) => {
      deferredExecutor.resolve(...args);
      return this;
    };
    this.reject = (...args) => {
      deferredExecutor.reject(...args);
      return this;
    };
  }

  then(onFulfilled, onRejected) {
    return super.then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return super.catch(onRejected);
  }

  finally(onFinally) {
    return super.finally(onFinally);
  }
}

module.exports = { DeferredPromise, createDeferredExecutor };
