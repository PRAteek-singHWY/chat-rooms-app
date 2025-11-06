"use strict";
// console.log("Hi");
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
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
const wss = new ws_1.WebSocketServer({ port: 8080 });
// here we need to implement the rooms
// we are going to store rooms as a Map where
// key ->  will be room name
// value -> will be a set of websocket clients connected to our WS server
const rooms = new Map();
// tracking each socket's username and current room
const SocketInfo = new Map();
// event handling on server level when a socket connects to this ws(web server)
wss.on("connection", function (socket) {
    let currentRoom = ""; //storing which room this socket belongs to
    let userName = ""; //storing which user joined
    socket.on("message", (message) => {
        var _a, _b, _c;
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
            userName = data.user;
            const color = getRandomColor();
            // if room doesn't already exist add it to the rooms map
            if (!rooms.has(roomName)) {
                rooms.set(roomName, new Set());
            }
            // Add this client to the room's set of websockets
            (_a = rooms.get(roomName)) === null || _a === void 0 ? void 0 : _a.add(socket);
            SocketInfo.set(socket, { user: userName, room: roomName, color });
            currentRoom = roomName;
            socket.send(JSON.stringify({
                type: "system",
                sender: "System",
                message: `You successfully joined room: ${roomName}`,
            }));
            const clientsInRoom = rooms.get(currentRoom);
            // send (share) messages only among themselves
            clientsInRoom === null || clientsInRoom === void 0 ? void 0 : clientsInRoom.forEach((client) => {
                if (client !== socket && client.readyState === ws_1.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "system",
                        sender: "System",
                        message: `${userName} joined the room.`,
                    }));
                }
            });
            console.log(`${userName} joined room ${roomName}`);
        }
        else if (data.type === "chat_message") {
            const infor = SocketInfo.get(socket); //getting username and room details
            if (!infor)
                return;
            const { color } = infor;
            if (currentRoom && rooms.has(currentRoom)) {
                // get all the clients (websockets) present in that room
                const clientsInRoom = rooms.get(currentRoom);
                // send (share) messages only among themselves
                clientsInRoom === null || clientsInRoom === void 0 ? void 0 : clientsInRoom.forEach((client) => {
                    if (client.readyState === ws_1.WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "chat",
                            sender: client === socket ? "You" : `${userName}`,
                            color: color,
                            message: data.message,
                        }));
                    }
                });
            }
        }
        else {
            const info = SocketInfo.get(socket); //fecth socket's informatipon
            if (!info)
                return;
            const { user, room, color } = info;
            (_b = rooms.get(room)) === null || _b === void 0 ? void 0 : _b.delete(socket); //delete this specific client
            // updating SocketInfo
            SocketInfo.set(socket, { user, room: "", color: "" });
            // braodcasting the leaving of this client
            (_c = rooms.get(room)) === null || _c === void 0 ? void 0 : _c.forEach((client) => {
                if (client.readyState === ws_1.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "system",
                        sender: "System",
                        message: `${user} left the room`,
                    }));
                }
            });
        }
    });
    // whenever a user disconnects
    socket.on("close", () => {
        const info = SocketInfo.get(socket); //getting username and room details
        if (!info)
            return;
        const { user, room } = info;
        const roomClients = rooms.get(room); //gets all sockets in this room
        roomClients === null || roomClients === void 0 ? void 0 : roomClients.delete(socket); //delete thsi specific socket from te given array of scoekts in this room
        // Notifyig others taht user left]
        roomClients === null || roomClients === void 0 ? void 0 : roomClients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "system",
                    sender: "System",
                    message: `${user} left the room`,
                }));
            }
        });
        console.log(`${user} disconnected from ${room}`);
        SocketInfo.delete(socket);
    });
});
