import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config()

let env = process.env;
let uri = `mongodb+srv://${env.database_login_name}:${env.database_password}@webii.44euncl.mongodb.net/?appName=WEBII`
let baseURL = "http://localhost:3000";

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
let user = app.get("/api/user", async (req, res) => {
  let findResult;
  let ID = req.query.id;
  if (ID == undefined) {
    res.status(422).json({
      "message": `No user ID found in request!`,
    })
  } else {
    const collection = database.collection("users");
    findResult = await collection.findOne({id: parseInt(ID)}, {projection: {_id: 0, password: 0}});
    if (findResult != null) {
      res.status(200).json(findResult)
    } else {
      res.status(404).json({
        "message": `No user found with id ${ID}`,
      })
    }
  }
}) 

app.get("/api/distro", async (req, res) => {
  let findResult;
  let ID = req.query.id;
  if (ID == undefined) {
    res.status(422).json({
      "message": `No distro ID found in request!`,
    })
  } else {
    const collection = database.collection("distros");
    findResult = await collection.findOne({id: parseInt(ID)}, {projection: {_id: 0}});
    if (findResult != null) {
      res.status(200).json(findResult)
    } else {
      res.status(404).json({
        "message": `No distro found with id ${ID}`,
      })
    }
  }
}) 

app.get("/api/dewm", async (req, res) => {
  let findResult;
  let ID = req.query.id;
  if (ID == undefined) {
    res.status(422).json({
      "message": `No DE/WM ID found in request!`,
    })
  } else {
    const collection = database.collection("dewm");
    findResult = await collection.findOne({id: parseInt(ID)}, {projection: {_id: 0}});
    if (findResult != null) {
      res.status(200).json(findResult)
    } else {
      res.status(404).json({
        "message": `No DE/WM found with id ${ID}`,
      })
    }
  }
}) 

app.get("/api/tests", async (req, res) => {
  let findResult;
  let ID = req.query.id;
  let TYPE = req.query.type;
  if (ID == undefined) {
    res.status(422).json({
      "message": `No user ID found in request!`,
    })
  } else if (TYPE == undefined) {
    res.status(422).json({
      "message": `No test type found in request!`,
    })
  } else if (TYPE.toLowerCase() != "dewm" && TYPE.toLowerCase() != "distro") {
    res.status(404).json({
      "message": `Given test type doesn't exist!`,
    })
  } else {
    const collection = database.collection("tests");
    let query = {user_id: parseInt(ID), type: TYPE.toLowerCase()}
    findResult = collection.find(query).project({_id: 0});
    if ((await collection.countDocuments(query)) === 0) {
      res.status(404).json({
        "message": `No tests found with user id ${ID} and type ${TYPE}`,
      })
    } else {
      let resultArray = [];
      for await (const item of findResult) {
        resultArray.push(item)
      }
      res.status(200).json(resultArray)
    }
  }
}) 

app.get("/api/quiz", async (req, res) => {
  let findResult;
  let NUMBER = req.query.number;
  let TYPE = req.query.type;
  if (NUMBER == undefined) {
    res.status(422).json({
      "message": `No question NUMBER found in request!`,
    })
  } else if (TYPE == undefined) {
    res.status(422).json({
      "message": `No test type found in request!`,
    })
  } else if (TYPE.toLowerCase() != "dewm" && TYPE.toLowerCase() != "distro") {
    res.status(404).json({
      "message": `Given test type doesn't exist!`,
    })
  } else {
    const collection = database.collection(TYPE.toLowerCase() + "_test");
    findResult = await collection.findOne({question_number: parseInt(NUMBER)}, {projection: {_id: 0}});
    if (findResult != null) {
      res.status(200).json(findResult)
    } else {
      res.status(404).json({
        "message": `No question found with number ${NUMBER}`,
      })
    }
  }
}) 

// Post
app.post("/api/quiz", async (req, res) => {
  let data = req.body
  
  if (data == undefined) {
    res.status(422).json({
      "message": `Body missing!`,
    })
  } else {
    let dataUserID = data.user_id;
    let dataTestType = data.type;
    let dataTestResult = data.result;
    let dataTestScores = data.top_scores;

    if (dataUserID == undefined || dataTestType == undefined || dataTestResult == undefined || dataTestScores == undefined) {
      res.status(422).json({
        "message": `Body incomplete!`,
      })
    } else {
      // Get relevant data and create object to be sent
      const testsCollection = database.collection("tests");
      let testsQueryTyped = {user_id: parseInt(dataUserID), type: dataTestType.toLowerCase()};
      let testsFindResultTyped = await testsCollection.findOne(testsQueryTyped, {sort: {user_test_id: -1}, projection: {_id: 0}});
      let testsFindResultTypeless = await testsCollection.findOne({}, {sort: {id: -1}, projection: {_id: 0}});
      let responseDataID;
      if (testsFindResultTypeless != null) {
        responseDataID = testsFindResultTypeless.id + 1;
      } else {
        responseDataID = 1;
      }
      let responseDataUserTestID;
      if (testsFindResultTyped != null) {
        responseDataUserTestID = testsFindResultTyped.user_test_id + 1;
      } else {
        responseDataUserTestID = 1;
      }
      let responseData = {
        id: responseDataID,
        user_test_id: responseDataUserTestID,
        user_id: dataUserID,
        type: dataTestType,
        result: dataTestResult,
        top_scores: dataTestScores
      }
      const result = await testsCollection.insertOne(responseData);
      console.log(
        `A document was inserted with the _id: ${result.insertedId}`,
      );
      // update test_amount for user
      const userFetch = await fetch(baseURL + "/api/user?id=" + dataUserID);
      const userData = await userFetch.json();

      res.status(200).json(responseData)
    }
  }
}) 

app.post("/api/user", async (req, res) => {
  let data = req.body;
}) 

// Update
app.put("/api/user", async (req, res) => {
  let ID = req.query.id
  let data = req.body;
}) 

// Delete
app.delete("/api/user", async (req, res) => {
  let ID = req.query.id
}) 

app.delete("/api/test", async (req, res) => {
  let ID = req.query.id
}) 

// Listen
app.listen(port, () => {
  console.log(`Linux quiz backend listening on port ${port}`);
})