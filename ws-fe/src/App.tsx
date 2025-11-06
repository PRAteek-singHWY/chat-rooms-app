import { useEffect, useState } from "react";
import "./App.css";
const App = () => {
  //  <WebSocket | null>  --->  generics
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);

  // after clicking the send button o screen
  const sendMessage = () => {
    if (!socket || message.trim() === "") {
      return;
    }
    socket.send(message);
    setMessages((prevMessages) => [...prevMessages, `You: ${message}`]);
    setMessage("");
    // sending message
  };

  useEffect(() => {
    // establishing(initiating) a connection with ws server
    const ws = new WebSocket("ws://localhost:8080");
    setSocket(ws);
    ws.onmessage = (event) => {
      console.log("Received: ", event.data);
      setMessages((prevMessages) => [
        ...prevMessages,
        `  Other: ${event.data}`,
      ]);
      // alert(event.data);
    };

    // clean up function
    return () => {
      ws.close();
    };
  }, []);

  return (
    <div>
      {/* message display area */}
      <div>
        <h3>Chat:</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message"
      ></input>
      <button onClick={sendMessage}>send</button>
    </div>
  );
};

export default App;
