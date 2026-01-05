const mongoose = require("mongoose");

const DataBundleSchema = new mongoose.Schema(
  {
    network: {
      type: String,
      enum: ["mtn", "telecel", "airteltigo"],
      required: true
    },
    packageName: {
      type: String,
      required: true
    },
    dataAmount: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    description: String,
    category: {
      type: String,
      enum: ["sme", "corporate", "social", "regular"],
      default: "regular"
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DataBundle", DataBundleSchema);