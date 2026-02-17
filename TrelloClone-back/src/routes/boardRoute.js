const express = require("express");
const boardRouter = express.Router();
const Board = require("../models/board");
const { userAuth } = require("../middlewares/auth");
const logActivity = require("../utils/activityLogger");
const { getIO } = require("../socket");


boardRouter.post("/board/create", userAuth, async (req, res) => {
  try {
    const { title, description } = req.body;

    const board = new Board({
      title,
      description,
      owner: req.user._id,
      members: [req.user._id]
    });

    const savedBoard = await board.save();

    res.json({
      message: "Board created successfully",
      data: savedBoard
    });
  } catch (err) {
    res.status(400).send("Error creating board: " + err.message);
  }
});

boardRouter.get("/boards", userAuth, async (req, res) => {
  try {
    const boards = await Board.find({
      members: req.user._id
    });

    res.send(boards);
  } catch (err) {
    res.status(400).send("Error fetching boards: " + err.message);
  }
});

boardRouter.get("/board/:id", userAuth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate("members", "name email");

    if (!board) {
      return res.status(404).send("Board not found");
    }

    res.send(board);
  } catch (err) {
    res.status(400).send("Error fetching board: " + err.message);
  }
});

boardRouter.delete("/board/del/:id", userAuth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).send("Board not found");
    }

    if (!board.owner.equals(req.user._id)) {
      return res.status(403).send("Not authorized");
    }

    await board.deleteOne();

    res.send("Board deleted successfully");
  } catch (err) {
    res.status(400).send("Error deleting board: " + err.message);
  }
});

boardRouter.post("/board/:id/addMember", userAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const boardId = req.params.id;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).send("Board not found");
    }

    if (!board.owner.equals(req.user._id)) {
      return res.status(403).send("Only board owner can add members");
    }

    const User = require("../models/user");
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).send("User not found with this email");
    }

    if (board.members.includes(userToAdd._id)) {
      return res.status(400).send("User is already a member");
    }

    board.members.push(userToAdd._id);
    await board.save();

    const updatedBoard = await Board.findById(boardId)
      .populate("members", "name email");

    const activity = await logActivity({
      boardId: board._id,
      userId: req.user._id,
      action: `${req.user.name} added "${userToAdd.name}" to the board`
    });

    if (activity) {
      getIO().to(board._id.toString()).emit("activityAdded", activity);
    }

    res.send({
      message: "Member added successfully",
      board: updatedBoard
    });
  } catch (err) {
    res.status(400).send("Error adding member: " + err.message);
  }
});

boardRouter.delete("/board/:id/removeMember/:userId", userAuth, async (req, res) => {
  try {
    const { id: boardId, userId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).send("Board not found");
    }

    if (!board.owner.equals(req.user._id) && !req.user._id.equals(userId)) {
      return res.status(403).send("Not authorized");
    }

    if (board.owner.equals(userId)) {
      return res.status(400).send("Cannot remove board owner");
    }

    board.members = board.members.filter(m => !m.equals(userId));
    await board.save();

    const User = require("../models/user");
    const removedUser = await User.findById(userId);

    const activity = await logActivity({
      boardId: board._id,
      userId: req.user._id,
      action: `${req.user.name} removed "${removedUser.name}" from the board`
    });

    if (activity) {
      getIO().to(board._id.toString()).emit("activityAdded", activity);
    }

    const updatedBoard = await Board.findById(boardId)
      .populate("members", "name email");

    res.send({
      message: "Member removed successfully",
      board: updatedBoard
    });
  } catch (err) {
    res.status(400).send("Error removing member: " + err.message);
  }
});

module.exports = {boardRouter};