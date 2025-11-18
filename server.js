import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config()

let env = process.env;
let uri = `mongodb+srv://${env.database_login_name}:${env.database_password}@webii.44euncl.mongodb.net/?appName=WEBII`

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const database = client.db("project");

// Get
app.get("/api/user", (req, res) => {
  let ID = req.query.id
}) 

app.get("/api/distro", async (req, res) => {
  let findResult;
  let ID = req.query.id;
  const collection = database.collection("distros");
  findResult = await collection.findOne({id: parseInt(ID)});
  if (findResult != null) {
    res.status(200).json({
      "dewm": findResult,
    })
  } else {
    res.status(404).json({
      "message": `No distro found with id ${ID}`,
    })
  }
}) 

app.get("/api/dewm", async (req, res) => {
  let findResult;
  let ID = req.query.id;
  const collection = database.collection("dewm");
  findResult = await collection.findOne({id: parseInt(ID)});
  if (findResult != null) {
    res.status(200).json({
      "dewm": findResult,
    })
  } else {
    res.status(404).json({
      "message": `No DE/WM found with id ${ID}`,
    })
  }
}) 

app.get("/api/tests", (req, res) => {
  let ID = req.query.id
  let TYPE = req.query.type
}) 

app.get("/api/quiz", (req, res) => {
  let TYPE = req.query.type
}) 

// Post
app.post("/api/quiz", (req, res) => {
  let data = req.body;
}) 

app.post("/api/user", (req, res) => {
  let data = req.body;
}) 

// Update
app.put("/api/user", (req, res) => {
  let ID = req.query.id
  let data = req.body;
}) 

// Delete
app.delete("/api/user", (req, res) => {
  let ID = req.query.id
}) 

app.delete("/api/test", (req, res) => {
  let ID = req.query.id
}) 

// Listen
app.listen(port, () => {
  console.log(`Linux quiz backend listening on port ${port}`);
})