export type ConjureEnvironment = "browser" | "mock" | "vizio";

export type RemoteKey =
  | "BACK"
  | "DOWN"
  | "EXIT"
  | "HOME"
  | "LEFT"
  | "MENU"
  | "OK"
  | "PAUSE"
  | "PLAY"
  | "RIGHT"
  | "UP"
  | (string & {});

export type RemoteEventType = "keydown" | "keyup";

export interface ConjureRemoteEvent {
  readonly type: RemoteEventType;
  readonly key: RemoteKey;
  readonly originalKey: string;
}

export interface ConjureCapabilities {
  companionLibrary: boolean;
  remote: boolean;
  visibility: boolean;
  websocket: boolean;
  bridge: boolean;
}

export type PageSubject = "page.ready" | "page.error" | "page.focus" | "page.interaction";
export type CommandSubject = "page.navigate" | "page.reload" | "page.focus" | "session.close";

export interface BridgeMessage {
  readonly subject: CommandSubject;
  readonly payload: Record<string, unknown>;
}

export interface ConjureBridge {
  readonly sessionId?: string;
  send(subject: PageSubject, payload?: Record<string, unknown>): Promise<void>;
  onCommand(listener: (message: BridgeMessage) => void): () => void;
  poll(): Promise<readonly BridgeMessage[]>;
  startPolling(intervalMs?: number): () => void;
}

export interface FocusAdapterOptions {
  root?: ParentNode;
  preventDefault?: boolean;
}

export interface ConjureApp {
  readonly capabilities: ConjureCapabilities;
  readonly environment: ConjureEnvironment;
  readonly bridge?: ConjureBridge;
  onKey(listener: (key: RemoteKey) => void): () => void;
  onRemoteEvent(listener: (event: ConjureRemoteEvent) => void): () => void;
  emitKey(key: RemoteKey): void;
  installFocusAdapter(options?: FocusAdapterOptions): () => void;
}

export interface CreateConjureAppOptions {
  runtime?: ConjureEnvironment;
  capabilities?: Partial<ConjureCapabilities>;
  bridge?: ConjureBridge | false;
}

const PAGE_SUBJECTS: readonly PageSubject[] = [
  "page.ready",
  "page.error",
  "page.focus",
  "page.interaction",
];
const COMMAND_SUBJECTS: readonly CommandSubject[] = [
  "page.navigate",
  "page.reload",
  "page.focus",
  "session.close",
];

