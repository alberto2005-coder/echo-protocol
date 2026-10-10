/**
 * Ajustes de audio: volumen y silencio persistidos en
 * `echo_protocol_audio_v1` y restaurados al volver a montar (BUG-011).
 */
import {fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';

vi.mock('../Game', () => ({
  Game: ({gameState}: {gameState: {status: string}}) => (
    <div data-testid="game-stub" data-status={gameState.status} />
  ),
}));

import App from '../App';

const KEY_AUDIO = 'echo_protocol_audio_v1';

function seedMainMenu() {
  localStorage.setItem('echo_protocol_tutorial_completed_v1', 'true');
  localStorage.setItem('echo_protocol_lang_v1', 'en');
}

async function openSettings() {
  const user = userEvent.setup();
  const view = render(<App />);
  await user.click(await screen.findByRole('button', {name: /SETTINGS/}));
  await screen.findByText('SYSTEM SETTINGS');
  return {user, view};
}

function stored() {
  return JSON.parse(localStorage.getItem(KEY_AUDIO) ?? 'null');
}

describe('Ajustes de audio', () => {
  it('arranca con los valores por defecto y los graba', async () => {
    seedMainMenu();
    await openSettings();

    expect(stored()).toEqual({musicVolume: 0.35, sfxVolume: 0.6, isMuted: false});
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(2);
    expect(Number(sliders[0].value)).toBeCloseTo(0.35, 6);
    expect(Number(sliders[1].value)).toBeCloseTo(0.6, 6);
  });

  it('cambiar el volumen de efectos se guarda en localStorage', async () => {
    seedMainMenu();
    await openSettings();

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[1], {target: {value: '0.9'}});

    expect(stored().sfxVolume).toBeCloseTo(0.9, 6);
    expect(stored().musicVolume).toBeCloseTo(0.35, 6);
    expect(stored().isMuted).toBe(false);
  });

  it('el botón de silencio alterna y persiste el estado', async () => {
    seedMainMenu();
    const user = await openSettings();

    expect(screen.getByRole('button', {name: /AUDIO ENABLED/})).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: /AUDIO ENABLED/}));

    expect(stored().isMuted).toBe(true);

    await user.click(screen.getByRole('button', {name: /MUTE ALL AUDIO/}));
    expect(stored().isMuted).toBe(false);
  });

  it('los ajustes sobreviven a un desmontaje completo (nueva sesión)', async () => {
    seedMainMenu();
    const first = await openSettings();

    fireEvent.change(screen.getAllByRole('slider')[0], {target: {value: '0.8'}});
    await first.user.click(screen.getByRole('button', {name: /AUDIO ENABLED/}));
    expect(stored()).toEqual({musicVolume: 0.8, sfxVolume: 0.6, isMuted: true});
    first.view.unmount();

    seedMainMenu();
    render(<App />);
    await userEvent.click(await screen.findByRole('button', {name: /SETTINGS/}));

    const restored = screen.getAllByRole('slider');
    expect(Number(restored[0].value)).toBeCloseTo(0.8, 6);
    expect(Number(restored[1].value)).toBeCloseTo(0.6, 6);
    expect(screen.getByRole('button', {name: /MUTE ALL AUDIO/})).toBeInTheDocument();
  });

  it('valores corruptos en localStorage caen a los defaults sin romper', async () => {
    seedMainMenu();
    localStorage.setItem(KEY_AUDIO, 'no-es-json');
    render(<App />);
    await userEvent.click(await screen.findByRole('button', {name: /SETTINGS/}));

    const sliders = screen.getAllByRole('slider');
    expect(Number(sliders[0].value)).toBeCloseTo(0.35, 6);
    expect(Number(sliders[1].value)).toBeCloseTo(0.6, 6);
  });
});
