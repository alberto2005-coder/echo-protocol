// tslint:disable
/* eslint-disable */
/**
 * SDK de Playground falso, para cuando no hay iframe/padre que lo proporcione.
 *
 * Nota: los campos son públicos a propósito. Varios se escriben pero no se leen
 * dentro de este doble, y `noUnusedLocals` marcaría los `private` sin lectura.
 */
export class FakePlaygroundSDK {
  isInitialized = false;
  onGameEvent: ((event: any) => void) | null = null;
  onPlayerPresence: ((presence: any) => void) | null = null;
  onLobbyStatus: ((status: any) => void) | null = null;
  onError: ((error: any) => void) | null = null;

  lobbyId = 'fake-lobby-123';
  gameId = 'fake-game-456';
  myPlayerId = 'player-1';
  isHost = true;
  players: any[] = [];
  channel?: BroadcastChannel;
  playersCount = 1;

  constructor() {
    const injectedPlayerId = (window as any).__PLAYER_ID__;
    if (injectedPlayerId) {
      this.myPlayerId = injectedPlayerId;
      this.isHost = injectedPlayerId === 'player-1';
      this.channel = new BroadcastChannel(`playground-lobby-${this.lobbyId}`);
    }
  }

  async init(
    onGameEvent: (event: any) => void,
    onPlayerPresence: (presence: any) => void,
    onLobbyStatus?: (status: any) => void,
    onError?: (error: any) => void,
  ): Promise<void> {
    this.onGameEvent = onGameEvent;
    this.onPlayerPresence = onPlayerPresence;
    if (onLobbyStatus) this.onLobbyStatus = onLobbyStatus;
    if (onError) this.onError = onError;
    this.isInitialized = true;
    window.parent.postMessage({type: 'PREVIEW_READY'}, '*');
  }

  startGame(_lobbyId?: string): void {
    if (this.onLobbyStatus) {
      this.onLobbyStatus({status: 'GAME_IN_PROGRESS', lobbyId: this.lobbyId});
    }
  }

  scoreUpdated(_scoreData: any): void {}
  levelComplete(_level: number | string): void {}
  gameOver(_lobbyId?: string): void {}
  pauseStateChanged(_isPaused: boolean): void {}
  showLeaderboard(_lobbyId?: string): void {}
}
