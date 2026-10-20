# vizio-conjure-web

[![CI](https://github.com/joebeeson/vizio-conjure-web/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/joebeeson/vizio-conjure-web/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/joebeeson/vizio-conjure-web?include_prereleases)](https://github.com/joebeeson/vizio-conjure-web/releases)
[![License](https://img.shields.io/github/license/joebeeson/vizio-conjure-web)](LICENSE)

Browser-side TypeScript helpers for pages loaded by VIZIO Conjure.

Milestone 2 adds normalized remote events, an opt-in DOM focus adapter, and a
short-lived Home Assistant page bridge. The bridge capability is read from the
URL fragment, removed from browser history, and used only for the fixed page
subjects and command subjects documented below.

```ts
import { createConjureApp } from "vizio-conjure-web";

const app = createConjureApp();
app.onKey((key) => console.log("remote key", key));
app.onRemoteEvent((event) => console.log(event.type, event.key));
app.installFocusAdapter();

await app.bridge?.send("page.ready", { runtime: app.environment });
app.bridge?.startPolling();
```

The adapter maps the measured `Arrow*`, `Enter`, `Escape`, and media keys to
Conjure keys, moves standard DOM focus, and activates the focused control on
`OK`. Pages should provide ordinary buttons, links, and form controls. The SDK
does not draw a separate cursor or execute arbitrary Home Assistant services.

Page subjects are `page.ready`, `page.error`, `page.focus`, and
`page.interaction`. Commands are `page.navigate`, `page.reload`, `page.focus`,
and `session.close`.

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
