import { describe, expect, it } from "vitest";

import {
  createBridgeFromLocation,
  createConjureApp,
  createMockConjureApp,
  detectEnvironment,
  normalizeRemoteKey,
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

  it("normalizes the measured DOM remote keys", () => {
    expect(normalizeRemoteKey("ArrowRight")).toBe("RIGHT");
    expect(normalizeRemoteKey("Enter")).toBe("OK");
    expect(normalizeRemoteKey("Escape")).toBe("BACK");
    expect(normalizeRemoteKey("Unrelated")).toBeUndefined();
  });

  it("uses a short-lived fragment capability for bridge events", async () => {
    const calls: RequestInit[] = [];
    const bridge = createBridgeFromLocation(
      {
        hash: "#conjure_capability=secret&conjure_endpoint=%2Fapi%2Fbridge",
        pathname: "/page",
        search: "",
      } as Location,
      async (_input, init) => {
        calls.push(init ?? {});
        return new Response(JSON.stringify({ session_id: "session-1" }), { status: 200 });
      },
    );

    expect(bridge).toBeDefined();
    await bridge?.send("page.ready", { runtime: "mock" });
    expect(calls[0]?.body).toContain("secret");
    expect(calls[0]?.body).toContain("page.ready");
  });
});
