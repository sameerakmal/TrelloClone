const express = require("express");
const Task = require("../models/task");
const Board = require("../models/board");
const List = require("../models/list");
const { userAuth } = require("../middlewares/auth");
const logActivity = require("../utils/activityLogger");
const { getIO } = require("../socket");

const taskRouter = express.Router();


taskRouter.post("/task/create", userAuth, async (req, res) => {
  try {
    const { title, description, listId, order } = req.body;

    const list = await List.findById(listId);
    if (!list) return res.status(404).send("List not found");

    const board = await Board.findById(list.boardId);
    if (!board.members.includes(req.user._id))
      return res.status(403).send("Not authorized");

    const task = new Task({
      title,
      description,
      listId,
      order,
      assignedUsers: [req.user._id]
    });

    const savedTask = await task.save();

    const io = getIO();
    console.log("Emitting taskCreated", {
      taskId: savedTask._id,
      listId,
      boardId: board._id,
      connectedSockets: io?.engine?.clientsCount
    });
    io.emit("taskCreated", savedTask);
    io.to(board._id.toString()).emit("taskCreated", savedTask);
    
    const activity = await logActivity({
      boardId: board._id,
      userId: req.user._id,
      action: `${req.user.name} created the task "${title}".`,
      taskId: savedTask._id
    });
    
    getIO().to(list.boardId).emit("activityAdded", activity);

    res.send({
      message: "Task created",
      data: savedTask
    });

  } catch (err) {
    res.status(400).send("Error creating task: " + err.message);
  }
});

taskRouter.get("/tasks/:listId", userAuth, async (req, res) => {
  try {
    const tasks = await Task.find({
      listId: req.params.listId
    })
    .populate("assignedUsers", "name email")
    .sort({ order: 1 });

    res.send(tasks);

  } catch (err) {
    res.status(400).send("Error fetching tasks: " + err.message);
  }
});

taskRouter.patch("/task/edit/:id", userAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    const oldTitle = task.title;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    const list = await List.findById(updatedTask.listId);
    const board = await Board.findById(list.boardId);

    let actionMessage = `${req.user.name} updated the task "${oldTitle}"`;
    if (req.body.title && req.body.title !== oldTitle) {
      actionMessage = `${req.user.name} renamed task "${oldTitle}" to "${req.body.title}"`;
    } else if (req.body.listId) {
      actionMessage = `${req.user.name} moved task "${oldTitle}" to another list`;
    }

    const activity = await logActivity({
      boardId: board._id,
      userId: req.user._id,
      action: actionMessage,
      taskId: updatedTask._id
    });

    if (activity) {
      getIO().to(board._id.toString()).emit("activityAdded", activity);
    }

    res.send(updatedTask);

  } catch (err) {
    res.status(400).send("Error updating task: " + err.message);
  }
});

taskRouter.delete("/task/del/:id", userAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    const list = await List.findById(task.listId);
    const board = await Board.findById(list.boardId);

    await Task.findByIdAndDelete(req.params.id);

    const activity = await logActivity({
      boardId: board._id,
      userId: req.user._id,
      action: `${req.user.name} deleted the task "${task.title}"`
    });

    if (activity) {
      getIO().to(board._id.toString()).emit("activityAdded", activity);
    }

    res.send("Task deleted successfully");

  } catch (err) {
    res.status(400).send("Error deleting task: " + err.message);
  }
});

taskRouter.patch("/task/:id/assign", userAuth, async (req, res) => {
  try {
    const { userId } = req.body;

    const task = await Task.findById(req.params.id);
    const list = await List.findById(task.listId);
    const board = await Board.findById(list.boardId);

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { assignedUsers: userId } },
      { new: true }
    ).populate("assignedUsers", "name email");

    const User = require("../models/user");
    const assignedUser = await User.findById(userId);

    const activity = await logActivity({
      boardId: board._id,
      userId: req.user._id,
      action: `${req.user.name} assigned "${assignedUser.name}" to task "${task.title}"`,
      taskId: task._id
    });

    if (activity) {
      getIO().to(board._id.toString()).emit("activityAdded", activity);
    }

    res.send(updatedTask);

  } catch (err) {
    res.status(400).send("Error assigning task: " + err.message);
  }
});

module.exports = {taskRouter};