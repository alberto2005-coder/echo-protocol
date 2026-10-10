// tslint:disable
/* eslint-disable */
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  Globe,
  Home,
  Info,
  Menu,
  MousePointer,
  Play,
  RotateCw,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {getConfig} from './constants';
import {Game} from './Game';
import {TRANSLATIONS} from './translations';
import type {BossHudData, Language} from './types';
import BackgroundMusic from './utils/BackgroundMusic';
import {MenuOverlay, gameAudio, useIsMobile} from './utils/helper';
import type {GameState} from './utils/helper';
import {
  usePlayground,
  usePlaygroundGameLifecycle
} from './utils/usePlayground';

interface CustomWindow extends Window {
  canHandleBackKey?: boolean;
}

const STORAGE_KEY_COINS = 'echo_protocol_coins_v1';
const STORAGE_KEY_UPGRADES = 'echo_protocol_upgrades_v1';
const STORAGE_KEY_LANG = 'echo_protocol_lang_v1';
const STORAGE_KEY_TUTORIAL = 'echo_protocol_tutorial_completed_v1';
const STORAGE_KEY_BEST_FLOOR = 'echo_protocol_best_floor_v1';
const STORAGE_KEY_AUDIO = 'echo_protocol_audio_v1';

type AudioPrefs = {musicVolume: number; sfxVolume: number; isMuted: boolean};
const AUDIO_DEFAULTS: AudioPrefs = {
  // El volumen inicial de música es ajustable desde CONFIG / playground_config.json
  musicVolume: getConfig('defaultMusicVolume'),
  sfxVolume: 0.6,
  isMuted: false,
};

function loadAudioPrefs(): AudioPrefs {
  if (typeof window === 'undefined') return AUDIO_DEFAULTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUDIO);
    if (!saved) return AUDIO_DEFAULTS;
    const parsed = JSON.parse(saved);
    return {
      musicVolume:
        typeof parsed.musicVolume === 'number' ? parsed.musicVolume : AUDIO_DEFAULTS.musicVolume,
      sfxVolume:
        typeof parsed.sfxVolume === 'number' ? parsed.sfxVolume : AUDIO_DEFAULTS.sfxVolume,
      isMuted: typeof parsed.isMuted === 'boolean' ? parsed.isMuted : AUDIO_DEFAULTS.isMuted,
    };
  } catch {
    return AUDIO_DEFAULTS;
  }
}

