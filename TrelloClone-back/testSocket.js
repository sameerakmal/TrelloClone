const { io } = require("socket.io-client");

const socket = io("http://localhost:4000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTkzMjE3MTVjZjg4ZjM1YTVmYjJkNDAiLCJpYXQiOjE3NzEyNjgzMjUsImV4cCI6MTc3MTg3MzEyNX0.6UODpW-5_GUSiU3wEiu13JhSBBbC9-RobwwWezg2kDE"
  }
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("taskCreated", (data) => {
  console.log("Task event received:", data);
});

socket.on("connect_error", (err) => {
  console.log("Connection error:", err.message);
});
