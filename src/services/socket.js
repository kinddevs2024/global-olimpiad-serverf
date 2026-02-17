import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { getToken } from '../utils/helpers';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token: getToken(),
      },
      transports: ['polling', 'websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  if (!socket) {
    return connectSocket();
  }
  return socket;
};

export default {
  connectSocket,
  disconnectSocket,
  getSocket
};