export default function App() {
  const {sdk} = usePlayground();
  const isMobile = useIsMobile();

  // Saved Best / High Score Floor
  const [bestFloor, setBestFloor] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BEST_FLOOR);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 1 : Math.max(1, parsed);
      }
      return 1;
    } catch {
      return 1;
    }
  });

  const [isNewRecord, setIsNewRecord] = useState(false);

  // Check if onboarding / tutorial was previously completed
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const completed = localStorage.getItem(STORAGE_KEY_TUTORIAL);
    return completed !== 'true';
  });

  // Saved language preference
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    return saved === 'es' ? 'es' : 'en';
  });

  // Onboarding modal states
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(isFirstTimeUser);
  const [onboardingStep, setOnboardingStep] = useState<'language' | 'slide1' | 'slide2' | 'slide3'>(
    () => {
      if (typeof window === 'undefined') return 'slide1';
      const hasSavedLang = localStorage.getItem(STORAGE_KEY_LANG);
      return hasSavedLang ? 'slide1' : 'language';
    },
  );

  const t = TRANSLATIONS[language];

  // Complete Onboarding Flow
  const completeOnboarding = () => {
    gameAudio.playConfirmSelect();
    setIsOnboardingOpen(false);
    setIsFirstTimeUser(false);
    try {
      localStorage.setItem(STORAGE_KEY_TUTORIAL, 'true');
    } catch {}
  };

  // Replay Onboarding from Settings or Guide
  const replayOnboarding = () => {
    gameAudio.playCrispClick();
    setIsSettingsOpen(false);
    setIsHowToPlayOpen(false);
    setOnboardingStep('slide1');
    setIsOnboardingOpen(true);
  };

  // Saved persistent upgrades
  const [persistentUpgrades, setPersistentUpgrades] = useState(() => {
    const defaults = {
      maxHealth: 100,
      weaponDamage: 25,
      fireRate: 3.5,
      speed: 8.5,
    };
    if (typeof window === 'undefined') return defaults;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UPGRADES);
      return saved ? {...defaults, ...JSON.parse(saved)} : defaults;
    } catch {
      return defaults;
    }
  });

  // Saved persistent coins (Starts with 100 testing coins as requested!)
  const [persistentCoins, setPersistentCoins] = useState<number>(() => {
    if (typeof window === 'undefined') return 100;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COINS);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 100 : parsed;
      }
      return 100; // 100 Starting coins for testing
    } catch {
      return 100;
    }
  });

  // Save coins to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COINS, persistentCoins.toString());
    } catch {}
  }, [persistentCoins]);

  // Save upgrades to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UPGRADES, JSON.stringify(persistentUpgrades));
    } catch {}
  }, [persistentUpgrades]);

  // Save language to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language);
    } catch {}
  }, [language]);

  // Save Best Floor to localStorage whenever it increases
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BEST_FLOOR, bestFloor.toString());
    } catch {}
  }, [bestFloor]);

  // Audio settings (persistidas en echo_protocol_audio_v1)
  const [musicVolume, setMusicVolume] = useState(() => loadAudioPrefs().musicVolume);
  const [sfxVolume, setSfxVolume] = useState(() => loadAudioPrefs().sfxVolume);
  const [isAudioMuted, setIsAudioMuted] = useState(() => loadAudioPrefs().isMuted);

  useEffect(() => {
    gameAudio.setVolume(isAudioMuted ? 0 : sfxVolume);
    try {
      localStorage.setItem(
        STORAGE_KEY_AUDIO,
        JSON.stringify({musicVolume, sfxVolume, isMuted: isAudioMuted}),
      );
    } catch {}
  }, [sfxVolume, isAudioMuted, musicVolume]);

  // Active game state
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1,
    floor: 1,
    health: persistentUpgrades.maxHealth,
    maxHealth: persistentUpgrades.maxHealth,
    coins: persistentCoins,
    weaponDamage: persistentUpgrades.weaponDamage,
    fireRate: persistentUpgrades.fireRate,
    speed: persistentUpgrades.speed,
    dronesLeft: 3,
    elevatorReady: false,
    isShopOpen: false,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const [gameKey, setGameKey] = useState(0);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isMainMenuShopOpen, setIsMainMenuShopOpen] = useState(false);
  const [hitMarkerTimer, setHitMarkerTimer] = useState(0);
  const [rewardToast, setRewardToast] = useState<string | null>(null);
  const [bossData, setBossData] = useState<BossHudData | null>(null);

  useEffect(() => {
    (window as CustomWindow).canHandleBackKey = ['PLAYING', 'PAUSED'].includes(
      gameState.status,
    );
  }, [gameState.status]);

  // Sync state coins with persistent balance
  const addCoins = useCallback((amount: number, toastMsg?: string) => {
    setPersistentCoins((prev) => {
      const next = prev + amount;
      setGameState((gs) => ({...gs, coins: next}));
      return next;
    });
    if (toastMsg) {
      setRewardToast(toastMsg);
      setTimeout(() => setRewardToast(null), 2500);
    }
  }, []);

  // Return to Main Menu with complete HUD and Overlay cleanup
  const returnToMainMenu = useCallback(() => {
    gameAudio.playCrispClick();
    setBossData(null);
    setRewardToast(null);
    setHitMarkerTimer(0);
    setIsGameMenuOpen(false);
    setIsMainMenuShopOpen(false);
    setIsSettingsOpen(false);
    setIsHowToPlayOpen(false);
    setGameState((prev) => ({
      ...prev,
      status: 'START',
      isShopOpen: false,
      elevatorReady: false,
    }));
  }, []);

  // Flash hitmarker on enemy impact
  const triggerHitMarker = useCallback(() => {
    setHitMarkerTimer(0.12);
  }, []);

  useEffect(() => {
    if (hitMarkerTimer > 0) {
      const timeout = setTimeout(() => setHitMarkerTimer(0), 120);
      return () => clearTimeout(timeout);
    }
  }, [hitMarkerTimer]);

  // Start / Restart entire run from Floor 1
  const initGame = useCallback(() => {
    setIsNewRecord(false);
    setBossData(null);
    setGameState({
      status: 'PLAYING',
      score: 0,
      level: 1,
      floor: 1,
      health: persistentUpgrades.maxHealth,
      maxHealth: persistentUpgrades.maxHealth,
      coins: persistentCoins,
      weaponDamage: persistentUpgrades.weaponDamage,
      fireRate: persistentUpgrades.fireRate,
      speed: persistentUpgrades.speed,
      dronesLeft: 3,
      elevatorReady: false,
      isShopOpen: false,
    });
    setGameKey((prev) => prev + 1);
    setIsGameMenuOpen(false);
    setIsMainMenuShopOpen(false);

    if (sdk) {
      sdk.startGame();
    }
  }, [sdk, persistentCoins, persistentUpgrades]);

  // Enemy killed instant reward handler
  const handleEnemyKilled = useCallback((coinsEarned: number) => {
    addCoins(coinsEarned);
    setGameState((prev) => ({
      ...prev,
      score: prev.score + 150 * prev.floor,
      dronesLeft: Math.max(0, prev.dronesLeft - 1),
    }));
  }, [addCoins]);

  // Floor completed bonus handler
  const handleFloorCompleted = useCallback((bonus: number) => {
    const isBoss = gameStateRef.current.floor % 5 === 0;
    const msg = isBoss
      ? `+${bonus} ${t.coins} - ${t.bossDefeated}`
      : `+${bonus} ${t.coins} - ${t.sectorSecured}`;
    addCoins(bonus, msg);
    setGameState((prev) => ({
      ...prev,
      elevatorReady: true,
      score: prev.score + bonus * 5 + (isBoss ? 2000 : 600),
    }));
  }, [addCoins, t]);

  // Next Floor Ascension
  const handleAscendFloor = () => {
    gameAudio.playLevelUpStinger();
    const nextFloor = gameState.floor + 1;

    // Check if player broke previous best floor record
    if (nextFloor > bestFloor) {
      setBestFloor(nextFloor);
      setIsNewRecord(true);
    }

    setGameState((prev) => ({
      ...prev,
      floor: nextFloor,
      level: nextFloor,
      score: prev.score + 1000 * prev.floor,
      elevatorReady: false,
      isShopOpen: false,
      status: 'PLAYING',
    }));
  };

  // Upgrades purchase logic (Permanent + Instant)
  const handleBuyUpgrade = (type: string, cost: number) => {
    if (persistentCoins < cost) {
      gameAudio.playCrispClick();
      return;
    }

    gameAudio.playPowerupChime();
    const nextCoins = persistentCoins - cost;
    setPersistentCoins(nextCoins);

    if (type === 'repair') {
      setGameState((prev) => ({
        ...prev,
        coins: nextCoins,
        health: Math.min(prev.maxHealth, prev.health + 50),
      }));
      return;
    }

    setPersistentUpgrades((prevUp: typeof persistentUpgrades) => {
      let updated = {...prevUp};
      switch (type) {
        case 'max_hp':
          updated.maxHealth += 25;
          break;
        case 'damage':
          updated.weaponDamage += 15;
          break;
        case 'firerate':
          updated.fireRate += 0.9;
          break;
        case 'speed':
          updated.speed += 1.2;
          break;
      }
      return updated;
    });

    setGameState((prev) => {
      switch (type) {
        case 'max_hp':
          return {
            ...prev,
            coins: nextCoins,
            maxHealth: prev.maxHealth + 25,
            health: prev.health + 25,
          };
        case 'damage':
          return {
            ...prev,
            coins: nextCoins,
            weaponDamage: prev.weaponDamage + 15,
          };
        case 'firerate':
          return {
            ...prev,
            coins: nextCoins,
            fireRate: prev.fireRate + 0.9,
          };
        case 'speed':
          return {
            ...prev,
            coins: nextCoins,
            speed: prev.speed + 1.2,
          };
        default:
          return {...prev, coins: nextCoins};
      }
    });
  };

  usePlaygroundGameLifecycle(gameState, sdk);

  // Keyboard shortcut for Escape to exit pointerlock / open menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameStateRef.current.status === 'PLAYING' || gameStateRef.current.status === 'PAUSED') {
          setIsGameMenuOpen((prev) => {
            const nextIsOpen = !prev;
            setGameState((gs) => ({...gs, status: nextIsOpen ? 'PAUSED' : 'PLAYING'}));
            return nextIsOpen;
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMusicPlaying = ['PLAYING', 'PAUSED'].includes(gameState.status);

  return (
    <div className="fixed inset-0 overflow-hidden touch-none flex flex-col bg-zinc-950 text-white font-mono select-none">
      <BackgroundMusic
        url={getConfig('backgroundMusicUrl') as string}
        isPlaying={isMusicPlaying}
        isMuted={isAudioMuted}
        volume={musicVolume}
      />

      {/* Top Header & HUD Bar */}
      {gameState.status === 'PLAYING' && (
        <header className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-cyan-500/30 z-20 shrink-0 backdrop-blur-md">
          {/* Left: Armor & Floor / Record */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase tracking-wider font-bold ${
                gameState.floor % 5 === 0 ? 'text-red-400 animate-pulse' : 'text-cyan-400'
              }`}>
                {gameState.floor === 1
                  ? t.tutorialFloor
                  : gameState.floor % 5 === 0
                  ? t.bossFloor
                  : t.sectorFloor}
              </span>
              <div className="flex items-center gap-1.5 text-xs md:text-sm">
                <span className="font-black text-white">
                  {t.currentFloor}: {gameState.floor}
                </span>
                <span className="text-zinc-500">|</span>
                <span className="text-amber-300/90 font-bold flex items-center gap-1 text-[11px] md:text-xs">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  {t.record}: {Math.max(bestFloor, gameState.floor)}
                </span>
              </div>
            </div>

            {/* Health / Armor Bar */}
            <div className="flex flex-col w-28 md:w-44">
              <div className="flex justify-between text-[10px] text-zinc-400 font-bold mb-1">
                <span>{t.armorIntegrity}</span>
                <span>{Math.round((gameState.health / gameState.maxHealth) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-cyan-400 transition-all duration-300"
                  style={{
                    width: `${Math.max(0, (gameState.health / gameState.maxHealth) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Center: Persistent Coin Balance & Hostiles Remaining */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 bg-amber-500/20 border-2 border-amber-400/80 px-4 py-1.5 rounded-xl shadow-lg shadow-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="text-sm md:text-base font-black text-amber-300">
                {t.coins}: {persistentCoins}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-300 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>{t.hostiles}: {gameState.dronesLeft}</span>
            </div>
          </div>

          {/* Right: Score & Reserved Menu Button */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-zinc-400 font-bold">{t.score}</div>
              <div className="text-xs md:text-sm font-black text-cyan-300">
                {gameState.score}
              </div>
            </div>

            <button
              onClick={() => {
                gameAudio.playCrispClick();
                setIsGameMenuOpen(true);
                setGameState((prev) => ({...prev, status: 'PAUSED'}));
              }}
              aria-label="Open Menu"
              className="p-2 min-w-[48px] min-h-[48px] rounded-xl bg-zinc-800 border border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-400 transition-colors flex items-center justify-center cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {/* Floating Reward Toast */}
      {rewardToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="bg-amber-400 text-zinc-950 font-black px-6 py-2 rounded-full shadow-2xl shadow-amber-400/60 flex items-center gap-2 text-xs md:text-sm border-2 border-amber-200">
            <Sparkles className="w-4 h-4 text-zinc-950" />
            {rewardToast}
          </div>
        </div>
      )}

      {/* Main 3D Canvas Viewport */}
      <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
        <Game
          key={gameKey}
          gameState={gameState}
          setGameState={setGameState}

          gameStateRef={gameStateRef}
          onOpenShop={() => {
            gameAudio.playLevelUpStinger();
            setGameState((prev) => ({...prev, isShopOpen: true}));
          }}
          onHitDrone={triggerHitMarker}
          onEnemyKilled={handleEnemyKilled}
          onFloorCompleted={handleFloorCompleted}
          onBossUpdate={setBossData}
          language={language}
        />

        {/* PROMINENT TOP-CENTER BOSS HEALTH BAR (BOSS FLOORS 5, 10, 15...) */}
        {gameState.status === 'PLAYING' && bossData && !gameState.isShopOpen && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-lg pointer-events-none animate-bounce-short">
            <div className="bg-zinc-950/90 border-2 border-red-500/80 rounded-2xl px-4 py-2.5 shadow-2xl shadow-red-500/40 backdrop-blur-xl flex flex-col">
              <div className="flex items-center justify-between text-xs font-black mb-1.5">
                <div className="flex items-center gap-2 text-red-400 uppercase tracking-wider font-mono">
                  <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="text-white drop-shadow">{bossData.name}</span>
                </div>
                <div className="text-amber-300 font-bold font-mono text-[11px]">
                  {Math.max(0, Math.round(bossData.health))} / {bossData.maxHealth} HP
                </div>
              </div>
              {/* Wide Boss Health Bar */}
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-red-500/60 p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 rounded-full transition-all duration-150 shadow-lg shadow-red-500/50"
                  style={{
                    width: `${Math.max(0, (bossData.health / bossData.maxHealth) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Center FPS Crosshair & Hitmarker */}
        {gameState.status === 'PLAYING' && !gameState.isShopOpen && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="relative flex items-center justify-center">
              {/* Outer Reticle Ring */}
              <div
                className={`w-8 h-8 rounded-full border border-cyan-400/40 transition-all duration-100 ${
                  hitMarkerTimer > 0 ? 'scale-125 border-red-400' : 'scale-100'
                }`}
              />
              {/* Center Dot */}
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  hitMarkerTimer > 0 ? 'bg-red-400 scale-150' : 'bg-cyan-400'
                }`}
              />
              {/* Hitmarker X ticks */}
              {hitMarkerTimer > 0 && (
                <>
                  <div className="absolute w-3 h-0.5 bg-red-400 rotate-45" />
                  <div className="absolute w-3 h-0.5 bg-red-400 -rotate-45" />
                </>
              )}
            </div>
          </div>
        )}

        {/* LEVEL 1 TUTORIAL PROMPTS OVERLAY */}
        {gameState.status === 'PLAYING' && gameState.floor === 1 && !gameState.isShopOpen && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-15 flex flex-col items-center">
            <div className="bg-zinc-950/85 border border-cyan-500/50 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-center gap-2 md:gap-4 text-[11px] md:text-xs">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Compass className="w-3.5 h-3.5" />
                {t.tutorialMove}
              </span>
              <span className="text-zinc-600 hidden sm:inline">|</span>
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <MousePointer className="w-3.5 h-3.5" />
                {t.tutorialAim}
              </span>
              <span className="text-zinc-600 hidden sm:inline">|</span>
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Crosshair className="w-3.5 h-3.5" />
                {t.tutorialShoot}
              </span>
              <span className="text-zinc-600 hidden sm:inline">|</span>
              <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                <Zap className="w-3.5 h-3.5" />
                {t.tutorialJump}
              </span>
            </div>
          </div>
        )}

        {/* Desktop Controls Bottom Hint */}
        {gameState.status === 'PLAYING' && !isMobile && !gameState.isShopOpen && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-10 text-center">
            <span className="text-[11px] text-zinc-400 bg-zinc-900/85 px-4 py-1.5 rounded-full border border-zinc-800 shadow-md">
              {t.desktopControls}
            </span>
          </div>
        )}
      </div>

      {/* Persistent Mobile Controls (Touch Screens) */}
      {gameState.status === 'PLAYING' && isMobile && !gameState.isShopOpen && (
        <div className="absolute inset-0 pointer-events-none z-30 flex justify-between items-end p-4 pb-6">
          {/* Virtual Directional Controls */}
          <div className="pointer-events-auto flex flex-col items-center gap-1 bg-zinc-900/80 p-2 rounded-2xl border border-cyan-500/30 backdrop-blur-md">
            <button
              onPointerDown={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', {key: 'w'}));
              }}
              onPointerUp={() => {
                window.dispatchEvent(new KeyboardEvent('keyup', {key: 'w'}));
              }}
              className="w-12 h-12 bg-zinc-800 active:bg-cyan-500 text-white rounded-lg flex items-center justify-center">
              <ArrowUp className="w-6 h-6" />
            </button>
            <div className="flex gap-1">
              <button
                onPointerDown={() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', {key: 'a'}));
                }}
                onPointerUp={() => {
                  window.dispatchEvent(new KeyboardEvent('keyup', {key: 'a'}));
                }}
                className="w-12 h-12 bg-zinc-800 active:bg-cyan-500 text-white rounded-lg flex items-center justify-center">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onPointerDown={() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', {key: 's'}));
                }}
                onPointerUp={() => {
                  window.dispatchEvent(new KeyboardEvent('keyup', {key: 's'}));
                }}
                className="w-12 h-12 bg-zinc-800 active:bg-cyan-500 text-white rounded-lg flex items-center justify-center">
                <ArrowDown className="w-6 h-6" />
              </button>
              <button
                onPointerDown={() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', {key: 'd'}));
                }}
                onPointerUp={() => {
                  window.dispatchEvent(new KeyboardEvent('keyup', {key: 'd'}));
                }}
                className="w-12 h-12 bg-zinc-800 active:bg-cyan-500 text-white rounded-lg flex items-center justify-center">
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Action Buttons: Fire, Jump/Dash, Shop */}
          <div className="pointer-events-auto flex flex-col items-end gap-2.5">
            {gameState.elevatorReady && (
              <button
                onClick={() => {
                  gameAudio.playLevelUpStinger();
                  setGameState((prev) => ({...prev, isShopOpen: true}));
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-400 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg animate-pulse">
                <ShoppingBag className="w-4 h-4" />
                {t.shop}
              </button>
            )}

            <div className="flex gap-2">
              <button
                onPointerDown={() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', {key: ' '}));
                }}
                onPointerUp={() => {
                  window.dispatchEvent(new KeyboardEvent('keyup', {key: ' '}));
                }}
                className="w-14 h-14 bg-purple-600/90 active:bg-purple-400 text-white rounded-2xl flex flex-col items-center justify-center text-[10px] font-bold border border-purple-400/40 shadow-md">
                <Zap className="w-5 h-5" />
                JUMP
              </button>

              <button
                onPointerDown={() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
                }}
                onPointerUp={() => {
                  window.dispatchEvent(new KeyboardEvent('keyup', {key: 'Enter'}));
                }}
                className="w-16 h-16 bg-cyan-500 active:bg-cyan-300 text-zinc-950 rounded-2xl flex flex-col items-center justify-center text-xs font-black shadow-lg shadow-cyan-500/50">
                <Crosshair className="w-7 h-7" />
                FIRE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* START SCREEN / MAIN MENU */}
      {gameState.status === 'START' && (
        <MenuOverlay tone="neutral">
          <div className="bg-zinc-900/95 border-2 border-cyan-500/40 p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-md backdrop-blur-xl">
            {/* Top Saved Credits & High Score / Best Floor Banner */}
            <div className="w-full grid grid-cols-2 gap-2.5 mb-5">
              <div className="flex items-center justify-between bg-zinc-950/90 border border-amber-500/50 px-3.5 py-2.5 rounded-xl shadow-lg shadow-amber-500/10">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  {t.coins}:
                </span>
                <span className="text-sm md:text-base font-black text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  {persistentCoins}
                </span>
              </div>

              <div className="flex items-center justify-between bg-zinc-950/90 border border-cyan-500/50 px-3.5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/10">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  {t.bestFloor}:
                </span>
                <span className="text-sm md:text-base font-black text-cyan-300 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  FL-{bestFloor}
                </span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-black mb-1 text-cyan-400 text-center tracking-wider font-mono">
              {t.gameTitle}
            </h1>
            <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-4 text-center">
              {t.gameSubtitle}
            </p>
            <p className="text-xs md:text-sm text-zinc-300 text-center mb-6 leading-relaxed">
              {t.gameDescription}
            </p>

            {/* Menu Buttons: Play, Shop, Settings, Guide */}
            <div className="flex flex-col gap-3 w-full">
              {/* PLAY / JUGAR */}
              <button
                onClick={initGame}
                autoFocus
                data-testid="start-button"
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-zinc-950 py-3.5 rounded-xl font-black text-base md:text-lg hover:from-cyan-400 hover:to-cyan-300 transition-all shadow-lg shadow-cyan-500/40 flex items-center justify-center gap-2 cursor-pointer">
                <Play className="w-5 h-5 fill-current" />
                {t.play}
              </button>

              {/* SHOP / TIENDA */}
              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsMainMenuShopOpen(true);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 py-3 rounded-xl font-black text-sm md:text-base hover:from-amber-400 hover:to-amber-300 transition-all shadow-md shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer">
                <ShoppingBag className="w-5 h-5" />
                {t.shop}
              </button>

              {/* SETTINGS / AJUSTES & GUIDE */}
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <button
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setIsSettingsOpen(true);
                  }}
                  className="bg-zinc-800 text-cyan-300 py-2.5 rounded-xl font-bold text-xs hover:bg-zinc-700 transition-all border border-zinc-700 flex items-center justify-center gap-2">
                  <Settings className="w-4 h-4" />
                  {t.settings}
                </button>

                <button
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setIsHowToPlayOpen(true);
                  }}
                  className="bg-zinc-800 text-zinc-300 py-2.5 rounded-xl font-bold text-xs hover:bg-zinc-700 transition-all border border-zinc-700 flex items-center justify-center gap-2">
                  <Info className="w-4 h-4" />
                  {t.guide}
                </button>
              </div>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* UPGRADE SHOP (ACCESSIBLE FROM MAIN MENU OR IN-GAME ELEVATOR) */}
      {(gameState.isShopOpen || isMainMenuShopOpen) && (
        <MenuOverlay tone="victory" zIndex={60}>
          <div className="w-full max-w-lg bg-zinc-900 border-2 border-cyan-400/60 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-white">
            <div className="flex items-center gap-2 mb-1 text-cyan-400">
              <ShoppingBag className="w-6 h-6" />
              <h2 className="text-xl md:text-2xl font-black tracking-wider">
                {t.elevatorTerminal}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 text-center mb-4">
              {t.shopSubtitle}
            </p>

            {/* Current Credit Bank */}
            <div className="w-full flex justify-between items-center bg-zinc-950/90 px-4 py-2.5 rounded-xl border border-amber-500/50 mb-4 shadow-md">
              <span className="text-xs text-zinc-400 font-bold">{t.availableCredits}:</span>
              <span className="text-base font-black text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                {persistentCoins} {t.credits}
              </span>
            </div>

            {/* Upgrade Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full mb-6">
              {/* Armor Repair (In-game only) */}
              {gameState.status === 'PLAYING' && (
                <button
                  onClick={() => handleBuyUpgrade('repair', 50)}
                  disabled={persistentCoins < 50 || gameState.health >= gameState.maxHealth}
                  className={`p-3 rounded-xl border flex flex-col items-start transition-all ${
                    persistentCoins >= 50 && gameState.health < gameState.maxHealth
                      ? 'bg-zinc-800/90 border-cyan-500/40 hover:bg-cyan-500/20 cursor-pointer'
                      : 'bg-zinc-900/40 border-zinc-800 opacity-50 cursor-not-allowed'
                  }`}>
                  <div className="flex justify-between w-full font-bold text-xs">
                    <span className="text-cyan-300">{t.armorRepair}</span>
                    <span className="text-amber-400">50 {t.credits}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1">
                    {t.armorRepairDesc} ({gameState.health}/{gameState.maxHealth})
                  </span>
                </button>
              )}

              {/* Max HP Boost */}
              <button
                onClick={() => handleBuyUpgrade('max_hp', 80)}
                disabled={persistentCoins < 80}
                className={`p-3 rounded-xl border flex flex-col items-start transition-all ${
                  persistentCoins >= 80
                    ? 'bg-zinc-800/90 border-cyan-500/40 hover:bg-cyan-500/20 cursor-pointer'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-50 cursor-not-allowed'
                }`}>
                <div className="flex justify-between w-full font-bold text-xs">
                  <span className="text-cyan-300">{t.platingBoost}</span>
                  <span className="text-amber-400">80 {t.credits}</span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-1">
                  {t.platingBoostDesc} (Max: {persistentUpgrades.maxHealth})
                </span>
              </button>

              {/* Weapon Damage */}
              <button
                onClick={() => handleBuyUpgrade('damage', 90)}
                disabled={persistentCoins < 90}
                className={`p-3 rounded-xl border flex flex-col items-start transition-all ${
                  persistentCoins >= 90
                    ? 'bg-zinc-800/90 border-cyan-500/40 hover:bg-cyan-500/20 cursor-pointer'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-50 cursor-not-allowed'
                }`}>
                <div className="flex justify-between w-full font-bold text-xs">
                  <span className="text-cyan-300">{t.plasmaCore}</span>
                  <span className="text-amber-400">90 {t.credits}</span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-1">
                  {t.plasmaCoreDesc} (Current: {persistentUpgrades.weaponDamage})
                </span>
              </button>

              {/* Fire Rate */}
              <button
                onClick={() => handleBuyUpgrade('firerate', 85)}
                disabled={persistentCoins < 85}
                className={`p-3 rounded-xl border flex flex-col items-start transition-all ${
                  persistentCoins >= 85
                    ? 'bg-zinc-800/90 border-cyan-500/40 hover:bg-cyan-500/20 cursor-pointer'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-50 cursor-not-allowed'
                }`}>
                <div className="flex justify-between w-full font-bold text-xs">
                  <span className="text-cyan-300">{t.overclockSights}</span>
                  <span className="text-amber-400">85 {t.credits}</span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-1">
                  {t.overclockSightsDesc} (Current: {persistentUpgrades.fireRate.toFixed(1)})
                </span>
              </button>

              {/* Speed Boost */}
              <button
                onClick={() => handleBuyUpgrade('speed', 70)}
                disabled={persistentCoins < 70}
                className={`p-3 rounded-xl border flex flex-col items-start transition-all ${
                  persistentCoins >= 70
                    ? 'bg-zinc-800/90 border-cyan-500/40 hover:bg-cyan-500/20 cursor-pointer'
                    : 'bg-zinc-900/40 border-zinc-800 opacity-50 cursor-not-allowed'
                }`}>
                <div className="flex justify-between w-full font-bold text-xs">
                  <span className="text-cyan-300">{t.kineticThrusters}</span>
                  <span className="text-amber-400">70 {t.credits}</span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-1">
                  {t.kineticThrustersDesc} (Speed: {persistentUpgrades.speed.toFixed(1)})
                </span>
              </button>
            </div>

            {/* Action Buttons depending on where Shop was opened */}
            {gameState.status === 'PLAYING' ? (
              <button
                onClick={handleAscendFloor}
                autoFocus
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-zinc-950 py-3.5 rounded-xl font-black text-base md:text-lg hover:from-cyan-400 hover:to-emerald-300 transition-all shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer">
                <Zap className="w-5 h-5" />
                {t.ascendToFloor} (FL-{gameState.floor + 1})
              </button>
            ) : (
              <button
                onClick={() => setIsMainMenuShopOpen(false)}
                autoFocus
                className="w-full bg-cyan-500 text-zinc-950 py-3.5 rounded-xl font-black text-base hover:bg-cyan-400 transition-all shadow-lg cursor-pointer">
                {t.closeShop}
              </button>
            )}
          </div>
        </MenuOverlay>
      )}

      {/* SETTINGS MODAL (LANGUAGE & AUDIO) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/90 z-[75] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 border-2 border-cyan-500/50 rounded-2xl p-6 shadow-2xl flex flex-col">
            <h3 className="text-xl font-black text-cyan-400 mb-5 tracking-wider flex items-center gap-2 font-mono">
              <Settings className="w-5 h-5" />
              {t.settingsTitle}
            </h3>

            {/* Language Selector */}
            <div className="mb-5 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800">
              <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 mb-2.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                {t.language}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setLanguage('en');
                  }}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    language === 'en'
                      ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/30'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}>
                  {t.english}
                </button>
                <button
                  onClick={() => {
                    gameAudio.playCrispClick();
                    setLanguage('es');
                  }}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    language === 'es'
                      ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/30'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}>
                  {t.spanish}
                </button>
              </div>
            </div>

            {/* Music Volume */}
            <div className="mb-4 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800">
              <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  {t.musicVolume}
                </span>
                <span className="text-cyan-300">{Math.round(musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div className="mb-4 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800">
              <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  {t.sfxVolume}
                </span>
                <span className="text-cyan-300">{Math.round(sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVolume}
                onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Mute Audio Toggle */}
            <button
              onClick={() => {
                const next = !isAudioMuted;
                setIsAudioMuted(next);
                gameAudio.setMuted(next);
              }}
              className="mb-3 w-full py-2.5 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center gap-2 text-zinc-300 cursor-pointer">
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              {isAudioMuted ? t.audioMuted : t.audioUnmuted}
            </button>

            {/* Replay Tutorial / Onboarding */}
            <button
              onClick={replayOnboarding}
              className="mb-6 w-full py-2.5 rounded-xl font-bold text-xs bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Info className="w-4 h-4 text-cyan-400" />
              {t.replayTutorial}
            </button>

            {/* Close Button */}
            <button
              onClick={() => setIsSettingsOpen(false)}
              autoFocus
              className="w-full bg-cyan-500 text-zinc-950 py-3 rounded-xl font-black text-sm hover:bg-cyan-400 transition-colors cursor-pointer">
              {t.closeSettings}
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN WITH CLEAR PLAY AGAIN & MAIN MENU BUTTONS */}
      {gameState.status === 'GAME_OVER' && (
        <MenuOverlay tone="danger" zIndex={65}>
          <div className="w-full max-w-md bg-zinc-900/95 border-2 border-red-500/60 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-3 shadow-lg shadow-red-500/20">
              <RotateCw className="w-7 h-7" />
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-red-400 mb-2 tracking-wider">
              {t.armorCompromised}
            </h2>

            {/* NEW HIGH SCORE / BEST RECORD CELEBRATION BANNER */}
            {(isNewRecord || gameState.floor > bestFloor) && (
              <div className="w-full bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 border-2 border-amber-400 text-amber-300 py-2 px-4 rounded-xl font-black text-xs md:text-sm tracking-wider mb-3 animate-pulse shadow-lg shadow-amber-400/20 flex items-center justify-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                {t.newRecordBanner}
              </div>
            )}

            {/* Mission Stats Breakdown */}
            <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 my-2 space-y-2 text-xs md:text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>{t.reachedFloor}:</span>
                <span className="font-bold text-white">FL-{gameState.floor}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>{t.bestFloor}:</span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  FL-{Math.max(bestFloor, gameState.floor)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>{t.totalScore}:</span>
                <span className="font-bold text-cyan-300">{gameState.score}</span>
              </div>
              <div className="flex justify-between text-zinc-400 border-t border-zinc-800/80 pt-2">
                <span>{t.totalCredits}:</span>
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {persistentCoins} {t.credits}
                </span>
              </div>
            </div>

            {/* Action Buttons: Play Again & Return to Main Menu */}
            <div className="flex flex-col gap-3 w-full mt-2">
              <button
                onClick={initGame}
                autoFocus
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-zinc-950 py-3.5 rounded-xl font-black text-base hover:from-cyan-400 hover:to-cyan-300 transition-all shadow-lg shadow-cyan-500/40 flex items-center justify-center gap-2 cursor-pointer">
                <RotateCw className="w-5 h-5" />
                {t.playAgain}
              </button>

              <button
                onClick={returnToMainMenu}
                className="w-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 py-3 rounded-xl font-bold text-sm transition-all border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer">
                <Home className="w-4 h-4" />
                {t.mainMenu}
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* PAUSE / IN-GAME MENU */}
      {isGameMenuOpen && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="w-full max-w-sm bg-zinc-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <h2 className="text-2xl font-black text-cyan-400 mb-4 tracking-wider">{t.paused}</h2>

            <div className="flex flex-col gap-3 w-full mb-6">
              <button
                onClick={() => {
                  setIsGameMenuOpen(false);
                  setGameState((prev) => ({...prev, status: 'PLAYING'}));
                }}
                autoFocus
                className="w-full bg-cyan-500 text-zinc-950 py-2.5 rounded-xl font-bold text-sm hover:bg-cyan-400 transition-colors cursor-pointer">
                {t.resume}
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsSettingsOpen(true);
                }}
                className="w-full bg-zinc-800 text-cyan-300 py-2.5 rounded-xl font-bold text-xs hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 border border-zinc-700">
                <Settings className="w-4 h-4" />
                {t.settings}
              </button>

              <button
                onClick={() => {
                  gameAudio.playCrispClick();
                  setIsHowToPlayOpen(true);
                }}
                className="w-full bg-zinc-800 text-zinc-300 py-2.5 rounded-xl font-bold text-xs hover:bg-zinc-700 transition-colors border border-zinc-700 flex items-center justify-center gap-2">
                <Info className="w-4 h-4" />
                {t.guide}
              </button>

              <button
                onClick={initGame}
                className="w-full bg-zinc-800 text-amber-400 py-2.5 rounded-xl font-bold text-xs hover:bg-zinc-700 transition-colors border border-zinc-700">
                {t.restartFloor1}
              </button>

              <button
                onClick={returnToMainMenu}
                className="w-full bg-red-950/60 text-red-400 py-2 rounded-xl font-bold text-xs hover:bg-red-900/60 border border-red-900/50">
                {t.abortToTitle}
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* HOW TO PLAY SCREEN */}
      {isHowToPlayOpen && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-900 border border-cyan-500/50 rounded-2xl p-6 shadow-2xl flex flex-col">
            <h3 className="text-xl font-black text-cyan-400 mb-4 tracking-wider flex items-center gap-2">
              <Info className="w-5 h-5" />
              {t.guideTitle}
            </h3>
            <div className="text-xs text-zinc-300 space-y-3 leading-relaxed mb-4">
              <p>{t.guide1}</p>
              <p>{t.guide2}</p>
              <p>{t.guide3}</p>
              <p>{t.guide4}</p>
            </div>

            <button
              onClick={replayOnboarding}
              className="mb-4 w-full py-2.5 rounded-xl font-bold text-xs bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {t.replayTutorial}
            </button>

            <button
              onClick={() => setIsHowToPlayOpen(false)}
              autoFocus
              className="w-full bg-cyan-500 text-zinc-950 py-2.5 rounded-xl font-black text-sm hover:bg-cyan-400 transition-colors cursor-pointer">
              {t.backToMission}
            </button>
          </div>
        </div>
      )}

      {/* FIRST-TIME USER ONBOARDING / INTERACTIVE INTRODUCTION SLIDES */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 bg-black/95 z-[90] flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border-2 border-cyan-500/60 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* INITIAL STEP: LANGUAGE SELECTION */}
            {onboardingStep === 'language' && (
              <div className="w-full flex flex-col items-center text-center z-10">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-4 shadow-lg shadow-cyan-500/20">
                  <Globe className="w-8 h-8 animate-pulse" />
                </div>

                <h2 className="text-xl md:text-2xl font-black text-cyan-300 mb-2 tracking-wider font-mono">
                  {t.chooseLanguageTitle}
                </h2>
                <p className="text-xs md:text-sm text-zinc-400 mb-8 max-w-sm">
                  {t.chooseLanguageSubtitle}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4">
                  {/* English Option */}
                  <button
                    onClick={() => {
                      gameAudio.playConfirmSelect();
                      setLanguage('en');
                      setOnboardingStep('slide1');
                    }}
                    className="p-5 rounded-2xl bg-zinc-950/80 border-2 border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer shadow-lg">
                    <span className="text-2xl">🇬🇧</span>
                    <span className="text-base font-black text-white group-hover:text-cyan-300">
                      English
                    </span>
                    <span className="text-[11px] text-zinc-400">Play in English</span>
                  </button>

                  {/* Spanish Option */}
                  <button
                    onClick={() => {
                      gameAudio.playConfirmSelect();
                      setLanguage('es');
                      setOnboardingStep('slide1');
                    }}
                    className="p-5 rounded-2xl bg-zinc-950/80 border-2 border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all flex flex-col items-center gap-2 group cursor-pointer shadow-lg">
                    <span className="text-2xl">🇪🇸</span>
                    <span className="text-base font-black text-white group-hover:text-cyan-300">
                      Español
                    </span>
                    <span className="text-[11px] text-zinc-400">Jugar en Español</span>
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE 1: MISSION / STORY OVERVIEW */}
            {onboardingStep === 'slide1' && (
              <div className="w-full flex flex-col items-center text-center z-10">
                {/* Header Icon */}
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 mb-3 shadow-lg shadow-cyan-500/20">
                  <Activity className="w-7 h-7" />
                </div>

                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-1">
                  {t.slide1Subtitle}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-wider font-mono">
                  {t.slide1Title}
                </h2>

                <p className="text-xs md:text-sm text-zinc-300 mb-6 leading-relaxed bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800">
                  {t.slide1Desc}
                </p>

                {/* Key Objectives Highlights */}
                <div className="grid grid-cols-3 gap-2 w-full mb-6">
                  <div className="bg-zinc-950/90 border border-cyan-500/30 p-2.5 rounded-xl flex flex-col items-center text-center">
                    <Crosshair className="w-5 h-5 text-cyan-400 mb-1" />
                    <span className="text-[10px] font-bold text-cyan-300">{t.obj1Title}</span>
                    <span className="text-[9px] text-zinc-400">{t.obj1Desc}</span>
                  </div>
                  <div className="bg-zinc-950/90 border border-amber-500/30 p-2.5 rounded-xl flex flex-col items-center text-center">
                    <Sparkles className="w-5 h-5 text-amber-400 mb-1" />
                    <span className="text-[10px] font-bold text-amber-300">{t.obj2Title}</span>
                    <span className="text-[9px] text-zinc-400">{t.obj2Desc}</span>
                  </div>
                  <div className="bg-zinc-950/90 border border-emerald-500/30 p-2.5 rounded-xl flex flex-col items-center text-center">
                    <Zap className="w-5 h-5 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-bold text-emerald-300">{t.obj3Title}</span>
                    <span className="text-[9px] text-zinc-400">{t.obj3Desc}</span>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 2: CONTROLS BREAKDOWN */}
            {onboardingStep === 'slide2' && (
              <div className="w-full flex flex-col items-center text-center z-10">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300 mb-3 shadow-lg shadow-purple-500/20">
                  <Compass className="w-7 h-7" />
                </div>

                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest mb-1">
                  {t.slide2Subtitle}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-wider font-mono">
                  {t.slide2Title}
                </h2>

                {/* Visual Control Cards */}
                <div className="grid grid-cols-2 gap-2.5 w-full mb-6 text-left">
                  <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl flex flex-col">
                    <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-black mb-1">
                      <Compass className="w-3.5 h-3.5" />
                      {t.ctrlMoveTitle}
                    </div>
                    <span className="text-[10px] text-zinc-400">{t.ctrlMoveDesc}</span>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl flex flex-col">
                    <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-black mb-1">
                      <MousePointer className="w-3.5 h-3.5" />
                      {t.ctrlAimTitle}
                    </div>
                    <span className="text-[10px] text-zinc-400">{t.ctrlAimDesc}</span>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl flex flex-col">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black mb-1">
                      <Crosshair className="w-3.5 h-3.5" />
                      {t.ctrlShootTitle}
                    </div>
                    <span className="text-[10px] text-zinc-400">{t.ctrlShootDesc}</span>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl flex flex-col">
                    <div className="flex items-center gap-1.5 text-purple-400 text-xs font-black mb-1">
                      <Zap className="w-3.5 h-3.5" />
                      {t.ctrlJumpTitle}
                    </div>
                    <span className="text-[10px] text-zinc-400">{t.ctrlJumpDesc}</span>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 3: ECONOMY & ARMORY UPGRADES */}
            {onboardingStep === 'slide3' && (
              <div className="w-full flex flex-col items-center text-center z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 mb-3 shadow-lg shadow-amber-500/20">
                  <ShoppingBag className="w-7 h-7" />
                </div>

                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1">
                  {t.slide3Subtitle}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-wider font-mono">
                  {t.slide3Title}
                </h2>

                <p className="text-xs md:text-sm text-zinc-300 mb-5 leading-relaxed bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800">
                  {t.slide3Desc}
                </p>

                {/* Visual upgrade perks */}
                <div className="grid grid-cols-3 gap-2 w-full mb-6">
                  <div className="bg-zinc-950/90 border border-cyan-500/30 p-2.5 rounded-xl flex flex-col items-center text-center">
                    <Shield className="w-5 h-5 text-cyan-400 mb-1" />
                    <span className="text-[10px] font-bold text-cyan-300">{t.platingBoost}</span>
                    <span className="text-[9px] text-zinc-400">+Armor & Repair</span>
                  </div>
                  <div className="bg-zinc-950/90 border border-amber-500/30 p-2.5 rounded-xl flex flex-col items-center text-center">
                    <Crosshair className="w-5 h-5 text-amber-400 mb-1" />
                    <span className="text-[10px] font-bold text-amber-300">{t.plasmaCore}</span>
                    <span className="text-[9px] text-zinc-400">+Laser Dmg & Rate</span>
                  </div>
                  <div className="bg-zinc-950/90 border border-purple-500/30 p-2.5 rounded-xl flex flex-col items-center text-center">
                    <Zap className="w-5 h-5 text-purple-400 mb-1" />
                    <span className="text-[10px] font-bold text-purple-300">{t.kineticThrusters}</span>
                    <span className="text-[9px] text-zinc-400">+Speed Boost</span>
                  </div>
                </div>
              </div>
            )}

            {/* PROGRESS DOTS & NAVIGATION FOOTER (FOR SLIDES 1, 2, 3) */}
            {onboardingStep !== 'language' && (
              <div className="w-full flex flex-col gap-4 mt-2 z-10">
                {/* Dots indicator */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      gameAudio.playCrispClick();
                      setOnboardingStep('slide1');
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      onboardingStep === 'slide1' ? 'w-8 bg-cyan-400' : 'w-2 bg-zinc-700'
                    }`}
                  />
                  <button
                    onClick={() => {
                      gameAudio.playCrispClick();
                      setOnboardingStep('slide2');
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      onboardingStep === 'slide2' ? 'w-8 bg-cyan-400' : 'w-2 bg-zinc-700'
                    }`}
                  />
                  <button
                    onClick={() => {
                      gameAudio.playCrispClick();
                      setOnboardingStep('slide3');
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      onboardingStep === 'slide3' ? 'w-8 bg-cyan-400' : 'w-2 bg-zinc-700'
                    }`}
                  />
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="flex items-center justify-between gap-3 w-full">
                  {/* Left: Back or Skip */}
                  {onboardingStep === 'slide1' ? (
                    <button
                      onClick={() => {
                        gameAudio.playCrispClick();
                        setOnboardingStep('language');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                      <Globe className="w-3.5 h-3.5" />
                      {language.toUpperCase()}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        gameAudio.playCrispClick();
                        if (onboardingStep === 'slide2') setOnboardingStep('slide1');
                        if (onboardingStep === 'slide3') setOnboardingStep('slide2');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                      <ChevronLeft className="w-4 h-4" />
                      {t.back}
                    </button>
                  )}

                  {/* Skip Option */}
                  <button
                    onClick={completeOnboarding}
                    className="text-xs font-bold text-zinc-400 hover:text-white px-3 py-1 cursor-pointer transition-colors">
                    {t.skip}
                  </button>

                  {/* Right: Next or Start */}
                  {onboardingStep === 'slide1' && (
                    <button
                      onClick={() => {
                        gameAudio.playCrispClick();
                        setOnboardingStep('slide2');
                      }}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-zinc-950 font-black text-xs hover:from-cyan-400 hover:to-cyan-300 transition-all flex items-center gap-1 shadow-md shadow-cyan-500/30 cursor-pointer">
                      {t.next}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {onboardingStep === 'slide2' && (
                    <button
                      onClick={() => {
                        gameAudio.playCrispClick();
                        setOnboardingStep('slide3');
                      }}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-zinc-950 font-black text-xs hover:from-cyan-400 hover:to-cyan-300 transition-all flex items-center gap-1 shadow-md shadow-cyan-500/30 cursor-pointer">
                      {t.next}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {onboardingStep === 'slide3' && (
                    <button
                      onClick={completeOnboarding}
                      autoFocus
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-cyan-500 text-zinc-950 font-black text-xs hover:from-emerald-300 hover:to-cyan-300 transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/40 cursor-pointer">
                      <CheckCircle className="w-4 h-4" />
                      {t.startDeploy}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
