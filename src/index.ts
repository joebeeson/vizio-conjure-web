export type ConjureEnvironment = "browser" | "mock" | "vizio";

export type RemoteKey =
  | "BACK"
  | "DOWN"
  | "LEFT"
  | "OK"
  | "RIGHT"
  | "UP"
  | (string & {});

export interface ConjureCapabilities {
  companionLibrary: boolean;
  remote: boolean;
  visibility: boolean;
  websocket: boolean;
}

export interface ConjureApp {
  readonly capabilities: ConjureCapabilities;
  readonly environment: ConjureEnvironment;
  onKey(listener: (key: RemoteKey) => void): () => void;
  emitKey(key: RemoteKey): void;
}

export interface CreateConjureAppOptions {
  runtime?: ConjureEnvironment;
  capabilities?: Partial<ConjureCapabilities>;
}

const defaultCapabilities: Record<ConjureEnvironment, ConjureCapabilities> = {
  browser: {
    companionLibrary: false,
    remote: false,
    visibility: typeof document !== "undefined",
    websocket: typeof WebSocket !== "undefined",
  },
  mock: {
    companionLibrary: false,
    remote: true,
    visibility: true,
    websocket: true,
  },
  vizio: {
    companionLibrary: false,
    remote: false,
    visibility: typeof document !== "undefined",
    websocket: typeof WebSocket !== "undefined",
  },
};

export function detectEnvironment(): ConjureEnvironment {
  const marker = (globalThis as { __VIZIO_CONJURE_RUNTIME__?: unknown })
    .__VIZIO_CONJURE_RUNTIME__;
  if (marker === "vizio") {
    return "vizio";
  }
  return typeof window === "undefined" ? "mock" : "browser";
}

export function createConjureApp(options: CreateConjureAppOptions = {}): ConjureApp {
  const environment = options.runtime ?? detectEnvironment();
  const capabilities = {
    ...defaultCapabilities[environment],
    ...options.capabilities,
  };
  const listeners = new Set<(key: RemoteKey) => void>();

  return {
    environment,
    capabilities,
    onKey(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emitKey(key) {
      for (const listener of listeners) {
        listener(key);
      }
    },
  };
}

export function createMockConjureApp(
  capabilities: Partial<ConjureCapabilities> = {},
): ConjureApp {
  return createConjureApp({ runtime: "mock", capabilities });
}
