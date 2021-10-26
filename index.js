//imports
import express from "express";
import mongoose from "mongoose";
import Message from "./dbmessage.js";
import Room from "./dbrooms.js";
import Pusher from "pusher";
import cors from "cors";

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1285337",
  key: "908f2c6e588790ab9537",
  secret: "578bc0c30d5210f1dc9e",
  cluster: "ap2",
  useTLS: true,
});

//middlewares
app.use(express.json());

app.use(cors());

/*
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});
*/

//api routes
app.get("/", (req, res) => {
  res.send("<code>hello world</code>");
});

//getting room name
app.get("/getroomname", (req, res) => {
  const id = req.query.roomid;
  Room.findById(id, (err, data) => {
    console.log(data);
    if (err) res.status(500).send(err);
    else res.status(200).send(data);
  });
});

//get  room specific messages
app.get("/getroommessages", (req, res) => {
  const id = req.query.roomid;
  Message.find({ roomID: id }, (err, data) => {
    console.log(data);
    if (err) res.status(500).send(err);
    else res.status(200).send(data);
  });
});

//get all the messages
app.get("/messages/sync", (req, res) => {
  Message.find((err, data) => {
    if (err) res.status(500).send(err);
    else res.status(200).send(data);
  });
});

//post a message
app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Message.create(dbMessage, (err, data) => {
    if (err) res.status(500).send(err);
    else res.status(201).send(data);
  });
});

//get all room details
app.get("/rooms/sync", (req, res) => {
  Room.find((err, data) => {
    if (err) res.status(500).send(err);
    else res.status(200).send(data);
  });
});

//post a new room
app.post("/rooms/new", (req, res) => {
  const dbroom = req.body;

  Room.create(dbroom, (err, data) => {
    if (err) res.status(500).send(err);
    else res.status(201).send(data);
  });
});

// db config

const uri =
  "mongodb+srv://anshul:qudI2fqLonihSvUy@cluster0.nnbpb.mongodb.net/chat_high_db?retryWrites=true&w=majority";
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("connection succesful");
  const msgCollections = db.collection("messagecontents");
  const changeStream1 = msgCollections.watch();

  const roomsCollections = db.collection("rooms");
  const changeStream2 = roomsCollections.watch();

  changeStream1.on("change", (change) => {
    console.log(change);
    if (change.operationType == "insert") {
      const messageDetails = change.fullDocument;
      console.log(messageDetails);
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timeStamp: messageDetails.timeStamp,
        received: messageDetails.received,
        id: messageDetails._id,
        roomID: messageDetails.roomID,
      });
    } else {
      console.log("error triggering pusher");
    }
  });

  changeStream2.on("change", (change) => {
    console.log(change);
    if (change.operationType == "insert") {
      const roomsDetails = change.fullDocument;
      console.log(roomsDetails);
      pusher.trigger("rooms", "inserted", {
        name: roomsDetails.name,
        id: roomsDetails._id,
      });
    } else {
      console.log("error triggering pusher");
    }
  });
});

//listen
app.listen(port, (req, res) => {
  console.log("app listening on port", port);
});
