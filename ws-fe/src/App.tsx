import { useEffect, useState } from "react";
import "./App.css";

interface ChatMessage {
  type: "chat" | "system";
  sender?: string; //"Another user" || "You" || "System"
  message: string;
  color: string;
}

const App = () => {
  //  <WebSocket | null>  --->  generics
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [chatMessage, setChatMessage] = useState<string>("");

  // stores array of messages of type ChatMessage
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [roomName, setRoomName] = useState<string>("");
  const [isInRoom, setIsInRoom] = useState<boolean>(false);

  const [userName, setUserName] = useState<string>("");
  // affter clicking the join room button
  const handleJoinRoom = () => {
    if (!socket || roomName.trim() === "" || userName.trim() === "") {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "join_room",
        room: roomName,
        user: userName,
      })
    );
  };

  // after clicking the send button o screen
  const handleSendMessage = () => {
    if (!socket || chatMessage.trim() === "") {
      return;
    }
    socket.send(JSON.stringify({ type: "chat_message", message: chatMessage }));

    setChatMessage("");
    // sending message
  };

  const handleLeaveRoom = () => {
    if (!socket) return;

    setIsInRoom(false);
    socket.send(JSON.stringify({ type: "leave_room" }));
    setMessages([]);
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
      // Main background, matching the dark purple theme
      <div className="flex items-center justify-center h-screen bg-[#1a103c] font-sans">
        {/* Mobile App Container */}
        <div className="flex flex-col justify-between w-full max-w-sm h-[85vh] max-h-[740px] p-7 bg-[#2f265c] rounded-[40px] shadow-2xl overflow-hidden">
          {/* Top Content Area */}
          <div>
            {/* Header (like the back arrow and "Create Group" text) */}
            <div className="flex justify-center items-center mb-10">
              <span className="text-lg font-medium text-white">
                Create Room
              </span>
            </div>

            {/* Main Title */}
            <h2 className="text-4xl font-bold text-white mb-8 leading-tight">
              Create or Join
              <br />a Chat Room
            </h2>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="roomName"
                  className="block text-sm font-medium text-green-400 mb-1"
                >
                  Room Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter a room name..."
                  className="w-full px-4 py-3 text-white bg-[#4a417c] border-none rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c66ff]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 text-green-400">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 text-white bg-[#4a417c] border-none rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c66ff]"
                />
              </div>
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoinRoom}
            className="w-full px-4 py-4 text-lg font-bold text-[#2f265c] bg-white rounded-full shadow-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#2f265c] transition-colors duration-200"
          >
            Join
          </button>
        </div>
      </div>
    );
  }

  // user is inside a room and chatting
  return (
    <div className="flex items-center justify-center h-screen bg-[#1a103c] font-sans">
      <div className="flex flex-col w-full max-w-sm h-[85vh] max-h-[740px] p-7 bg-[#2f265c] rounded-[40px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            Room: <span className="font-bold text-green-400">{roomName}</span>
          </h3>

          <button
            type="button"
            onClick={handleLeaveRoom} // use your leave handler here
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-full shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#2f265c] transition"
          >
            Leave Room
          </button>
        </div>

        {/* Message Display Area */}
        <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-1">
          {messages.map((msg, index) => (
            <div key={index}>
              {/* System Message */}
              {msg.type === "system" ? (
                <div className="text-center">
                  <span className="px-3 py-1 text-xs text-gray-200 bg-[#4a417c] rounded-full">
                    {msg.message}
                  </span>
                </div>
              ) : msg.sender === "You" ? (
                <div className="flex justify-end">
                  <div className="max-w-[80%] px-4 py-2 text-white bg-[#7c66ff] rounded-2xl rounded-br-none shadow">
                    <p className="whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start max-w-[80%]">
                  {/* Username (colored label fixed at the top, independent of bubble width) */}
                  <span
                    className="mb-1 text-xs font-semibold"
                    style={{ color: msg.color || "#FFFFFF" }}
                  >
                    {msg.sender}
                  </span>

                  {/* Message bubble */}
                  <div className="px-4 py-2 text-white bg-[#4a417c] rounded-2xl rounded-bl-none shadow">
                    <p className="whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Message Input Area */}
        <div className="flex space-x-3">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 text-white bg-[#4a417c] border-none rounded-full placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c66ff]"
          />
          <button
            onClick={handleSendMessage}
            className="px-6 py-3 font-bold text-[#2f265c] bg-white rounded-full shadow-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#2f265c] transition-colors duration-200"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
