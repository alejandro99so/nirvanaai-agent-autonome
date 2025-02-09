const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    totalMonth: {
      type: Number,
      required: true,
    },
    lastMonthUpdate: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Histories", HistorySchema);
