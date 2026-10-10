/**
 * Congela el comportamiento de `input.ts`: teclado, puntero y el puente de
 * acciones virtuales usado por los botones táctiles DASH/ADS (BUG-004).
 */
import {act, fireEvent, render} from '@testing-library/react';
import {useRef, type MutableRefObject} from 'react';
import {describe, expect, it} from 'vitest';
import {setVirtualAction, useInput, type InputSnapshot} from '../input';

interface Capture {
  input?: MutableRefObject<InputSnapshot>;
}

function Probe({box}: {box: Capture}) {
  const containerRef = useRef<HTMLDivElement>(null);
  box.input = useInput(containerRef);
  return <div ref={containerRef} data-testid="viewport" />;
}

function mount() {
  const box: Capture = {};
  render(<Probe box={box} />);
  return {
    actions: () => box.input!.current.actions,
    viewport: document.querySelector('[data-testid="viewport"]')!,
  };
}

describe('useInput · teclado', () => {
  it('Shift activa y libera la acción dash', () => {
    const {actions} = mount();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Shift'}));
    });
    expect(actions().dash).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', {key: 'Shift'}));
    });
    expect(actions().dash).toBe(false);
  });

  it('las teclas de movimiento siguen mapeadas', () => {
    const {actions} = mount();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {key: 'w'}));
      window.dispatchEvent(new KeyboardEvent('keydown', {key: 'd'}));
    });
    expect(actions().up).toBe(true);
    expect(actions().right).toBe(true);
  });

  it('las acciones retiradas (reload/interact/tap) ya no existen', () => {
    const {actions} = mount();
    const snapshot = actions() as Record<string, boolean>;

    expect('reload' in snapshot).toBe(false);
    expect('interact' in snapshot).toBe(false);
    expect('tap' in snapshot).toBe(false);
  });
});

describe('useInput · puntero', () => {
  it('el botón derecho activa el apuntado (ADS)', () => {
    const {actions, viewport} = mount();

    fireEvent.pointerDown(viewport, {button: 2});
    expect(actions().aim).toBe(true);

    fireEvent.pointerUp(viewport, {button: 2});
    expect(actions().aim).toBe(false);
  });

  it('el botón izquierdo dispara (confirm)', () => {
    const {actions, viewport} = mount();

    fireEvent.pointerDown(viewport, {button: 0});
    expect(actions().confirm).toBe(true);
    expect(actions().aim).toBe(false);

    fireEvent.pointerUp(viewport, {button: 0});
    expect(actions().confirm).toBe(false);
  });
});

describe('setVirtualAction · puente para controles táctiles (BUG-004)', () => {
  it('dash virtual se activa y se libera', () => {
    const {actions} = mount();

    act(() => setVirtualAction('dash', true));
    expect(actions().dash).toBe(true);

    act(() => setVirtualAction('dash', false));
    expect(actions().dash).toBe(false);
  });

  it('aim virtual equivale al clic derecho (ADS)', () => {
    const {actions} = mount();

    act(() => setVirtualAction('aim', true));
    expect(actions().aim).toBe(true);
    expect(actions().dash).toBe(false);

    act(() => setVirtualAction('aim', false));
    expect(actions().aim).toBe(false);
  });

  it('coexiste con el teclado físico', () => {
    const {actions} = mount();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Shift'}));
      setVirtualAction('aim', true);
    });
    expect(actions().dash).toBe(true);
    expect(actions().aim).toBe(true);
  });
});
