/**
 * Smoke test: la aplicación arranca, muestra el onboarding al usuario nuevo
 * y llega al menú principal. El motor 3D se sustituye por un stub para no
 * requerir WebGL dentro de jsdom.
 */
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';

vi.mock('../Game', () => ({
  Game: ({gameState}: {gameState: {status: string}}) => (
    <div data-testid="game-stub" data-status={gameState.status} />
  ),
}));

import App from '../App';

describe('App · arranque', () => {
  it('muestra el selector de idioma en el primer acceso', async () => {
    render(<App />);
    expect(
      await screen.findByText(/CHOOSE YOUR LANGUAGE|SELECCIONA TU IDIOMA/i),
    ).toBeInTheDocument();
  });

  it('avanza al briefing tras elegir idioma', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', {name: /English/i}));
    expect(await screen.findByText(/MISSION BRIEFING|INFORME DE MISIÓN/i)).toBeInTheDocument();
  });

  it('muestra el menú principal cuando el tutorial ya se completó', async () => {
    localStorage.setItem('echo_protocol_tutorial_completed_v1', 'true');
    localStorage.setItem('echo_protocol_lang_v1', 'en');
    render(<App />);
    expect(await screen.findByTestId('start-button')).toHaveTextContent(/DEPLOY \/ PLAY/);
    // Saldo inicial de bienvenida
    expect(await screen.findByText('100')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /ARMORY \/ SHOP/})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /SETTINGS/})).toBeInTheDocument();
  });

  it('DEPLOY / PLAY arranca la partida (status → PLAYING)', async () => {
    localStorage.setItem('echo_protocol_tutorial_completed_v1', 'true');
    localStorage.setItem('echo_protocol_lang_v1', 'en');
    const user = userEvent.setup();
    render(<App />);

    const stub = await screen.findByTestId('game-stub');
    expect(stub).toHaveAttribute('data-status', 'START');

    await user.click(screen.getByTestId('start-button'));

    // el key de Game cambia y recrea el nodo: hay que volver a consultarlo
    await waitFor(() =>
      expect(screen.getByTestId('game-stub')).toHaveAttribute('data-status', 'PLAYING'),
    );
  });
});
