const express = require("express");
const List = require("../models/list");
const Board = require("../models/board");
const { userAuth } = require("../middlewares/auth");
const logActivity = require("../utils/activityLogger");
const { getIO } = require("../socket");

const listRouter = express.Router();

listRouter.post("/list/create", userAuth, async(req, res) => {
    try{
        const {title, boardId, order} = req.body;

        const board = await Board.findById(boardId);

        if(!board){
            return res.status(404).send("Board not found!!");
        }

        if(!board.members.includes(req.user._id)){
            return res.status(403).send("Not authorized!");
        }

        const list = new List({
            title,
            boardId,
            order
        });

        const savedList = await list.save();

        const activity = await logActivity({
            boardId: board._id,
            userId: req.user._id,
            action: `${req.user.name} created list "${title}"`,
            listId: savedList._id
        });

        if (activity) {
            getIO().to(board._id.toString()).emit("activityAdded", activity);
        }

        res.send({
            message: "List created successfully",
            data: savedList
            });

    } catch (err) {
        res.status(400).send("Error creating list: " + err.message);
    }
});

listRouter.get("/lists/:boardId", userAuth, async (req, res) => {
  try {
    const lists = await List.find({
      boardId: req.params.boardId
    }).sort({ order: 1 });

    res.send(lists);

  } catch (err) {
    res.status(400).send("Error fetching lists: " + err.message);
  }
});

listRouter.patch("/list/edit/:id", userAuth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    const oldTitle = list.title;

    const updatedList = await List.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    const board = await Board.findById(updatedList.boardId);

    const activity = await logActivity({
      boardId: board._id,
      userId: req.user._id,
      action: `${req.user.name} renamed list "${oldTitle}" to "${updatedList.title}"`,
      listId: updatedList._id
    });

    if (activity) {
      getIO().to(board._id.toString()).emit("activityAdded", activity);
    }

    res.send(updatedList);

  } catch (err) {
    res.status(400).send("Error updating list: " + err.message);
  }
});

listRouter.delete("/list/del/:id", userAuth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    const board = await Board.findById(list.boardId);

    await List.findByIdAndDelete(req.params.id);

    const activity = await logActivity({
      boardId: board._id,
      userId: req.user._id,
      action: `${req.user.name} deleted list "${list.title}"`
    });

    if (activity) {
      getIO().to(board._id.toString()).emit("activityAdded", activity);
    }

    res.send("List deleted successfully");

  } catch (err) {
    res.status(400).send("Error deleting list: " + err.message);
  }
});

module.exports = {listRouter};