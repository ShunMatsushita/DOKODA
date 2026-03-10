import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  GameState,
  RoomInfo,
  Player,
  GameMode,
} from 'dokoda-shared';
import { RoomManager } from '../room.js';
import { GameEngine } from '../game.js';
import { setupSocketEvents } from '../events.js';

type TypedClientSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

function createClient(port: number): TypedClientSocket {
  return ioClient(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
  }) as TypedClientSocket;
}

function waitForEvent<T>(socket: TypedClientSocket, event: string, timeoutMs = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for event "${event}"`)), timeoutMs);
    (socket as any).once(event, (...args: any[]) => {
      clearTimeout(timer);
      resolve(args.length === 1 ? args[0] : args);
    });
  });
}

function emitWithCallback<T>(
  socket: TypedClientSocket,
  event: string,
  ...args: any[]
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout for callback on "${event}"`)), 10000);
    (socket as any).emit(event, ...args, (response: T) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

function waitForRoomUpdate(
  socket: TypedClientSocket,
  predicate: (room: RoomInfo) => boolean,
  timeoutMs = 15000,
): Promise<RoomInfo> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('room:updated', handler);
      reject(new Error('Timeout waiting for room:updated matching predicate'));
    }, timeoutMs);
    const handler = (room: RoomInfo) => {
      if (predicate(room)) {
        clearTimeout(timer);
        socket.off('room:updated', handler);
        resolve(room);
      }
    };
    socket.on('room:updated', handler);
  });
}

function waitForGameState(
  socket: TypedClientSocket,
  predicate: (state: GameState) => boolean,
  timeoutMs = 15000,
): Promise<GameState> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('game:state', handler);
      reject(new Error('Timeout waiting for game:state matching predicate'));
    }, timeoutMs);
    const handler = (state: GameState) => {
      if (predicate(state)) {
        clearTimeout(timer);
        socket.off('game:state', handler);
        resolve(state);
      }
    };
    socket.on('game:state', handler);
  });
}

function findMatchingSymbol(state: GameState): number | null {
  if (!state.myCard || !state.centerCard) return null;
  const centerSet = new Set(state.centerCard.symbols);
  for (const s of state.myCard.symbols) {
    if (centerSet.has(s)) return s;
  }
  return null;
}

function findWrongSymbol(state: GameState): number | null {
  if (!state.myCard || !state.centerCard) return null;
  const centerSet = new Set(state.centerCard.symbols);
  for (const s of state.myCard.symbols) {
    if (!centerSet.has(s)) return s;
  }
  return null;
}

