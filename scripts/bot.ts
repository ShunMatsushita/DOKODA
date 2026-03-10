/**
 * Bot script for manual multiplayer testing.
 *
 * Usage:
 *   npx tsx scripts/bot.ts <serverUrl> <roomCode> [botCount=3] [claimIntervalMs=2000]
 *
 * Example:
 *   npx tsx scripts/bot.ts http://localhost:3001 ABCD 3 1500
 *
 * Each bot connects to the server, joins the specified room,
 * and randomly claims symbols at the given interval once the game starts.
 */

import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  GameState,
} from 'dokoda-shared';

type TypedClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const args = process.argv.slice(2);
const serverUrl = args[0];
const roomCode = args[1];
const botCount = parseInt(args[2] || '3', 10);
const claimIntervalMs = parseInt(args[3] || '2000', 10);

if (!serverUrl || !roomCode) {
  console.error('Usage: npx tsx scripts/bot.ts <serverUrl> <roomCode> [botCount] [claimIntervalMs]');
  console.error('Example: npx tsx scripts/bot.ts http://localhost:3001 ABCD 3 1500');
  process.exit(1);
}

console.log(`Connecting ${botCount} bots to ${serverUrl}, room ${roomCode}`);
console.log(`Claim interval: ${claimIntervalMs}ms`);

interface BotState {
  name: string;
  socket: TypedClientSocket;
  gameState: GameState | null;
  timer: ReturnType<typeof setInterval> | null;
}

const bots: BotState[] = [];

function findMatchingSymbol(state: GameState): number | null {
  if (!state.myCard || !state.centerCard) return null;
  const centerSet = new Set(state.centerCard.symbols);
  for (const s of state.myCard.symbols) {
    if (centerSet.has(s)) return s;
  }
  return null;
}

function createBot(index: number): Promise<BotState> {
  const name = `Bot${index + 1}`;
  const socket = io(serverUrl, {
    transports: ['websocket'],
    forceNew: true,
  }) as TypedClientSocket;

  const bot: BotState = { name, socket, gameState: null, timer: null };

  return new Promise((resolve, reject) => {
    const connectTimeout = setTimeout(() => {
      reject(new Error(`${name}: Connection timeout`));
    }, 10000);

    socket.on('connect', () => {
      clearTimeout(connectTimeout);
      console.log(`[${name}] Connected (${socket.id})`);

      // Join the room
      (socket as any).emit(
        'room:join',
        roomCode,
        name,
        '',
        (response: { ok: boolean; token?: string; error?: string }) => {
          if (response.ok) {
            console.log(`[${name}] Joined room ${roomCode}`);
            resolve(bot);
          } else {
            console.error(`[${name}] Failed to join: ${response.error}`);
            reject(new Error(`${name}: ${response.error}`));
          }
        },
      );
    });

    // Listen for game state updates
    socket.on('game:state', (state: GameState) => {
      bot.gameState = state;

      if (state.phase === 'playing' && !bot.timer) {
        console.log(`[${name}] Game started! Beginning claims...`);
        startClaiming(bot);
      }

      if (state.phase === 'finished') {
        console.log(`[${name}] Game finished!`);
        const me = state.players.find((p) => p.name === name);
        if (me) {
          console.log(`[${name}] Score: ${me.score}, Cards left: ${me.cardCount}`);
        }
        stopClaiming(bot);
      }
    });

    socket.on('game:match', (result) => {
      if (result.playerName === name) {
        console.log(`[${name}] Matched symbol ${result.symbolId}!`);
      }
    });

    socket.on('game:wrong', (data) => {
      console.log(`[${name}] Wrong! Cooldown: ${data.cooldownMs}ms`);
    });

    socket.on('game:finished', (players) => {
      console.log(`\n=== Game Results ===`);
      players.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - Score: ${p.score}, Cards: ${p.cardCount}`);
      });
      console.log(`==================\n`);
    });

    socket.on('disconnect', () => {
      console.log(`[${name}] Disconnected`);
      stopClaiming(bot);
    });

    socket.on('error' as any, (msg: string) => {
      console.error(`[${name}] Error: ${msg}`);
    });
  });
}

function startClaiming(bot: BotState): void {
  bot.timer = setInterval(() => {
    if (!bot.gameState || bot.gameState.phase !== 'playing') {
      stopClaiming(bot);
      return;
    }

    const sym = findMatchingSymbol(bot.gameState);
    if (sym !== null) {
      bot.socket.emit('game:claim', sym);
    } else {
      // If we can't find a match (shouldn't happen), try a random symbol from our card
      if (bot.gameState.myCard && bot.gameState.myCard.symbols.length > 0) {
        const randomIdx = Math.floor(Math.random() * bot.gameState.myCard.symbols.length);
        bot.socket.emit('game:claim', bot.gameState.myCard.symbols[randomIdx]);
      }
    }
  }, claimIntervalMs);
}

function stopClaiming(bot: BotState): void {
  if (bot.timer) {
    clearInterval(bot.timer);
    bot.timer = null;
  }
}

async function main() {
  try {
    for (let i = 0; i < botCount; i++) {
      const bot = await createBot(i);
      bots.push(bot);
    }

    console.log(`\nAll ${botCount} bots connected and in room ${roomCode}.`);
    console.log('Start the game from the host client. Bots will auto-play.');
    console.log('Press Ctrl+C to disconnect all bots.\n');
  } catch (err) {
    console.error('Failed to start bots:', err);
    cleanup();
    process.exit(1);
  }
}

function cleanup() {
  console.log('\nDisconnecting all bots...');
  for (const bot of bots) {
    stopClaiming(bot);
    if (bot.socket.connected) {
      bot.socket.disconnect();
    }
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

main();
