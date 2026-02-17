const mongoose = require("mongoose");

const listSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true
    },

    order: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("List", listSchema);
