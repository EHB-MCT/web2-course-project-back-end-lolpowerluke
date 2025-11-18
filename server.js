import express from "express";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Get
app.get("/user", (req, res) => {
  let ID = req.query.id
}) 

app.get("/distro", (req, res) => {
  let ID = req.query.id
}) 

app.get("/dewm", (req, res) => {
  let ID = req.query.id
}) 

app.get("/tests", (req, res) => {
  let ID = req.query.id
  let TYPE = req.query.type
}) 

app.get("/quiz", (req, res) => {
  let TYPE = req.query.type
}) 

// Post
app.post("/quiz", (req, res) => {
  let data = req.body;
}) 

app.post("/user", (req, res) => {
  let data = req.body;
}) 

// Update
app.put("/user", (req, res) => {
  let ID = req.query.id
  let data = req.body;
}) 

// Delete
app.delete("/user", (req, res) => {
  let ID = req.query.id
}) 

app.delete("/test", (req, res) => {
  let ID = req.query.id
}) 

// Listen
app.listen(port, () => {
  console.log(`Linux quiz backend listening on port ${port}`);
})