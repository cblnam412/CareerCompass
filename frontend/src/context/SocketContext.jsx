import { useEffect, useState, createContext, useContext } from "react";
import { useAuth } from "./AuthContext";
import { io } from "socket.io-client";
import API from "../API/API"; 

const SocketContext = createContext();

export function useSocket() {
  const socketCtx = useContext(SocketContext);
  if (!socketCtx)
    throw new Error("useSocket must be used inside SocketProvider!");
  return socketCtx;
}

export function SocketProvider({ children }) {
  const { accessToken, userID } = useAuth();
  
  // FIX: Use useState instead of useRef so the Context updates when socket connects
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set()); 

  useEffect(() => {
    // Wait for Auth to be ready
    if (!accessToken || !userID) {
      return;
    }

    console.log("Initializing socket for User:", userID);

    // 1. Initialize Socket
    const newSocket = io(API, {
      auth: { token: accessToken },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    // 2. Setup Event Listeners
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      newSocket.emit("user_online", userID);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    newSocket.on("user_status", ({ userId, status }) => {
        setOnlineUsers(prev => {
            const newSet = new Set(prev);
            if (status === 'online') newSet.add(userId);
            else newSet.delete(userId);
            return newSet;
        });
    });

    // 3. Save socket to state to trigger re-render for consumers
    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [accessToken, userID]);

  return (
    // Pass the state 'socket', not the ref
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}