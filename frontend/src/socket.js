
// WebSocket server URL (replace with your server's URL)
const serverURL = 'ws://monorail.proxy.rlwy.net:37692/ws';
// const serverURL = 'ws://localhost:8080/ws';

let socket;

export let localState = {
    thisPlayer: null,
    players: null,
    islands: null,
}

// Function to connect to the WebSocket server
export const connectToServer = () => {
  socket = new WebSocket(serverURL);
  socket.addEventListener('open', (event) => {
    // You can perform any additional actions upon successful connection here
  });

  socket.addEventListener('message', (event) => {
    localState = JSON.parse(event.data);
  });

  socket.addEventListener('close', (event) => {

    // You can handle reconnection logic here if necessary
  });

  socket.addEventListener('error', (event) => {

    // Handle WebSocket errors here
  });
}

// Function to send data to the WebSocket server
export const sendDataToServer = (data) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(data);
  } else {
    console.error('WebSocket connection is not open.');
  }
}
