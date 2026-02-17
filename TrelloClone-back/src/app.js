require("dotenv").config(); 
const express = require("express");
const connectDB = require("./config/database");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { authRouter } = require("./routes/authRoute");
const { boardRouter } = require("./routes/boardRoute");
const { listRouter } = require("./routes/listRoute");
const { taskRouter } = require("./routes/taskRoute");
const { activityRouter } = require("./routes/activityRoute");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: "http://localhost:5173",
    credentials: true 
  }
});

const socketHandler = require("./socket");
socketHandler.setIO(io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinBoard", (boardId) => {
    socket.join(boardId);
    console.log(`Socket ${socket.id} joined board ${boardId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
app.use(express.json());
app.use(cookieParser());


app.use(cors({
  origin: [
    "http://localhost:5173"
  ],
  credentials: true
}));

app.use("/", authRouter);
app.use("/", boardRouter);
app.use("/", listRouter);
app.use("/", taskRouter);
app.use("/", activityRouter);

connectDB()
    .then(() => {
        console.log("Database connection established");
        server.listen(process.env.PORT, () => {
            console.log("Server is successfully listening to port no 4000");
        }); 
    })
    .catch((err) => {
       console.error("Database connection failed :", err.message); 
    })