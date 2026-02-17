const express = require("express");
const Activity = require("../models/activity");
const { userAuth } = require("../middlewares/auth");
const activityRouter = express.Router();

activityRouter.get("/activity/:boardId", userAuth, async (req, res) => {
  try {
    const activities = await Activity.find({
      boardId: req.params.boardId
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.send(activities);

  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = {activityRouter};


