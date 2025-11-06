// console.log("Hi");

import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

// event handling on server level when a socket connects to this ws(web server)
wss.on("connection", function (socket) {
  console.log("A user connected");

  socket.on("message", (message) => {
    console.log(`Received: ${message}`);

    // here instead of just sending the message back to socket
    // we are iteratig over all the connected clients and sharind message with all of them
    wss.clients.forEach((client) => {
      if (client !== socket && client.readyState === socket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  // whenever a user disconnects
  socket.on("close", () => {
    console.log("A user disconnected");
  });
});