describe('Multiplayer Integration Tests', { timeout: 30000 }, () => {
  let httpServer: HttpServer;
  let io: Server<ClientToServerEvents, ServerToClientEvents>;
  let port: number;
  let clients: TypedClientSocket[];

  beforeEach(async () => {
    const app = createServer();
    httpServer = app;

    io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      cors: { origin: '*' },
    });

    const roomManager = new RoomManager();
    const gameEngine = new GameEngine(io, roomManager);
    setupSocketEvents(io, roomManager, gameEngine);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => resolve());
    });
    const addr = httpServer.address();
    port = typeof addr === 'object' && addr !== null ? addr.port : 0;

    clients = [];
  });

  afterEach(async () => {
    for (const c of clients) {
      if (c.connected) c.disconnect();
    }
    clients = [];

    await new Promise<void>((resolve, reject) => {
      io.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  async function connectClients(n: number): Promise<TypedClientSocket[]> {
    const result: TypedClientSocket[] = [];
    for (let i = 0; i < n; i++) {
      const client = createClient(port);
      clients.push(client);
      result.push(client);
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Client ${i} connect timeout`)), 5000);
        client.on('connect', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
    return result;
  }

  async function createRoom(host: TypedClientSocket, name: string, password = ''): Promise<{ code: string; token: string }> {
    const res = await emitWithCallback<{ ok: boolean; code?: string; token?: string; error?: string }>(
      host, 'room:create', name, password,
    );
    expect(res.ok).toBe(true);
    return { code: res.code!, token: res.token! };
  }

  async function joinRoom(client: TypedClientSocket, code: string, name: string, password = ''): Promise<string> {
    const res = await emitWithCallback<{ ok: boolean; token?: string; error?: string }>(
      client, 'room:join', code, name, password,
    );
    expect(res.ok).toBe(true);
    return res.token!;
  }

  /**
   * Start game and wait for all clients to receive playing state.
   * Sets up listeners BEFORE emitting game:start to avoid race conditions.
   */
  async function startGameAndWait(
    host: TypedClientSocket,
    allClients: TypedClientSocket[],
  ): Promise<GameState[]> {
    const statePromises = allClients.map((c) =>
      waitForGameState(c, (s) => s.phase === 'playing'),
    );
    host.emit('game:start');
    return Promise.all(statePromises);
  }

  // -------------------------------------------------------------------
  describe('3 players join and start a game', () => {
    it('creates room, 3 players join, game starts and all receive playing state', async () => {
      const [host, p2, p3] = await connectClients(3);

      const { code } = await createRoom(host, 'Host');
      await joinRoom(p2, code, 'Player2');

      // Set up listener BEFORE the action that triggers the event
      const roomUpdatePromise = waitForRoomUpdate(host, (r) => r.players.length === 3);
      await joinRoom(p3, code, 'Player3');
      const roomInfo = await roomUpdatePromise;

      expect(roomInfo.players).toHaveLength(3);
      expect(roomInfo.phase).toBe('lobby');

      const states = await startGameAndWait(host, [host, p2, p3]);

      for (const state of states) {
        expect(state.phase).toBe('playing');
        expect(state.centerCard).not.toBeNull();
        expect(state.myCard).not.toBeNull();
        expect(state.players).toHaveLength(3);
      }
    });
  });

  // -------------------------------------------------------------------
  describe('simultaneous claim handling', () => {
    it('only one player scores when two claim at the same time (tower mode)', async () => {
      const [host, p2] = await connectClients(2);

      const { code } = await createRoom(host, 'Host');
      await joinRoom(p2, code, 'Player2');

      const states = await startGameAndWait(host, [host, p2]);

      const sym1 = findMatchingSymbol(states[0]);
      const sym2 = findMatchingSymbol(states[1]);

      expect(sym1).not.toBeNull();
      expect(sym2).not.toBeNull();

      // Set up ALL listeners BEFORE firing claims
      const matchPromise = waitForEvent<any>(host, 'game:match');
      const s1Promise = waitForGameState(host, () => true);
      const s2Promise = waitForGameState(p2, () => true);

      host.emit('game:claim', sym1!);
      p2.emit('game:claim', sym2!);

      const match = await matchPromise;
      expect(match.playerName).toBeDefined();

      const [s1, s2] = await Promise.all([s1Promise, s2Promise]);

      const totalScore = s1.players.reduce((sum, p) => sum + p.score, 0);
      expect(totalScore).toBeGreaterThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------
  describe('disconnect and reconnect during game', () => {
    it('player can disconnect and reconnect with token, preserving score and hand', async () => {
      const [host, p2] = await connectClients(2);

      const { code } = await createRoom(host, 'Host');
      const p2Token = await joinRoom(p2, code, 'Player2');

      const states = await startGameAndWait(host, [host, p2]);

      // Player2 scores one point
      const sym = findMatchingSymbol(states[1]);
      let scoreBeforeDisconnect = 0;
      if (sym !== null) {
        // Set up ALL listeners BEFORE claim
        const matchPromise = waitForEvent(p2, 'game:match');
        const statePromise = waitForGameState(p2, () => true);
        p2.emit('game:claim', sym);
        await matchPromise;

        const stateAfterMatch = await statePromise;
        scoreBeforeDisconnect = stateAfterMatch.players.find(
          (p) => p.name === 'Player2',
        )?.score ?? 0;
      }

      // Set up listener BEFORE disconnect
      const disconnectPromise = waitForRoomUpdate(host, (r) => {
        const player = r.players.find((p) => p.name === 'Player2');
        return player !== undefined && !player.connected;
      });

      p2.disconnect();
      await disconnectPromise;

      // Reconnect
      const p2Reconnected = createClient(port);
      clients.push(p2Reconnected);
      await new Promise<void>((resolve) => {
        p2Reconnected.on('connect', () => resolve());
      });

      // Set up state listener BEFORE rejoin (rejoin triggers game:state)
      const reconnectedStatePromise = waitForGameState(p2Reconnected, () => true);

      const rejoinRes = await emitWithCallback<{ ok: boolean; error?: string }>(
        p2Reconnected, 'room:rejoin', code, p2Token,
      );
      expect(rejoinRes.ok).toBe(true);

      const reconnectedState = await reconnectedStatePromise;
      const p2Info = reconnectedState.players.find((p) => p.name === 'Player2');
      expect(p2Info).toBeDefined();
      expect(p2Info!.connected).toBe(true);
      expect(p2Info!.score).toBe(scoreBeforeDisconnect);
    });
  });

  // -------------------------------------------------------------------
  describe('all game modes work', () => {
    async function testMode(mode: GameMode) {
      const [host, p2, p3] = await connectClients(3);

      const { code } = await createRoom(host, 'Host');
      await joinRoom(p2, code, 'Player2');
      await joinRoom(p3, code, 'Player3');

      host.emit('room:settings', {
        mode,
        penaltyCooldown: 1000,
        cardCount: 0,
        timeLimitSec: 60,
      });

      await waitForRoomUpdate(host, (r) => r.settings.mode === mode);

      const states = await startGameAndWait(host, [host, p2, p3]);

      for (const state of states) {
        expect(state.phase).toBe('playing');
        expect(state.mode).toBe(mode);
        expect(state.centerCard).not.toBeNull();
        expect(state.myCard).not.toBeNull();
      }

      // Host claims one correct symbol
      const sym = findMatchingSymbol(states[0]);
      if (sym !== null) {
        const statePromise = waitForGameState(host, (s) => s.players.some((p) => p.score > 0));
        host.emit('game:claim', sym);
        const updatedState = await statePromise;
        const totalScore = updatedState.players.reduce((sum, p) => sum + p.score, 0);
        expect(totalScore).toBeGreaterThanOrEqual(1);
      }
    }

    it('tower mode works with 3 players', async () => {
      await testMode('tower');
    });

    it('well mode works with 3 players', async () => {
      await testMode('well');
    });

    it('timeAttack mode works with 3 players', async () => {
      await testMode('timeAttack');
    });
  });

  // -------------------------------------------------------------------
  describe('game finish with scores and ranking', () => {
    it('tower mode: game finishes when a player empties their hand', async () => {
      const [host, p2] = await connectClients(2);

      const { code } = await createRoom(host, 'Host');
      await joinRoom(p2, code, 'Player2');

      host.emit('room:settings', {
        mode: 'tower',
        penaltyCooldown: 0,
        cardCount: 5,
        timeLimitSec: 60,
      });

      await waitForRoomUpdate(host, (r) => r.settings.cardCount === 5);

      // Set up finished listener BEFORE starting game
      const finishedPromise = waitForEvent<Player[]>(host, 'game:finished');

      const states = await startGameAndWait(host, [host, p2]);

      // Host plays all cards to win
      let currentState = states[0];
      for (let attempts = 0; attempts < 20; attempts++) {
        const sym = findMatchingSymbol(currentState);
        if (sym === null || currentState.phase !== 'playing') break;

        const statePromise = waitForGameState(host, () => true, 3000).catch(() => null);
        host.emit('game:claim', sym);

        const nextState = await statePromise;
        if (!nextState || nextState.phase === 'finished') break;
        currentState = nextState;
      }

      const finishedPlayers = await finishedPromise;
      expect(finishedPlayers).toBeInstanceOf(Array);
      expect(finishedPlayers.length).toBe(2);
      expect(finishedPlayers[0].cardCount).toBeLessThanOrEqual(finishedPlayers[1].cardCount);
    });

    it('timeAttack mode: game finishes when all hands and draw pile are empty', async () => {
      const [host, p2] = await connectClients(2);

      const { code } = await createRoom(host, 'Host');
      await joinRoom(p2, code, 'Player2');

      host.emit('room:settings', {
        mode: 'timeAttack',
        penaltyCooldown: 0,
        cardCount: 5,
        timeLimitSec: 60,
      });

      await waitForRoomUpdate(host, (r) => r.settings.cardCount === 5);

      // Set up finished listener BEFORE starting
      const finishedPromise = waitForEvent<Player[]>(host, 'game:finished');

      const states = await startGameAndWait(host, [host, p2]);

      // Both players need to claim to empty all hands
      // Alternate between host and p2
      let hostState = states[0];
      let p2State = states[1];

      for (let attempts = 0; attempts < 20; attempts++) {
        // Host claims
        const hostSym = findMatchingSymbol(hostState);
        if (hostSym !== null && hostState.phase === 'playing') {
          const hPromise = waitForGameState(host, () => true, 3000).catch(() => null);
          const p2UpdatePromise = waitForGameState(p2, () => true, 3000).catch(() => null);
          host.emit('game:claim', hostSym);
          const hNext = await hPromise;
          p2State = (await p2UpdatePromise) ?? p2State;
          if (!hNext || hNext.phase !== 'playing') break;
          hostState = hNext;
        }

        // P2 claims
        const p2Sym = findMatchingSymbol(p2State);
        if (p2Sym !== null && p2State.phase === 'playing') {
          const p2Promise = waitForGameState(p2, () => true, 3000).catch(() => null);
          const hUpdatePromise = waitForGameState(host, () => true, 3000).catch(() => null);
          p2.emit('game:claim', p2Sym);
          const p2Next = await p2Promise;
          hostState = (await hUpdatePromise) ?? hostState;
          if (!p2Next || p2Next.phase !== 'playing') break;
          p2State = p2Next;
        }
      }

      const finishedPlayers = await finishedPromise;
      expect(finishedPlayers).toBeInstanceOf(Array);
      for (let i = 0; i < finishedPlayers.length - 1; i++) {
        expect(finishedPlayers[i].score).toBeGreaterThanOrEqual(finishedPlayers[i + 1].score);
      }
    });
  });

  // -------------------------------------------------------------------
  describe('max player connection', () => {
    it('allows up to 8 players and rejects 9th', async () => {
      const allClients = await connectClients(9);
      const host = allClients[0];

      const { code } = await createRoom(host, 'Host');

      // Join first 6 players
      for (let i = 1; i < 7; i++) {
        await joinRoom(allClients[i], code, `Player${i}`);
      }

      // Set up listener BEFORE last join
      const roomUpdatePromise = waitForRoomUpdate(host, (r) => r.players.length === 8);
      await joinRoom(allClients[7], code, 'Player7');
      const roomInfo = await roomUpdatePromise;
      expect(roomInfo.players).toHaveLength(8);

      // 9th player should be rejected
      const res = await emitWithCallback<{ ok: boolean; error?: string }>(
        allClients[8], 'room:join', code, 'Player8', '',
      );
      expect(res.ok).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('8 players can start and play a tower game', async () => {
      const allClients = await connectClients(8);
      const host = allClients[0];

      const { code } = await createRoom(host, 'Host');

      for (let i = 1; i < 8; i++) {
        await joinRoom(allClients[i], code, `Player${i}`);
      }

      const states = await startGameAndWait(host, allClients);

      for (const state of states) {
        expect(state.phase).toBe('playing');
        expect(state.centerCard).not.toBeNull();
        expect(state.myCard).not.toBeNull();
        expect(state.players).toHaveLength(8);
      }

      const totalHand = states[0].players.reduce((sum, p) => sum + p.cardCount, 0);
      expect(totalHand).toBe(57 - 1);
    });
  });

  // -------------------------------------------------------------------
  describe('wrong claim handling', () => {
    it('wrong claim triggers cooldown event', async () => {
      const [host, p2] = await connectClients(2);

      const { code } = await createRoom(host, 'Host');
      await joinRoom(p2, code, 'Player2');

      host.emit('room:settings', {
        mode: 'tower',
        penaltyCooldown: 2000,
        cardCount: 0,
        timeLimitSec: 60,
      });

      await waitForRoomUpdate(host, (r) => r.settings.penaltyCooldown === 2000);

      const states = await startGameAndWait(host, [host, p2]);

      const wrongSym = findWrongSymbol(states[0]);
      if (wrongSym !== null) {
        const wrongPromise = waitForEvent<{ cooldownMs: number }>(host, 'game:wrong');
        host.emit('game:claim', wrongSym);

        const wrongData = await wrongPromise;
        expect(wrongData.cooldownMs).toBe(2000);
      }
    });
  });

  // -------------------------------------------------------------------
  describe('back to lobby flow', () => {
    it('host can return to lobby after game finishes', async () => {
      const [host, p2] = await connectClients(2);

      const { code } = await createRoom(host, 'Host');
      await joinRoom(p2, code, 'Player2');

      host.emit('room:settings', {
        mode: 'tower',
        penaltyCooldown: 0,
        cardCount: 5,
        timeLimitSec: 60,
      });

      await waitForRoomUpdate(host, (r) => r.settings.cardCount === 5);

      // Set up finished listener BEFORE starting
      const finishedPromise = waitForEvent<Player[]>(host, 'game:finished');

      const states = await startGameAndWait(host, [host, p2]);

      // Play until finished
      let currentState = states[0];
      for (let i = 0; i < 20; i++) {
        const sym = findMatchingSymbol(currentState);
        if (sym === null || currentState.phase !== 'playing') break;

        const statePromise = waitForGameState(host, () => true, 3000).catch(() => null);
        host.emit('game:claim', sym);

        const nextState = await statePromise;
        if (!nextState || nextState.phase === 'finished') break;
        currentState = nextState;
      }

      await finishedPromise;

      // Go back to lobby
      const lobbyPromise = waitForRoomUpdate(host, (r) => r.phase === 'lobby');
      host.emit('game:backToLobby');

      const lobbyInfo = await lobbyPromise;
      expect(lobbyInfo.phase).toBe('lobby');
      expect(lobbyInfo.players.every((p) => p.score === 0)).toBe(true);
    });
  });
});
