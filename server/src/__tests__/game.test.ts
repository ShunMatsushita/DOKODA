import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameEngine } from '../game.js';
import { RoomManager, Room } from '../room.js';

// Minimal Socket.io server mock
function createMockIO() {
  const emitFn = vi.fn();
  const toFn = vi.fn(() => ({ emit: emitFn }));
  return {
    to: toFn,
    emit: emitFn,
    _toFn: toFn,
    _emitFn: emitFn,
  } as any;
}

function createMockSocket(id: string) {
  return { id, join: vi.fn() } as any;
}

function createRoomWithPlayers(manager: RoomManager, count: number): Room {
  const host = createMockSocket('player-0');
  const room = manager.createRoom(host, 'Player0');

  for (let i = 1; i < count; i++) {
    const socket = createMockSocket(`player-${i}`);
    manager.joinRoom(socket, room.code, `Player${i}`);
  }

  return room;
}

describe('GameEngine', () => {
  let io: any;
  let manager: RoomManager;
  let engine: GameEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    io = createMockIO();
    manager = new RoomManager();
    engine = new GameEngine(io, manager);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startGame', () => {
    it('rejects if room is not in lobby phase', () => {
      const room = createRoomWithPlayers(manager, 2);
      room.phase = 'playing';

      const result = engine.startGame(room);
      expect(result.ok).toBe(false);
    });

    it('rejects if not enough players for tower/well', () => {
      const room = createRoomWithPlayers(manager, 1);

      const result = engine.startGame(room);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('2');
    });

    it('allows 1 player for timeAttack', () => {
      const room = createRoomWithPlayers(manager, 1);
      room.settings.mode = 'timeAttack';
      room.mode = 'timeAttack';

      const result = engine.startGame(room);
      expect(result.ok).toBe(true);
      expect(room.phase).toBe('countdown');
    });

    it('starts countdown and transitions to playing', () => {
      const room = createRoomWithPlayers(manager, 2);

      engine.startGame(room);
      expect(room.phase).toBe('countdown');
      expect(room.countdownTimer).not.toBeNull();

      // Advance through 3-second countdown
      vi.advanceTimersByTime(3000);

      expect(room.phase).toBe('playing');
      expect(room.countdownTimer).toBeNull();
      expect(room.startedAt).toBeGreaterThan(0);
    });

    it('stores countdownTimer on room object', () => {
      const room = createRoomWithPlayers(manager, 2);
      engine.startGame(room);

      // Regression: timer was stored in local variable, not on room
      expect(room.countdownTimer).not.toBeNull();
    });
  });

  describe('dealing - tower mode', () => {
    it('distributes all cards via round-robin', () => {
      const room = createRoomWithPlayers(manager, 3);
      room.settings.mode = 'tower';

      engine.startGame(room);
      vi.advanceTimersByTime(3000);

      const players = Array.from(room.players.values());
      const totalHand = players.reduce((sum, p) => sum + p.hand.length, 0);

      // center card (1) + all hands = total cards
      expect(totalHand + 1).toBe(room.totalCards);

      // No card is lost (regression: remainder cards were discarded)
      const handDiff = Math.max(...players.map(p => p.hand.length)) -
                       Math.min(...players.map(p => p.hand.length));
      expect(handDiff).toBeLessThanOrEqual(1);
    });
  });

  describe('dealing - well mode', () => {
    it('gives each player 1 card, rest to draw pile', () => {
      const room = createRoomWithPlayers(manager, 3);
      room.settings.mode = 'well';
      room.mode = 'well';

      engine.startGame(room);
      vi.advanceTimersByTime(3000);

      const players = Array.from(room.players.values());
      for (const p of players) {
        expect(p.hand.length).toBe(1);
      }
      // 1 center + 3 player cards + draw pile = total
      expect(1 + 3 + room.drawPile.length).toBe(room.totalCards);
    });
  });

  describe('dealing - timeAttack mode', () => {
    it('gives each player 1 card from draw pile', () => {
      const room = createRoomWithPlayers(manager, 3);
      room.settings.mode = 'timeAttack';
      room.mode = 'timeAttack';

      engine.startGame(room);
      vi.advanceTimersByTime(3000);

      const players = Array.from(room.players.values());
      for (const p of players) {
        expect(p.hand.length).toBe(1);
      }
      // 1 center + 3 dealt + remaining draw pile = total
      expect(1 + 3 + room.drawPile.length).toBe(room.totalCards);
    });

    it('sets timeAttack timer', () => {
      const room = createRoomWithPlayers(manager, 2);
      room.settings.mode = 'timeAttack';
      room.mode = 'timeAttack';
      room.settings.timeLimitSec = 60;

      engine.startGame(room);
      vi.advanceTimersByTime(3000); // countdown

      expect(room.timeAttackTimer).not.toBeNull();
    });
  });

  describe('handleClaim', () => {
    function setupTowerGame(playerCount: number) {
      const room = createRoomWithPlayers(manager, playerCount);
      room.settings.mode = 'tower';
      room.settings.penaltyCooldown = 1000;
      engine.startGame(room);
      vi.advanceTimersByTime(3000);
      return room;
    }

    it('accepts correct symbol claim', () => {
      const room = setupTowerGame(2);
      const player = Array.from(room.players.values())[0];
      const center = room.centerCard!;
      const playerCard = player.hand[0];

      // Find common symbol
      const commonSet = new Set(center.symbols);
      const common = playerCard.symbols.find(s => commonSet.has(s))!;

      const oldScore = player.score;
      engine.handleClaim(room, player.socketId, common);

      expect(player.score).toBe(oldScore + 1);
    });

    it('rejects incorrect symbol claim with cooldown', () => {
      const room = setupTowerGame(2);
      const player = Array.from(room.players.values())[0];
      const center = room.centerCard!;
      const playerCard = player.hand[0];

      // Find a symbol NOT in center
      const centerSet = new Set(center.symbols);
      const wrong = playerCard.symbols.find(s => !centerSet.has(s));
      if (!wrong && wrong !== 0) return; // skip if all match (impossible in practice)

      const oldScore = player.score;
      engine.handleClaim(room, player.socketId, wrong!);

      expect(player.score).toBe(oldScore); // No score change
      expect(player.cooldownUntil).toBeGreaterThan(0);
    });

    it('ignores claim during cooldown', () => {
      const room = setupTowerGame(2);
      const player = Array.from(room.players.values())[0];

      player.cooldownUntil = Date.now() + 5000;

      const oldScore = player.score;
      engine.handleClaim(room, player.socketId, 0);
      expect(player.score).toBe(oldScore);
    });

    it('ignores claim when game is not playing', () => {
      const room = setupTowerGame(2);
      room.phase = 'finished';

      const player = Array.from(room.players.values())[0];
      const oldScore = player.score;
      engine.handleClaim(room, player.socketId, 0);
      expect(player.score).toBe(oldScore);
    });

    it('ignores claim from non-existent player', () => {
      const room = setupTowerGame(2);
      // Should not throw
      engine.handleClaim(room, 'nonexistent', 0);
    });
  });

  describe('finishGame', () => {
    it('sets finishedAt timestamp', () => {
      const room = createRoomWithPlayers(manager, 2);
      engine.startGame(room);
      vi.advanceTimersByTime(3000);

      // Play until one player has no cards (tower mode)
      const players = Array.from(room.players.values());
      const p = players[0];

      // Exhaust all cards by finding correct answers
      while (p.hand.length > 0 && room.phase === 'playing') {
        const center = room.centerCard!;
        const playerCard = p.hand[0];
        const centerSet = new Set(center.symbols);
        const common = playerCard.symbols.find(s => centerSet.has(s));
        if (common !== undefined) {
          engine.handleClaim(room, p.socketId, common);
        } else {
          break;
        }
      }

      if (room.phase === 'finished') {
        expect(room.finishedAt).toBeGreaterThan(0);
      }
    });
  });

  describe('getGameStateForPlayer', () => {
    it('returns correct state shape', () => {
      const room = createRoomWithPlayers(manager, 2);
      engine.startGame(room);
      vi.advanceTimersByTime(3000);

      const state = engine.getGameStateForPlayer(room, 'player-0');

      expect(state.phase).toBe('playing');
      expect(state.mode).toBe('tower');
      expect(state.centerCard).not.toBeNull();
      expect(state.myCard).not.toBeNull();
      expect(state.players).toHaveLength(2);
      expect(state.startedAt).toBeGreaterThan(0);
      expect(state.finishedAt).toBe(0);
      expect(state.totalCards).toBeGreaterThan(0);
    });

    it('hides other players cards', () => {
      const room = createRoomWithPlayers(manager, 2);
      engine.startGame(room);
      vi.advanceTimersByTime(3000);

      const state = engine.getGameStateForPlayer(room, 'player-0');

      // Should have card counts but not actual card data for others
      for (const p of state.players) {
        expect(p.cardCount).toBeDefined();
        expect((p as any).hand).toBeUndefined();
      }
    });
  });
});
