# vizio-conjure-web

[![CI](https://github.com/joebeeson/vizio-conjure-web/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/joebeeson/vizio-conjure-web/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/joebeeson/vizio-conjure-web?include_prereleases)](https://github.com/joebeeson/vizio-conjure-web/releases)
[![License](https://img.shields.io/github/license/joebeeson/vizio-conjure-web)](LICENSE)

Browser-side TypeScript helpers for pages loaded by VIZIO Conjure.

Milestone 1 provides a typed runtime model, capability detection, a mock
runtime, and a smoke page. Companion-library integration and Home Assistant
RPC are intentionally capability-gated until physical TV behavior is measured.

```ts
import { createConjureApp } from "vizio-conjure-web";

const app = createConjureApp();
app.onKey((key) => console.log("remote key", key));
```

This repository is private during the initial hardware-validation phase and is
not published to npm yet.

## Development

Use Node 20, 22, or 24 with npm:

```text
npm ci
npm run check
npm run test:coverage
```

CI runs the check and coverage suite across the supported Node matrix and
performs a package dry run. Release tags create a private GitHub release with
the package archive; npm publication is intentionally deferred.
