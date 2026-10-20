import { describe, expect, it } from "vitest";

import {
  createConjureApp,
  createMockConjureApp,
  detectEnvironment,
} from "../src/index.js";

describe("Conjure web runtime", () => {
  it("starts in a mock runtime in Node", () => {
    expect(detectEnvironment()).toBe("mock");
  });

  it("exposes a deterministic mock remote", () => {
    const app = createMockConjureApp();
    const keys: string[] = [];
    const unsubscribe = app.onKey((key) => keys.push(key));

    app.emitKey("OK");
    unsubscribe();
    app.emitKey("BACK");

    expect(app.environment).toBe("mock");
    expect(app.capabilities.remote).toBe(true);
    expect(keys).toEqual(["OK"]);
  });

  it("supports explicit VIZIO capability overrides", () => {
    const app = createConjureApp({
      runtime: "vizio",
      capabilities: { companionLibrary: true, remote: true },
    });
    expect(app.environment).toBe("vizio");
    expect(app.capabilities.companionLibrary).toBe(true);
    expect(app.capabilities.remote).toBe(true);
  });
});
