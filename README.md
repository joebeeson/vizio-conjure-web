# vizio-conjure-web

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
