import { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const socketInstance = connectSocket();
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setConnected(false);
      });

      return () => {
        disconnectSocket();
        setSocket(null);
        setConnected(false);
      };
    } else {
      disconnectSocket();
      setSocket(null);
      setConnected(false);
    }
  }, [isAuthenticated]);

  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    connected,
    emit,
    on,
    off
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

