import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomManager } from '../room.js';

// Socket mock
function createMockSocket(id: string) {
  return {
    id,
    join: vi.fn(),
  } as any;
}

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = new RoomManager();
  });

  describe('createRoom', () => {
    it('creates a room with correct initial state', () => {
      const socket = createMockSocket('socket-1');
      const room = manager.createRoom(socket, 'Player1');

      expect(room.code).toHaveLength(4);
      expect(room.phase).toBe('lobby');
      expect(room.mode).toBe('tower');
      expect(room.players.size).toBe(1);
      expect(room.hostId).toBe('socket-1');
      expect(room.centerCard).toBeNull();
      expect(room.drawPile).toEqual([]);
      expect(room.countdownTimer).toBeNull();
      expect(room.timeAttackTimer).toBeNull();
      expect(room.finishedAt).toBe(0);
    });

    it('host player has correct properties', () => {
      const socket = createMockSocket('socket-1');
      const room = manager.createRoom(socket, 'Host');
      const player = room.players.get('socket-1');

      expect(player).toBeDefined();
      expect(player!.name).toBe('Host');
      expect(player!.isHost).toBe(true);
      expect(player!.connected).toBe(true);
      expect(player!.score).toBe(0);
      expect(player!.hand).toEqual([]);
    });

    it('socket joins the room code', () => {
      const socket = createMockSocket('socket-1');
      const room = manager.createRoom(socket, 'Player1');
      expect(socket.join).toHaveBeenCalledWith(room.code);
    });

    it('generates unique room codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const socket = createMockSocket(`socket-${i}`);
        const room = manager.createRoom(socket, `Player${i}`);
        codes.add(room.code);
      }
      expect(codes.size).toBe(20);
    });
  });

  describe('joinRoom', () => {
    it('joins an existing room', () => {
      const host = createMockSocket('host');
      const room = manager.createRoom(host, 'Host');

      const joiner = createMockSocket('joiner');
      const result = manager.joinRoom(joiner, room.code, 'Joiner');

      expect(result.ok).toBe(true);
      expect(room.players.size).toBe(2);
    });

    it('rejects invalid room code', () => {
      const result = manager.joinRoom(createMockSocket('s1'), 'ZZZZ', 'Name');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('見つかりません');
    });

    it('rejects join during non-lobby phase', () => {
      const host = createMockSocket('host');
      const room = manager.createRoom(host, 'Host');
      room.phase = 'playing';

      const result = manager.joinRoom(createMockSocket('s1'), room.code, 'Late');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('開始されています');
    });

    it('rejects duplicate player name', () => {
      const host = createMockSocket('host');
      const room = manager.createRoom(host, 'Same');

      const result = manager.joinRoom(createMockSocket('s1'), room.code, 'Same');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('使われています');
    });

    it('rejects when room is full (8 players)', () => {
      const host = createMockSocket('host');
      const room = manager.createRoom(host, 'Host');

      for (let i = 1; i < 8; i++) {
        manager.joinRoom(createMockSocket(`s${i}`), room.code, `P${i}`);
      }
      expect(room.players.size).toBe(8);

      const result = manager.joinRoom(createMockSocket('extra'), room.code, 'Extra');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('満員');
    });

    it('is case-insensitive for room code', () => {
      const host = createMockSocket('host');
      const room = manager.createRoom(host, 'Host');

      const result = manager.joinRoom(
        createMockSocket('joiner'),
        room.code.toLowerCase(),
        'Joiner'
      );
      expect(result.ok).toBe(true);
    });
  });

  describe('leaveRoom', () => {
    it('removes player from room', () => {
      const host = createMockSocket('host');
      const room = manager.createRoom(host, 'Host');
      const joiner = createMockSocket('joiner');
      manager.joinRoom(joiner, room.code, 'Joiner');

      const result = manager.leaveRoom('joiner');
      expect(result).not.toBeNull();
      expect(result!.leftPlayer.name).toBe('Joiner');
      expect(room.players.size).toBe(1);
    });

    it('deletes room when last player leaves', () => {
      const host = createMockSocket('host');
      const room = manager.createRoom(host, 'Host');

      manager.leaveRoom('host');
      expect(manager.getRoom(room.code)).toBeUndefined();
    });

    it('promotes next player to host when host leaves', () => {
      const host = createMockSocket('host');
      const room = manager.createRoom(host, 'Host');
      const joiner = createMockSocket('joiner');
      manager.joinRoom(joiner, room.code, 'Joiner');

      manager.leaveRoom('host');
      const newHost = room.players.get('joiner');
      expect(newHost!.isHost).toBe(true);
      expect(room.hostId).toBe('joiner');
    });

    it('clears timers when room is emptied', () => {
      const host = createMockSocket('host');
      const room = manager.createRoom(host, 'Host');

      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      room.countdownTimer = setInterval(() => {}, 1000);
      room.timeAttackTimer = setTimeout(() => {}, 1000);

      manager.leaveRoom('host');

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });

    it('returns null for unknown socket', () => {
      expect(manager.leaveRoom('unknown')).toBeNull();
    });
  });

  describe('backToLobby', () => {
    it('resets room state to lobby', () => {
      const host = createMockSocket('host');
      const room = manager.createRoom(host, 'Host');

      room.phase = 'finished';
      room.centerCard = { id: 0, symbols: [0, 1, 2] };
      room.startedAt = Date.now();
      room.totalCards = 57;
      room.clearedCards = 10;
      room.finishedAt = Date.now();

      const player = room.players.get('host')!;
      player.score = 5;
      player.hand = [{ id: 1, symbols: [3, 4, 5] }];

      manager.backToLobby(room);

      expect(room.phase).toBe('lobby');
      expect(room.centerCard).toBeNull();
      expect(room.drawPile).toEqual([]);
      expect(room.startedAt).toBe(0);
      expect(room.totalCards).toBe(0);
      expect(room.clearedCards).toBe(0);
      expect(room.finishedAt).toBe(0);
      expect(player.score).toBe(0);
      expect(player.hand).toEqual([]);
    });
  });

  describe('getRoomBySocketId', () => {
    it('finds room by socket id', () => {
      const socket = createMockSocket('socket-1');
      const room = manager.createRoom(socket, 'Player');

      expect(manager.getRoomBySocketId('socket-1')).toBe(room);
    });

    it('returns undefined for unknown socket', () => {
      expect(manager.getRoomBySocketId('unknown')).toBeUndefined();
    });
  });

  describe('getRoomInfo', () => {
    it('returns client-safe room info', () => {
      const socket = createMockSocket('host');
      const room = manager.createRoom(socket, 'Host');

      const info = manager.getRoomInfo(room);

      expect(info.code).toBe(room.code);
      expect(info.phase).toBe('lobby');
      expect(info.players).toHaveLength(1);
      expect(info.players[0].name).toBe('Host');
      expect(info.players[0].isHost).toBe(true);
      // Should not expose server-only fields
      expect((info.players[0] as any).hand).toBeUndefined();
      expect((info.players[0] as any).socketId).toBeUndefined();
      expect((info.players[0] as any).cooldownUntil).toBeUndefined();
    });
  });

  describe('cleanupInactiveRooms', () => {
    it('removes rooms past timeout', () => {
      const socket = createMockSocket('host');
      const room = manager.createRoom(socket, 'Host');

      // Set lastActivity to 31 minutes ago
      room.lastActivity = Date.now() - 31 * 60 * 1000;

      const count = manager.cleanupInactiveRooms();
      expect(count).toBe(1);
      expect(manager.getRoom(room.code)).toBeUndefined();
    });

    it('keeps active rooms', () => {
      const socket = createMockSocket('host');
      const room = manager.createRoom(socket, 'Host');

      const count = manager.cleanupInactiveRooms();
      expect(count).toBe(0);
      expect(manager.getRoom(room.code)).toBeDefined();
    });
  });
});
