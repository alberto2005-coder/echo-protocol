/**
 * Tienda del menú principal: compras, precios, saldo insuficiente y
 * comprobación de que la mejora "Imán de créditos" ya no existe (BUG-001).
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

const KEY_COINS = 'echo_protocol_coins_v1';
const KEY_UPGRADES = 'echo_protocol_upgrades_v1';

function seedMainMenu() {
  localStorage.setItem('echo_protocol_tutorial_completed_v1', 'true');
  localStorage.setItem('echo_protocol_lang_v1', 'en');
}

async function openShop() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('button', {name: /ARMORY \/ SHOP/}));
  return user;
}

function storedUpgrades() {
  return JSON.parse(localStorage.getItem(KEY_UPGRADES) ?? '{}');
}

describe('Tienda · precios y compra', () => {
  it('muestra las 5 mejoras con sus precios exactos', async () => {
    seedMainMenu();
    await openShop();

    expect(screen.getByText('ARMOR REPAIR')).toBeInTheDocument();
    expect(screen.getByText('MAX ARMOR BOOST')).toBeInTheDocument();
    expect(screen.getByText('PLASMA CORE DAMAGE')).toBeInTheDocument();
    expect(screen.getByText('FIRE RATE OVERCLOCK')).toBeInTheDocument();
    expect(screen.getByText('KINETIC THRUSTERS')).toBeInTheDocument();

    expect(screen.getByRole('button', {name: /ARMOR REPAIR/})).toHaveTextContent('50 CR');
    expect(screen.getByRole('button', {name: /MAX ARMOR BOOST/})).toHaveTextContent('80 CR');
    expect(screen.getByRole('button', {name: /PLASMA CORE DAMAGE/})).toHaveTextContent('90 CR');
    expect(screen.getByRole('button', {name: /FIRE RATE OVERCLOCK/})).toHaveTextContent('85 CR');
    expect(screen.getByRole('button', {name: /KINETIC THRUSTERS/})).toHaveTextContent('70 CR');
  });

  it('el imán de créditos ya no está a la venta (BUG-001)', async () => {
    seedMainMenu();
    await openShop();

    expect(screen.queryByText(/CREDIT VACUUM/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/IMÁN DE CRÉDITOS/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /CREDIT VACUUM/i})).not.toBeInTheDocument();
    // y ninguna tarjeta cuesta 60 CR (el precio que tenía el imán)
    expect(screen.queryByRole('button', {name: /60 CR/})).not.toBeInTheDocument();
  });

  it('comprar MAX ARMOR BOOST descuenta 80 CR y sube la vida máxima a 125', async () => {
    seedMainMenu();
    const user = await openShop();

    expect(screen.getByText('100 CR')).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: /MAX ARMOR BOOST/}));

    expect(await screen.findByText('20 CR')).toBeInTheDocument();
    expect(localStorage.getItem(KEY_COINS)).toBe('20');
    expect(storedUpgrades().maxHealth).toBe(125);
  });

  it('con saldo insuficiente la mejora queda deshabilitada y no se compra', async () => {
    seedMainMenu();
    await openShop();

    // 100 CR: la reparación (50) sí, el plasma (90) sí, pero tras gastar 90
    expect(screen.getByRole('button', {name: /PLASMA CORE DAMAGE/})).toBeEnabled();

    fireEvent.click(screen.getByRole('button', {name: /PLASMA CORE DAMAGE/}));
    expect(localStorage.getItem(KEY_COINS)).toBe('10');

    // Ahora solo queda para la reparación (50): todo lo demás bloqueado
    expect(screen.getByRole('button', {name: /ARMOR REPAIR/})).toBeEnabled();
    expect(screen.getByRole('button', {name: /MAX ARMOR BOOST/})).toBeDisabled();
    expect(screen.getByRole('button', {name: /PLASMA CORE DAMAGE/})).toBeDisabled();
    expect(screen.getByRole('button', {name: /FIRE RATE OVERCLOCK/})).toBeDisabled();
    expect(screen.getByRole('button', {name: /KINETIC THRUSTERS/})).toBeDisabled();
  });

  it('la reparación es instantánea y no persiste mejora', async () => {
    seedMainMenu();
    const user = await openShop();
    const before = storedUpgrades();

    await user.click(screen.getByRole('button', {name: /ARMOR REPAIR/}));

    expect(localStorage.getItem(KEY_COINS)).toBe('50');
    expect(storedUpgrades()).toEqual(before);
  });
});

describe('Tienda · persistencia entre sesiones', () => {
  it('las mejoras compradas se conservan al recargar la aplicación', async () => {
    seedMainMenu();
    const first = await openShop();
    await first.click(screen.getByRole('button', {name: /KINETIC THRUSTERS/}));
    expect(localStorage.getItem(KEY_COINS)).toBe('30');
    expect(storedUpgrades().speed).toBeCloseTo(9.7, 6); // 8.5 + 1.2

    // simula una recarga completa
    const {unmount} = render(<App />);
    unmount();

    seedMainMenu();
    render(<App />);
    await userEvent.click(await screen.findByRole('button', {name: /ARMORY \/ SHOP/}));

    expect(screen.getByText('30 CR')).toBeInTheDocument();
    expect(screen.getByText(/Speed: 9\.7/)).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /KINETIC THRUSTERS/})).toBeDisabled();
  });
});
