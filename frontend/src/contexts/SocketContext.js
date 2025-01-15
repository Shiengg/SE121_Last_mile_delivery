import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import authService from '../services/authService';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user) {
            const newSocket = io('http://localhost:5000', {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('Connected to socket server');
                newSocket.emit('userConnected', user.id);
            });

            setSocket(newSocket);

            return () => newSocket.close();
        }
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext); 