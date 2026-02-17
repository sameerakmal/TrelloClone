const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    action: {
      type: String,
      required: true
    },

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task"
    },

    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Activity", activitySchema);
