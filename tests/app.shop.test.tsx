/**
 * Tienda del menú principal: compras, precios, saldo insuficiente y
 * comprobación de que la mejora "Imán de créditos" ya no existe (BUG-001).
 *
 * Nota: la reparación de armadura (`ARMOR REPAIR`) solo se renderiza cuando
 * `gameState.status === 'PLAYING'`; en el menú principal hay 4 tarjetas.
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
  const view = render(<App />);
  await user.click(await screen.findByRole('button', {name: /ARMORY \/ SHOP/}));
  await screen.findByText('MAX ARMOR BOOST');
  return {user, view};
}

function storedUpgrades() {
  return JSON.parse(localStorage.getItem(KEY_UPGRADES) ?? '{}');
}

const card = (name: RegExp) => screen.getByRole('button', {name});

describe('Tienda · precios y compra', () => {
  it('muestra las 4 mejoras de menú con sus precios exactos', async () => {
    seedMainMenu();
    await openShop();

    expect(screen.getByText('MAX ARMOR BOOST')).toBeInTheDocument();
    expect(screen.getByText('PLASMA CORE DAMAGE')).toBeInTheDocument();
    expect(screen.getByText('FIRE RATE OVERCLOCK')).toBeInTheDocument();
    expect(screen.getByText('KINETIC THRUSTERS')).toBeInTheDocument();

    expect(card(/MAX ARMOR BOOST/)).toHaveTextContent('80 CR');
    expect(card(/PLASMA CORE DAMAGE/)).toHaveTextContent('90 CR');
    expect(card(/FIRE RATE OVERCLOCK/)).toHaveTextContent('85 CR');
    expect(card(/KINETIC THRUSTERS/)).toHaveTextContent('70 CR');
  });

  it('la reparación de armadura no aparece fuera de una partida', async () => {
    seedMainMenu();
    await openShop();
    expect(screen.queryByText('ARMOR REPAIR')).not.toBeInTheDocument();
  });

  it('el imán de créditos ya no está a la venta (BUG-001)', async () => {
    seedMainMenu();
    await openShop();

    expect(screen.queryByText(/CREDIT VACUUM/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/IMÁN DE CRÉDITOS/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /CREDIT VACUUM/i})).not.toBeInTheDocument();
    // ninguna tarjeta cuesta 60 CR, que era el precio del imán
    expect(screen.queryByRole('button', {name: /60 CR/})).not.toBeInTheDocument();
    // y ya no queda rastro del radio magnético en la tienda
    expect(screen.queryByText(/Radius:/i)).not.toBeInTheDocument();
  });

  it('comprar MAX ARMOR BOOST descuenta 80 CR y sube la vida máxima a 125', async () => {
    seedMainMenu();
    const {user} = await openShop();

    expect(screen.getByText('100 CR')).toBeInTheDocument();

    await user.click(card(/MAX ARMOR BOOST/));

    expect(await screen.findByText('20 CR')).toBeInTheDocument();
    expect(localStorage.getItem(KEY_COINS)).toBe('20');
    expect(storedUpgrades().maxHealth).toBe(125);
  });

  it('con saldo insuficiente las mejoras quedan deshabilitadas', async () => {
    seedMainMenu();
    await openShop();

    expect(card(/PLASMA CORE DAMAGE/)).toBeEnabled();

    fireEvent.click(card(/PLASMA CORE DAMAGE/));

    expect(await screen.findByText('10 CR')).toBeInTheDocument();
    expect(localStorage.getItem(KEY_COINS)).toBe('10');

    expect(card(/MAX ARMOR BOOST/)).toBeDisabled();
    expect(card(/PLASMA CORE DAMAGE/)).toBeDisabled();
    expect(card(/FIRE RATE OVERCLOCK/)).toBeDisabled();
    expect(card(/KINETIC THRUSTERS/)).toBeDisabled();
  });

  it('cada compra aplica su incremento exacto y solo la seleccionada', async () => {
    seedMainMenu();
    const {user, view} = await openShop();

    await user.click(card(/PLASMA CORE DAMAGE/)); // 100 - 90 = 10

    expect(localStorage.getItem(KEY_COINS)).toBe('10');
    expect(storedUpgrades().weaponDamage).toBe(40); // 25 + 15
    expect(storedUpgrades().maxHealth).toBe(100); // intacto
    expect(storedUpgrades().speed).toBe(8.5); // intacto
    expect(storedUpgrades().fireRate).toBe(3.5); // intacto
    view.unmount();
  });
});

describe('Tienda · persistencia entre sesiones', () => {
  it('las mejoras compradas se conservan al recargar la aplicación', async () => {
    seedMainMenu();
    const first = await openShop();
    await first.user.click(card(/KINETIC THRUSTERS/));

    expect(localStorage.getItem(KEY_COINS)).toBe('30');
    expect(storedUpgrades().speed).toBeCloseTo(9.7, 6); // 8.5 + 1.2
    first.view.unmount();

    // nueva "sesión"
    seedMainMenu();
    render(<App />);
    await userEvent.click(await screen.findByRole('button', {name: /ARMORY \/ SHOP/}));

    expect(await screen.findByText('30 CR')).toBeInTheDocument();
    expect(screen.getByText(/Speed: 9\.7/)).toBeInTheDocument();
    expect(card(/KINETIC THRUSTERS/)).toBeDisabled();
    expect(card(/MAX ARMOR BOOST/)).toBeDisabled(); // 30 < 80
  });
});