const defaultCapabilities: Record<ConjureEnvironment, ConjureCapabilities> = {
  browser: {
    companionLibrary: false,
    remote: false,
    visibility: typeof document !== "undefined",
    websocket: typeof WebSocket !== "undefined",
    bridge: typeof fetch !== "undefined",
  },
  mock: {
    companionLibrary: false,
    remote: true,
    visibility: true,
    websocket: true,
    bridge: false,
  },
  vizio: {
    companionLibrary: false,
    remote: true,
    visibility: typeof document !== "undefined",
    websocket: typeof WebSocket !== "undefined",
    bridge: typeof fetch !== "undefined",
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

function isSubject<T extends string>(subjects: readonly T[], value: string): value is T {
  return subjects.includes(value as T);
}

export function normalizeRemoteKey(key: string): RemoteKey | undefined {
  const normalized: Record<string, RemoteKey> = {
    ArrowDown: "DOWN",
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
    ArrowUp: "UP",
    Backspace: "BACK",
    BrowserBack: "BACK",
    Enter: "OK",
    Escape: "BACK",
    Home: "HOME",
    MediaPause: "PAUSE",
    MediaPlay: "PLAY",
    Space: "OK",
  };
  return normalized[key];
}

export function createBridgeFromLocation(
  location: Location = globalThis.location,
  fetcher: typeof fetch = globalThis.fetch,
): ConjureBridge | undefined {
  if (!location || typeof fetcher !== "function") {
    return undefined;
  }
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ""));
  const capability = fragment.get("conjure_capability");
  const endpoint = fragment.get("conjure_endpoint");
  if (!capability || !endpoint) {
    return undefined;
  }
  fragment.delete("conjure_capability");
  fragment.delete("conjure_endpoint");
  const remaining = fragment.toString();
  if (typeof history !== "undefined" && history.replaceState) {
    history.replaceState(
      null,
      "",
      `${location.pathname}${location.search}${remaining ? `#${remaining}` : ""}`,
    );
  }

  const listeners = new Set<(message: BridgeMessage) => void>();
  let sessionId: string | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  const bridge: ConjureBridge = {
    get sessionId() {
      return sessionId;
    },
    async send(subject, payload = {}) {
      if (!isSubject(PAGE_SUBJECTS, subject)) {
        throw new Error(`Unsupported page subject: ${subject}`);
      }
      const response = await fetcher(endpoint, {
        method: "POST",
        headers: { "content-type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ capability, subject, payload }),
      });
      if (!response.ok) {
        throw new Error(`Conjure bridge rejected event (${response.status})`);
      }
      const body = (await response.json()) as { session_id?: string };
      sessionId = body.session_id ?? sessionId;
    },
    onCommand(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async poll() {
      const response = await fetcher(`${endpoint}?capability=${encodeURIComponent(capability)}`);
      if (!response.ok) {
        throw new Error(`Conjure bridge poll failed (${response.status})`);
      }
      const body = (await response.json()) as {
        session_id?: string;
        commands?: Array<{ subject?: string; payload?: Record<string, unknown> }>;
      };
      sessionId = body.session_id ?? sessionId;
      const messages: BridgeMessage[] = [];
      for (const command of body.commands ?? []) {
        if (command.subject && isSubject(COMMAND_SUBJECTS, command.subject)) {
          const message = { subject: command.subject, payload: command.payload ?? {} };
          messages.push(message);
          for (const listener of listeners) listener(message);
        }
      }
      return messages;
    },
    startPolling(intervalMs = 1000) {
      void bridge.poll();
      timer = setInterval(() => void bridge.poll(), intervalMs);
      return () => {
        if (timer !== undefined) clearInterval(timer);
        timer = undefined;
      };
    },
  };
  return bridge;
}

function focusableElements(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => {
    const disabled = "disabled" in element && Boolean((element as HTMLButtonElement).disabled);
    const style = typeof getComputedStyle === "function" ? getComputedStyle(element) : undefined;
    return !disabled && style?.display !== "none" && style?.visibility !== "hidden";
  });
}

function moveFocus(root: ParentNode, key: RemoteKey): void {
  const elements = focusableElements(root);
  if (!elements.length) return;
  const active = typeof document !== "undefined" ? document.activeElement : null;
  const index = active ? elements.indexOf(active as HTMLElement) : -1;
  if (key === "UP" || key === "LEFT") {
    elements[(index <= 0 ? elements.length : index) - 1]?.focus();
  } else if (key === "DOWN" || key === "RIGHT") {
    elements[(index + 1) % elements.length]?.focus();
  }
}

export function createConjureApp(options: CreateConjureAppOptions = {}): ConjureApp {
  const environment = options.runtime ?? detectEnvironment();
  const capabilities = {
    ...defaultCapabilities[environment],
    ...options.capabilities,
  };
  const listeners = new Set<(listener: RemoteKey) => void>();
  const eventListeners = new Set<(event: ConjureRemoteEvent) => void>();
  const bridge = options.bridge === false ? undefined : options.bridge ?? createBridgeFromLocation();

  const emitRemoteEvent = (event: ConjureRemoteEvent) => {
    for (const listener of eventListeners) listener(event);
    if (event.type === "keydown") {
      for (const listener of listeners) listener(event.key);
    }
  };

  return {
    environment,
    capabilities: { ...capabilities, bridge: Boolean(bridge) && capabilities.bridge },
    bridge,
    onKey(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onRemoteEvent(listener) {
      eventListeners.add(listener);
      return () => eventListeners.delete(listener);
    },
    emitKey(key) {
      for (const listener of listeners) listener(key);
    },
    installFocusAdapter(options: FocusAdapterOptions = {}) {
      const root = options.root ?? (typeof document !== "undefined" ? document : undefined);
      const preventDefault = options.preventDefault ?? true;
      if (!root || typeof document === "undefined") return () => undefined;
      const target =
        typeof Document !== "undefined" && root instanceof Document ? root : document;
      const handle = (event: KeyboardEvent) => {
        const key = normalizeRemoteKey(event.key);
        if (!key) return;
        if (preventDefault) event.preventDefault();
        emitRemoteEvent({ type: event.type as RemoteEventType, key, originalKey: event.key });
        if (event.type === "keydown") {
          if (["UP", "DOWN", "LEFT", "RIGHT"].includes(key)) moveFocus(root, key);
          if (key === "OK" && document.activeElement instanceof HTMLElement) {
            document.activeElement.click();
          }
          if ((key === "BACK" || key === "EXIT") && bridge) {
            void bridge.send("page.interaction", { action: key.toLowerCase() });
          }
        }
      };
      target.addEventListener("keydown", handle, true);
      target.addEventListener("keyup", handle, true);
      return () => {
        target.removeEventListener("keydown", handle, true);
        target.removeEventListener("keyup", handle, true);
      };
    },
  };
}

export function createMockConjureApp(
  capabilities: Partial<ConjureCapabilities> = {},
): ConjureApp {
  return createConjureApp({ runtime: "mock", capabilities, bridge: false });
}
