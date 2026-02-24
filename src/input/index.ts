import type { AppAction, AppState } from "../contracts";

export interface EventTargetLike {
  addEventListener(type: string, listener: (event: unknown) => void): void;
  removeEventListener(type: string, listener: (event: unknown) => void): void;
}

export interface InputDispatchBridge {
  dispatch(action: AppAction): void;
  getState(): Readonly<AppState>;
}

export interface InputModule {
  bind(target: EventTargetLike, bridge: InputDispatchBridge): void;
  unbind(): void;
}

export const createNoopInputModule = (): InputModule => ({
  bind: () => undefined,
  unbind: () => undefined
});
