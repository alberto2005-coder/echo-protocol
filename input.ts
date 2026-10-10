import {useEffect, useRef, type MutableRefObject, type RefObject} from 'react';

export type InputAction =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'confirm'
  | 'cancel'
  | 'aim'
  | 'dash'
  | 'jump';

export interface PointerState {
  nx: number;
  ny: number;
  clientX: number;
  clientY: number;
  movementX: number;
  movementY: number;
  down: boolean;
  rightDown: boolean;
  isLocked: boolean;
}

export interface InputSnapshot {
  actions: Record<InputAction, boolean>;
  pointer: PointerState;
}

const ACTION_KEYS: Record<string, InputAction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  Enter: 'confirm',
  ' ': 'jump',
  Shift: 'dash',
  Escape: 'cancel',
};

/**
 * Nombre del evento DOM usado por {@link setVirtualAction}.
 *
 * Los controles táctiles viven en `App.tsx`, fuera del viewport donde
 * `useInput` escucha los eventos pointer, así que no pueden generar un
 * `PointerEvent` real sobre él. En su lugar publican la acción aquí.
 */
export const VIRTUAL_ACTION_EVENT = 'echo-protocol:virtual-action';

/**
 * Marca (o libera) una acción de forma programática.
 * Uso: botones táctiles DASH/ADS.
 */
export function setVirtualAction(action: InputAction, pressed: boolean): void {
  window.dispatchEvent(
    new CustomEvent(VIRTUAL_ACTION_EVENT, {detail: {action, pressed}}),
  );
}

function createEmptyActions(): Record<InputAction, boolean> {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    confirm: false,
    cancel: false,
    aim: false,
    dash: false,
    jump: false,
  };
}

export function useInput(
  containerRef: RefObject<HTMLDivElement | null>,
  options: {enabled?: boolean} = {},
): MutableRefObject<InputSnapshot> {
  const {enabled = true} = options;
  const inputRef = useRef<InputSnapshot>({
    actions: createEmptyActions(),
    pointer: {
      nx: 0,
      ny: 0,
      clientX: 0,
      clientY: 0,
      movementX: 0,
      movementY: 0,
      down: false,
      rightDown: false,
      isLocked: false,
    },
  });

  useEffect(() => {
    if (!enabled) {
      inputRef.current.actions = createEmptyActions();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const action = ACTION_KEYS[event.key];
      if (!action) return;
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(
          event.key,
        )
      ) {
        event.preventDefault();
      }
      inputRef.current.actions[action] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const action = ACTION_KEYS[event.key];
      if (!action) return;
      inputRef.current.actions[action] = false;
    };

    // Acciones virtuales publicadas por la UI externa (botones táctiles)
    const handleVirtualAction = (event: Event) => {
      const detail = (event as CustomEvent<{action: InputAction; pressed: boolean}>)
        .detail;
      if (!detail || !(detail.action in inputRef.current.actions)) return;
      inputRef.current.actions[detail.action] = detail.pressed;
    };

    const container = containerRef.current;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let isTouching = false;

    const handlePointerDown = (event: PointerEvent) => {
      if (!container) return;
      const isRight = event.button === 2;
      inputRef.current.pointer.down = !isRight ? true : inputRef.current.pointer.down;
      inputRef.current.pointer.rightDown = isRight ? true : inputRef.current.pointer.rightDown;
      if (isRight) {
        inputRef.current.actions.aim = true;
      } else {
        inputRef.current.actions.confirm = true;
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (document.pointerLockElement === container) {
        inputRef.current.pointer.movementX += event.movementX;
        inputRef.current.pointer.movementY += event.movementY;
      } else if (inputRef.current.pointer.down) {
        // Fallback drag-look when pointer is not locked
        inputRef.current.pointer.movementX += event.movementX || 0;
        inputRef.current.pointer.movementY += event.movementY || 0;
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!container) return;
      const isRight = event.button === 2;
      if (isRight) {
        inputRef.current.pointer.rightDown = false;
        inputRef.current.actions.aim = false;
      } else {
        inputRef.current.pointer.down = false;
        inputRef.current.actions.confirm = false;
      }
    };

    // Touch look support for mobile devices
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[e.touches.length - 1];
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
        isTouching = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching || e.touches.length === 0) return;
      const touch = e.touches[e.touches.length - 1];
      const dx = touch.clientX - lastTouchX;
      const dy = touch.clientY - lastTouchY;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      // Only treat touches on the right half of the screen as look dragging
      if (touch.clientX > window.innerWidth * 0.35) {
        inputRef.current.pointer.movementX += dx * 1.5;
        inputRef.current.pointer.movementY += dy * 1.5;
      }
    };

    const handleTouchEnd = () => {
      isTouching = false;
    };

    const handlePointerLockChange = () => {
      inputRef.current.pointer.isLocked = document.pointerLockElement === container;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleBlur = () => {
      inputRef.current.actions = createEmptyActions();
      inputRef.current.pointer.down = false;
      inputRef.current.pointer.rightDown = false;
      inputRef.current.pointer.movementX = 0;
      inputRef.current.pointer.movementY = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener(VIRTUAL_ACTION_EVENT, handleVirtualAction);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    if (container) {
      container.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      container.addEventListener('contextmenu', handleContextMenu);

      container.addEventListener('touchstart', handleTouchStart, {passive: true});
      window.addEventListener('touchmove', handleTouchMove, {passive: true});
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener(VIRTUAL_ACTION_EVENT, handleVirtualAction);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);

      if (container) {
        container.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
        container.removeEventListener('contextmenu', handleContextMenu);

        container.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [containerRef, enabled]);

  return inputRef;
}
