const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const addressSchema = mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  alternatePhone: {
    type: String,
    required: true,
  },
  landmark: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  fullName:{
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

addressSchema.plugin(timestamps);
module.exports = mongoose.model("Address", addressSchema);
