"use strict";
// console.log("Hi");
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
// here we need to implement the rooms
// we are going to store rooms as a Map where
// key ->  will be room name
// value -> will be a set of websocket clients connected to our WS server
const rooms = new Map();
// event handling on server level when a socket connects to this ws(web server)
wss.on("connection", function (socket) {
    let currentRoom = ""; //storing which room this socket belongs to
    socket.on("message", (message) => {
        var _a;
        let data;
        try {
            data = JSON.parse(message.toString());
        }
        catch (e) {
            console.error("Failed to parse message or message is not JSON", message.toString());
            return;
        }
        if (data.type === "join_room") {
            const roomName = data.room;
            // if room doesn't already exist add it to the rooms map
            if (!rooms.has(roomName)) {
                rooms.set(roomName, new Set());
            }
            // Add this client to the room's set of websockets
            (_a = rooms.get(roomName)) === null || _a === void 0 ? void 0 : _a.add(socket);
            currentRoom = roomName;
            socket.send(JSON.stringify({
                type: "system",
                sender: "System",
                message: `You successfully joined room: ${roomName}`,
            }));
            console.log(`User joined room ${roomName}`);
        }
        else if (data.type === "chat_message") {
            if (currentRoom && rooms.has(currentRoom)) {
                // get all the clients (websockets) present in that room
                const clientsInRoom = rooms.get(currentRoom);
                // send (share) messages only among themselves
                clientsInRoom === null || clientsInRoom === void 0 ? void 0 : clientsInRoom.forEach((client) => {
                    if (client !== socket && client.readyState === ws_1.WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "chat",
                            sender: "Another user",
                            message: data.message,
                        }));
                    }
                });
            }
        }
    });
    // whenever a user disconnects
    socket.on("close", () => {
        var _a;
        console.log("A user disconnected");
        if (currentRoom && rooms.has(currentRoom)) {
            (_a = rooms.get(currentRoom)) === null || _a === void 0 ? void 0 : _a.delete(socket);
            console.log(`User left room: ${currentRoom}`);
        }
    });
});
