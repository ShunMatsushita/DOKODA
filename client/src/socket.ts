import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from 'dokoda-shared';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('/', {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});
