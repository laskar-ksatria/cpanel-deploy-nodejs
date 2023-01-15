const express = require("express");
const cors = require("cors");
const http = require("http");
const Socket = require("socket.io");

//Custom multer
const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage").GridFsStorage;
//Custom multer

require("colors");
require("dotenv").config();

const myServer = async () => {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT || 4000;
  try {
    //DBName
    const mongoURI = "mongodb://localhost:27017/node-file-upl";

    // DB connection
    const conn = await mongoose.createConnection(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // init gfs
    let gfs;
    conn.once("open", () => {
      // init stream
      gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: "uploads",
      });
    });

    // Storage
    const storage = new GridFsStorage({
      url: mongoURI,
      file: (req, file) => {
        return new Promise((resolve, reject) => {
          crypto.randomBytes(16, (err, buf) => {
            if (err) {
              return reject(err);
            }
            const filename =
              buf.toString("hex") + path.extname(file.originalname);
            const fileInfo = {
              filename: filename,
              bucketName: "uploads",
            };
            console.log(fileInfo);
            resolve(fileInfo);
          });
        });
      },
    });

    const upload = multer({
      storage,
    });

    //  const storage = new GridFsStorage({ url: mongoURI });

    //Socket IO
    let Io = Socket(server, { cors: { origin: "*", credential: true } });
    app.use(
      cors({
        origin: "*",
      })
    );
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.get("/", (req, res, next) => {
      res.send("Server running correctly");
    });

    app.get("/image/:filename", (req, res) => {
      // console.log('id', req.params.id)
      const file = gfs
        .find({
          filename: req.params.filename,
        })
        .toArray((err, files) => {
          if (!files || files.length === 0) {
            return res.status(404).json({
              err: "no files exist",
            });
          }
          console.log(files);
          // res.send("OKE");
          gfs.openDownloadStreamByName(req.params.filename).pipe(res);
        });
    });

    app.post("/upload", upload.single("file"), (req, res) => {
      res.status(200).json({ message: "Upload success" });
    });

    server.listen(PORT, () =>
      console.log(`Server Started on ${PORT}`.cyan.bold)
    );

    Io.on("connection", (socket) => {
      console.log("Io connected");
      socket.on(`disconnect`, (reason) => {
        console.log("Io disconnected");
      });
    });
  } catch (error) {
    console.log(error);
  }
};

myServer();

//Admin1234567&^%$#@!

//HhdZ8Ox9MUGOt2G78FVvZ2YXR92o4-IQMjFzKxZX
