// tslint:disable
/* eslint-disable */
function getRequestedPlayersCount(): number {
  const requested = Number(
    new URLSearchParams(window.location.search).get('players') ?? '1',
  );
  return Number.isInteger(requested) && requested > 0 ? requested : 1;
}

export class FakePlaygroundSDK {
  private isInitialized = false;
  private onGameEvent: ((event: any) => void) | null = null;
  private onPlayerPresence: ((presence: any) => void) | null = null;
  private onLobbyStatus: ((status: any) => void) | null = null;
  private onError: ((error: any) => void) | null = null;

  private lobbyId = 'fake-lobby-123';
  private gameId = 'fake-game-456';
  private myPlayerId = 'player-1';
  private isHost = true;
  private players: any[] = [];
  private channel!: BroadcastChannel;
  private playersCount = 1;

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

  startGame(lobbyId?: string): void {
    if (this.onLobbyStatus) {
      this.onLobbyStatus({status: 'GAME_IN_PROGRESS', lobbyId: this.lobbyId});
    }
  }

  scoreUpdated(scoreData: any): void {}
  levelComplete(level: number | string): void {}
  gameOver(lobbyId?: string): void {}
  pauseStateChanged(isPaused: boolean): void {}
  showLeaderboard(lobbyId?: string): void {}
}
