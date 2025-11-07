"use strict";
// console.log("Hi");
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const redis_1 = require("redis");
// --- REDIS SETUP ---
// We create two clients. A client in "subscriber" mode can't
// be used for other commands (like publishing).
const publisher = (0, redis_1.createClient)();
const subscriber = publisher.duplicate();
publisher.on("error", (err) => console.error(`Redis Publisher Error`, err));
subscriber.on("error", (err) => console.error(`Reddis Subscriber Error`, err));
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
// const wss = new WebSocketServer({ port: 8080 });
const port = parseInt(process.env.PORT || "8080");
const wss = new ws_1.WebSocketServer({ port: port });
// here we need to implement the rooms
// we are going to store rooms as a Map where
// key ->  will be room name
// value -> will be a set of websocket clients connected to our WS server
const rooms = new Map();
// tracking each socket's username and current room
const SocketInfo = new Map();
// Keeps record that Server is subscribed to What all rooms of Reddis
const subscribedRooms = new Set();
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Connect both reddis clients
    yield publisher.connect();
    yield subscriber.connect();
    // This is the handler when messages income from Reddis
    const handleRedisMessage = (message, channel) => {
        var _a;
        console.log(`Received message from reddis on channel ${channel}`);
        const clientsInChannel = rooms.get(channel);
        if (!clientsInChannel) {
            return; //if no clients in channel/room
        }
        // send message to all the local clients on that channel
        (_a = rooms.get(channel)) === null || _a === void 0 ? void 0 : _a.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message); //this message is JSON string
            }
        });
    };
    wss.on("connection", (socket) => {
        console.log("A user connected (local)");
        socket.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            let data;
            try {
                data = JSON.parse(message.toString());
            }
            catch (e) {
                console.error(`Failed to parse message ${message.toString()}`);
                return;
            }
            const info = SocketInfo.get(socket);
            if (data.type === "join_room") {
                const { room: roomName, user: userName } = data;
                const color = getRandomColor();
                // add room to rooms map if not already existing
                if (!rooms.has(roomName)) {
                    // added element with key room name and value as Set of sockets which join this room
                    rooms.set(roomName, new Set());
                }
                // add socket to the room
                (_a = rooms.get(roomName)) === null || _a === void 0 ? void 0 : _a.add(socket);
                // add info for socket teh color username and room
                SocketInfo.set(socket, { room: roomName, user: userName, color });
                // subscribe to Redis Channel (if not already)
                if (!subscribedRooms.has(roomName)) {
                    // Use the permanent subscriber client to listen
                    yield subscriber.subscribe(roomName, handleRedisMessage);
                    subscribedRooms.add(roomName);
                    console.log(`Subscribed to Redis channel: ${roomName}`);
                }
                // send "you joined" message only to this user
                socket.send(JSON.stringify({
                    type: "system",
                    sender: "System",
                    message: `You successfully joined room: ${roomName} `,
                }));
                // publishing to a room in redis the message that a user joined (this room is the one that our server has in it's subscribed rooms )
                const joinMessage = JSON.stringify({
                    type: "system",
                    sender: "System",
                    message: `${userName} joined the room`,
                });
                // What this does: Server A sends the "Hi!" message TO REDIS. It does NOT send it to any of its own clients.
                yield publisher.publish(roomName, joinMessage);
            }
            else if (data.type === "chat_message") {
                if (!info)
                    return;
                const { user: userName, room: currentRoom, color } = info;
                const chatMessage = JSON.stringify({
                    type: "chat",
                    sender: userName,
                    color: color,
                    message: data.message,
                });
                // Publishing this packet to the Redis channel
                //    (This replaces our old clientsInRoom.forEach loop)
                //What this does: Server A sends the "Hi!" message TO REDIS. It does NOT send it to any of its own clients.
                yield publisher.publish(currentRoom, chatMessage);
            }
            else if (data.type === "leave_room") {
                if (!info)
                    return;
                const { user, room } = info;
                const leaveMessage = JSON.stringify({
                    type: "system",
                    sender: "System",
                    message: `${user} left the room`,
                });
                // (This replaces our old clientsInRoom.forEach loop)
                yield publisher.publish(room, leaveMessage);
                // cleaning up local maps
                (_b = rooms.get(room)) === null || _b === void 0 ? void 0 : _b.delete(socket);
                SocketInfo.set(socket, { room: "", user, color: "" });
                // if recently deleted user was the last client then we unsubscribe the server from redis channel
                if (((_c = rooms.get(room)) === null || _c === void 0 ? void 0 : _c.size) === 0) {
                    yield subscriber.unsubscribe(room);
                    subscribedRooms.delete(room);
                    console.log(`Unsubscribed from redis channel: ${room} `);
                }
            }
        }));
        // Handle user disconnect (browser close)
        socket.on("close", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const info = SocketInfo.get(socket);
            if (!info || !info.room) {
                console.log("A user disconnected (was not in a room)");
                return; // Not in a room
            }
            const { user, room } = info;
            // pubish user left to reddis
            const leaveMessage = JSON.stringify({
                type: "system",
                sender: "System",
                message: `${user} left the room`,
            });
            // (This replaces our old clientsInRoom.forEach loop)
            yield publisher.publish(room, leaveMessage);
            // cleaning up local maps
            (_a = rooms.get(room)) === null || _a === void 0 ? void 0 : _a.delete(socket);
            SocketInfo.set(socket, { room: "", user, color: "" });
            // if recently deleted user was the last client then we unsubscribe the server from redis channel
            if (((_b = rooms.get(room)) === null || _b === void 0 ? void 0 : _b.size) === 0) {
                yield subscriber.unsubscribe(room);
                subscribedRooms.delete(room);
                console.log(`Unsubscribed from redis channel: ${room} `);
            }
            console.log(`${user} disconnected from ${room}`);
        }));
    });
    console.log(`WebSocket server started on port ${port}`);
    console.log("Redis clients connected.");
}))();
// // event handling on server level when a socket connects to this ws(web server)
// wss.on("connection", function (socket) {
//   let currentRoom = ""; //storing which room this socket belongs to
//   let userName = ""; //storing which user joined
//   socket.on("message", (message) => {
//     let data;
//     try {
//       data = JSON.parse(message.toString());
//     } catch (e) {
//       console.error(
//         "Failed to parse message or message is not JSON",
//         message.toString()
//       );
//       return;
//     }
//     if (data.type === "join_room") {
//       const roomName = data.room;
//       userName = data.user;
//       const color = getRandomColor();
//       // if room doesn't already exist add it to the rooms map
//       if (!rooms.has(roomName)) {
//         rooms.set(roomName, new Set());
//       }
//       // Add this client to the room's set of websockets
//       rooms.get(roomName)?.add(socket);
//       SocketInfo.set(socket, { user: userName, room: roomName, color });
//       currentRoom = roomName;
//       socket.send(
//         JSON.stringify({
//           type: "system",
//           sender: "System",
//           message: `You successfully joined room: ${roomName}`,
//         })
//       );
//       const clientsInRoom = rooms.get(currentRoom);
//       // send (share) messages only among themselves
//       clientsInRoom?.forEach((client) => {
//         if (client !== socket && client.readyState === WebSocket.OPEN) {
//           client.send(
//             JSON.stringify({
//               type: "system",
//               sender: "System",
//               message: `${userName} joined the room.`,
//             })
//           );
//         }
//       });
//       console.log(`${userName} joined room ${roomName}`);
//     } else if (data.type === "chat_message") {
//       const infor = SocketInfo.get(socket); //getting username and room details
//       if (!infor) return;
//       const { color } = infor;
//       if (currentRoom && rooms.has(currentRoom)) {
//         // get all the clients (websockets) present in that room
//         const clientsInRoom = rooms.get(currentRoom);
//         // send (share) messages only among themselves
//         clientsInRoom?.forEach((client) => {
//           if (client.readyState === WebSocket.OPEN) {
//             client.send(
//               JSON.stringify({
//                 type: "chat",
//                 sender: client === socket ? "You" : `${userName}`,
//                 color: color,
//                 message: data.message,
//               })
//             );
//           }
//         });
//       }
//     } else {
//       //leave_room
//       const info = SocketInfo.get(socket); //fecth socket's informatipon
//       if (!info) return;
//       const { user, room, color } = info;
//       rooms.get(room)?.delete(socket); //delete this specific client
//       // updating SocketInfo
//       SocketInfo.set(socket, { user, room: "", color: "" });
//       // braodcasting the leaving of this client
//       rooms.get(room)?.forEach((client) => {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(
//             JSON.stringify({
//               type: "system",
//               sender: "System",
//               message: `${user} left the room`,
//             })
//           );
//         }
//       });
//     }
//   });
//   // whenever a user disconnects
//   socket.on("close", () => {
//     const info = SocketInfo.get(socket); //getting username and room details
//     if (!info) return;
//     const { user, room } = info;
//     const roomClients = rooms.get(room); //gets all sockets in this room
//     roomClients?.delete(socket); //delete thsi specific socket from te given array of scoekts in this room
//     // Notifyig others taht user left]
//     roomClients?.forEach((client) => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(
//           JSON.stringify({
//             type: "system",
//             sender: "System",
//             message: `${user} left the room`,
//           })
//         );
//       }
//     });
//     console.log(`${user} disconnected from ${room}`);
//     SocketInfo.delete(socket);
//   });
// });
