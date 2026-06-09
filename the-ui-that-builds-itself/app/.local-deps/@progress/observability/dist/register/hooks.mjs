/**
 * ESM loader-hook registration for Progress Observability.
 * Registers import-in-the-middle (IITM) hooks to intercept module imports
 * before instrumentation libraries load.
 * Requires Node.js ^18.19.0 || ^20.6.0 || >=22.0.0
 */

import { register } from 'node:module';

const runtimeConsole = globalThis.console;
const runtimeProcess = globalThis.process;

// Validate import-in-the-middle is installed
let createAddHookMessageChannel;
try {
  createAddHookMessageChannel = (await import('import-in-the-middle')).createAddHookMessageChannel;
} catch (error) {
  if (error?.code === 'MODULE_NOT_FOUND' || error?.code === 'ERR_MODULE_NOT_FOUND') {
    const message =
      '[Observability] import-in-the-middle is not installed.\n' +
      'This package is required for ESM auto-instrumentation to work.\n' +
      'Install it with: npm install import-in-the-middle\n' +
      'Or use: npm install --no-optional (if you only need CJS support)';
    runtimeConsole.error(message);
    const dependencyError = new Error(message);
    dependencyError.code = 'OBSERVABILITY_MISSING_IMPORT_IN_THE_MIDDLE';
    throw dependencyError;
  }
  throw error;
}

// Check Node.js version
const [major, minor] = runtimeProcess.versions.node.split('.').map(Number);
const supported =
  (major === 18 && minor >= 19) ||
  (major === 20 && minor >= 6) ||
  major >= 22;

if (!supported) {
  runtimeConsole.warn(
    `[Observability] WARNING: ESM hook registration requires ` +
      `Node.js ^18.19.0 || ^20.6.0 || >=22.0.0. ` +
      `Current version: ${runtimeProcess.versions.node}. ` +
      `IITM hooks will NOT be installed — ESM auto-instrumentation is disabled. ` +
      `Falling back to CJS instrumentation (works only when "type" is not "module"). ` +
      `See docs for the dynamic-import workaround.`,
  );
} else {
  try {
    const { registerOptions, waitForAllMessagesAcknowledged } =
      createAddHookMessageChannel();

    register('import-in-the-middle/hook.mjs', import.meta.url, registerOptions);

    // Wait for loader to activate IITM hooks
    await waitForAllMessagesAcknowledged();

    // Mark hooks as successfully registered to prevent duplicate registrations
    globalThis[Symbol.for('@progress/observability:esm_hooks_registered')] = true;
  } catch (error) {
    runtimeConsole.error(
      '[Observability] Failed to register ESM hooks:',
      error?.message || error
    );
    // Ensure flag is not set if registration fails
    delete globalThis[Symbol.for('@progress/observability:esm_hooks_registered')];
    throw error;
  }
}
