#!/usr/bin/env node
// Stub Yarn PnP manifest scoped to cf_ai_studybuddy.
// Intercepts esbuild's upward .pnp.cjs search before it reaches the parent
// Yarn workspace.  Returning null from resolveToUnqualified signals "not
// managed by PnP here" — esbuild falls back to regular node_modules resolution.
'use strict';

module.exports = {
  setup() {},
  getPackageInformation() { return null; },
  getDependencyTreeRoots() { return []; },
  resolveToUnqualified() { return null; },
  resolveUnqualified(u) { return u; },
  resolveRequest() { return null; },
  VERSIONS: { std: 1 },
};
