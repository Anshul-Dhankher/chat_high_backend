import mongoose from "mongoose";

const messageSchema = mongoose.Schema({
  message: String,
  name: String,
  timeStamp: String,
  received: Boolean,
  roomID: String,
});

export default mongoose.model("messagecontents", messageSchema);
