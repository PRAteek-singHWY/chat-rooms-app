// console.log("Hi");

import { WebSocket, WebSocketServer } from "ws";

// random color generator
function getRandomColor() {
  const colors = [
    "#FF6B6B",
    "#FFD93D",
    "#6BCB77",
    "#4D96FF",
    "#9B5DE5",
    "#FF8C00",
    "#00C9A7",
    "#FF4D6D",
    "#4ECDC4",
    "#F9C74F",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

const wss = new WebSocketServer({ port: 8080 });

// here we need to implement the rooms
// we are going to store rooms as a Map where
// key ->  will be room name
// value -> will be a set of websocket clients connected to our WS server

const rooms = new Map<string, Set<WebSocket>>();

// tracking each socket's username and current room
const SocketInfo = new Map<
  WebSocket,
  { user: string; room: string; color: string }
>();

// event handling on server level when a socket connects to this ws(web server)
wss.on("connection", function (socket) {
  let currentRoom = ""; //storing which room this socket belongs to
  let userName = ""; //storing which user joined

  socket.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      console.error(
        "Failed to parse message or message is not JSON",
        message.toString()
      );
      return;
    }

    if (data.type === "join_room") {
      const roomName = data.room;
      userName = data.user;
      const color = getRandomColor();

      // if room doesn't already exist add it to the rooms map
      if (!rooms.has(roomName)) {
        rooms.set(roomName, new Set());
      }

      // Add this client to the room's set of websockets
      rooms.get(roomName)?.add(socket);
      SocketInfo.set(socket, { user: userName, room: roomName, color });
      currentRoom = roomName;
      socket.send(
        JSON.stringify({
          type: "system",
          sender: "System",
          message: `You successfully joined room: ${roomName}`,
        })
      );

      const clientsInRoom = rooms.get(currentRoom);

      // send (share) messages only among themselves
      clientsInRoom?.forEach((client) => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "system",
              sender: "System",
              message: `${userName} joined the room.`,
            })
          );
        }
      });
      console.log(`${userName} joined room ${roomName}`);
    } else if (data.type === "chat_message") {
      const infor = SocketInfo.get(socket); //getting username and room details
      if (!infor) return;
      const { color } = infor;

      if (currentRoom && rooms.has(currentRoom)) {
        // get all the clients (websockets) present in that room
        const clientsInRoom = rooms.get(currentRoom);

        // send (share) messages only among themselves
        clientsInRoom?.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "chat",
                sender: client === socket ? "You" : `${userName}`,
                color: color,
                message: data.message,
              })
            );
          }
        });
      }
    } else {
      //leave_room
      const info = SocketInfo.get(socket); //fecth socket's informatipon
      if (!info) return;
      const { user, room, color } = info;
      rooms.get(room)?.delete(socket); //delete this specific client
      // updating SocketInfo
      SocketInfo.set(socket, { user, room: "", color: "" });
      // braodcasting the leaving of this client
      rooms.get(room)?.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "system",
              sender: "System",
              message: `${user} left the room`,
            })
          );
        }
      });
    }
  });

  // whenever a user disconnects
  socket.on("close", () => {
    const info = SocketInfo.get(socket); //getting username and room details
    if (!info) return;
    const { user, room } = info;

    const roomClients = rooms.get(room); //gets all sockets in this room
    roomClients?.delete(socket); //delete thsi specific socket from te given array of scoekts in this room

    // Notifyig others taht user left]
    roomClients?.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "system",
            sender: "System",
            message: `${user} left the room`,
          })
        );
      }
    });
    console.log(`${user} disconnected from ${room}`);
    SocketInfo.delete(socket);
  });
});
