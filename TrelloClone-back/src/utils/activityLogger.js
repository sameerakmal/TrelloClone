const Activity = require("../models/activity");

const logActivity = async ({ boardId, userId, action, taskId, listId }) => {
  try {
    const activity = await Activity.create({
      boardId,
      userId,
      action,
      taskId,
      listId
    });

    return await Activity.findById(activity._id).populate("userId", "name email");
  } catch (err) {
    console.error("Activity log error:", err.message);
    return null;
  }
};

module.exports = logActivity;
