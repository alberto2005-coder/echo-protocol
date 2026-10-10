/**
 * Congela el comportamiento de `input.ts`: teclado, puntero y el puente de
 * acciones virtuales usado por los botones táctiles DASH/ADS (BUG-004).
 */
import {act, fireEvent, render, waitFor} from '@testing-library/react';
import {useEffect, useRef, type MutableRefObject} from 'react';
import {describe, expect, it} from 'vitest';
import {setVirtualAction, useInput, type InputSnapshot} from '../input';

interface Capture {
  input?: MutableRefObject<InputSnapshot>;
}

function Probe({onReady}: {onReady: (input: MutableRefObject<InputSnapshot>) => void}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const input = useInput(containerRef);
  useEffect(() => {
    onReady(input);
  }, [onReady, input]);
  return <div ref={containerRef} data-testid="viewport" />;
}

async function mount() {
  const box: Capture = {};
  render(<Probe onReady={(input) => void (box.input = input)} />);
  await waitFor(() => expect(box.input).toBeDefined());
  return {
    actions: () => box.input!.current.actions,
    viewport: document.querySelector('[data-testid="viewport"]')!,
  };
}

describe('useInput · teclado', () => {
  it('Shift activa y libera la acción dash', async () => {
    const {actions} = await mount();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Shift'}));
    });
    expect(actions().dash).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', {key: 'Shift'}));
    });
    expect(actions().dash).toBe(false);
  });

  it('las teclas de movimiento siguen mapeadas', async () => {
    const {actions} = await mount();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {key: 'w'}));
      window.dispatchEvent(new KeyboardEvent('keydown', {key: 'd'}));
    });
    expect(actions().up).toBe(true);
    expect(actions().right).toBe(true);
  });

  it('las acciones retiradas (reload/interact/tap) ya no existen', async () => {
    const {actions} = await mount();
    const snapshot = actions() as Record<string, boolean>;

    expect('reload' in snapshot).toBe(false);
    expect('interact' in snapshot).toBe(false);
    expect('tap' in snapshot).toBe(false);
  });
});

describe('useInput · puntero', () => {
  it('el botón derecho activa el apuntado (ADS)', async () => {
    const {actions, viewport} = await mount();

    fireEvent.pointerDown(viewport, {button: 2});
    expect(actions().aim).toBe(true);

    fireEvent.pointerUp(viewport, {button: 2});
    expect(actions().aim).toBe(false);
  });

  it('el botón izquierdo dispara (confirm)', async () => {
    const {actions, viewport} = await mount();

    fireEvent.pointerDown(viewport, {button: 0});
    expect(actions().confirm).toBe(true);
    expect(actions().aim).toBe(false);

    fireEvent.pointerUp(viewport, {button: 0});
    expect(actions().confirm).toBe(false);
  });
});

describe('setVirtualAction · puente para controles táctiles (BUG-004)', () => {
  it('dash virtual se activa y se libera', async () => {
    const {actions} = await mount();

    act(() => setVirtualAction('dash', true));
    expect(actions().dash).toBe(true);

    act(() => setVirtualAction('dash', false));
    expect(actions().dash).toBe(false);
  });

  it('aim virtual equivale al clic derecho (ADS)', async () => {
    const {actions} = await mount();

    act(() => setVirtualAction('aim', true));
    expect(actions().aim).toBe(true);
    expect(actions().dash).toBe(false);

    act(() => setVirtualAction('aim', false));
    expect(actions().aim).toBe(false);
  });

  it('coexiste con el teclado físico', async () => {
    const {actions} = await mount();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Shift'}));
      setVirtualAction('aim', true);
    });
    expect(actions().dash).toBe(true);
    expect(actions().aim).toBe(true);
  });
});
