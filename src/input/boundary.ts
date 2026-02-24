import type { ActionDispatch } from "../contracts/actions.js";

export interface KeyboardEventLike {
  readonly key: string;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}

export interface PointerGesture {
  readonly type: "down" | "move" | "up";
  readonly x: number;
  readonly y: number;
}

export interface InputBinding {
  handleKeyboard(event: KeyboardEventLike): void;
  handlePointer(gesture: PointerGesture): void;
  dispose(): void;
}

export interface InputModule {
  attach(dispatch: ActionDispatch): InputBinding;
}

export function createNoopInputModule(): InputModule {
  return {
    attach() {
      return {
        handleKeyboard(): void {
          return;
        },
        handlePointer(): void {
          return;
        },
        dispose(): void {
          return;
        }
      };
    }
  };
}
