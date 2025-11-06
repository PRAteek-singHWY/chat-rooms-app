import { useEffect, useState } from "react";
import "./App.css";

interface ChatMessage {
  type: "chat" | "system";
  sender?: string; //"Another user" || "You" || "System"
  message: string;
}

const App = () => {
  //  <WebSocket | null>  --->  generics
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [chatMessage, setChatMessage] = useState<string>("");

  // stores array of messages of type ChatMessage
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [roomName, setRoomName] = useState<string>("");
  const [isInRoom, setIsInRoom] = useState<boolean>(false);

  // affter clicking the join room button
  const handleJoinRoom = () => {
    if (!socket || roomName.trim() === "") {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "join_room",
        room: roomName,
      })
    );
  };

  // after clicking the send button o screen
  const handleSendMessage = () => {
    if (!socket || chatMessage.trim() === "") {
      return;
    }
    socket.send(JSON.stringify({ type: "chat_message", message: chatMessage }));

    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "chat", sender: "You", message: chatMessage },
    ]);

    setChatMessage("");
    // sending message
  };

  useEffect(() => {
    // establishing(initiating) a connection with ws server
    const ws = new WebSocket("ws://localhost:8080");
    setSocket(ws);
    ws.onmessage = (event) => {
      // the server sends json so we parse it
      const data = JSON.parse(event.data);
      console.log(`Received data: ${data}`);

      if (data.type === "system") {
        // this here is backend telling us
        // message: `You successfully joined room: ${roomName}`,

        // here data is being given to setMessages becuase we already created a interface for it
        setMessages((prevMessages) => [...prevMessages, data]);
        // now change state to true that in room is true
        setIsInRoom(true);
      } else if (data.type === "chat") {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    };

    // clean up function
    return () => {
      ws.close();
    };
  }, []);

  // if user comes in for teh first time (not yet in any room)
  if (!isInRoom) {
    return (
      <div>
        <h2>Join a Chat Room</h2>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter room name..."
        />
        <button onClick={handleJoinRoom}>Join</button>
      </div>
    );
  }

  // user is inside a room and chatting
  return (
    <div>
      <h3>Room: {roomName}</h3>
      {/* message display area */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          height: "300px",
          overflowY: "scroll",
          marginBottom: "10px",
        }}
      >
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender || msg.type}:</strong> {msg.message}
          </div>
        ))}
      </div>
      {/* messasge input */}

      <input
        type="text"
        value={chatMessage}
        onChange={(e) => setChatMessage(e.target.value)}
        placeholder="Message"
      />

      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
};

export default App;

