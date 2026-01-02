import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config()

let env = process.env;
let uri = `mongodb+srv://${env.database_login_name}:${env.database_password}@webii.44euncl.mongodb.net/?appName=WEBII`
let baseURL = "http://localhost:3000";

const app = express();
const port = 3000;
const saltRounds = 10;

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
      const testsCollection = database.collection("tests");
      let testsFindResultTyped = await testsCollection.findOne({user_id: parseInt(dataUserID)}, {sort: {user_test_id: -1}, projection: {_id: 0}});
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
      let dataResultObject = {};
      if (dataTestType == "dewm") {
        dataResultObject = {
          dewm_id: dataTestResult.id,
          score: dataTestResult.score
        }
      }
      if (dataTestType == "distro") {
        dataResultObject = {
          distro_id: dataTestResult.id,
          score: dataTestResult.score
        }
      }
      let dataTopScoresArray = [];
      if (dataTestType == "dewm") {
        for (const i of dataTestScores) {
          dataTopScoresArray.push({
            score: i.score,
            dewm_id: i.id
          })
        }
      }
      if (dataTestType == "distro") {
        for (const i of dataTestScores) {
          dataTopScoresArray.push({
            score: i.score,
            distro_id: i.id
          })
        }
      }
      let responseData = {
        id: responseDataID,
        user_test_id: responseDataUserTestID,
        user_id: dataUserID,
        type: dataTestType,
        result: dataResultObject,
        top_scores: dataTopScoresArray
      }
      const result = await testsCollection.insertOne(responseData);
      // update test_amount for user
      const userFetch = await fetch(baseURL + "/api/user?id=" + dataUserID);
      const userData = await userFetch.json();

      res.status(200).json(responseData)
    }
  }
}) 

app.post("/api/user", async (req, res) => {
  let data = req.body;
  let dataFirstName = data.firstname;
  let dataLastName = data.lastname;
  let dataBirthdate = data.birthdate;
  let dataEmail = data.email;
  let dataPassword = data.password;

  if (dataFirstName == undefined || dataLastName == undefined || dataBirthdate == undefined || dataEmail == undefined || dataPassword == undefined) {
    res.status(422).json({
      message: "Body incomplete!"
    });
  } else {
    const hashedPassword = await bcrypt.hash(dataPassword, saltRounds);
    const usersCollection = database.collection("users");
    const lastUser = await usersCollection.find().sort({ id: -1 }).limit(1).toArray();
    const newId = lastUser.length > 0 ? lastUser[0].id + 1 : 1;
    const newUser = {
      id: newId,
      firstname: dataFirstName,
      lastname: dataLastName,
      email: dataEmail,
      password: hashedPassword,
      avatar: "",
      age: dataBirthdate,
      date_created: new Date().toLocaleString("nl-BE", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false }),
      current_os: "",
      current_distro: "",
      current_dewm: "", 
      test_amount: {
        distro: 0,
        dewm: 0
      }
    };
    await usersCollection.insertOne(newUser);
    res.send(newUser);
  }
}) 

app.post("/api/getscores", async (req, res) => {
  try {
    let data = req.body;
    const categoryWeights = data.answers.reduce((acc, answer) => {
      answer.categories.forEach(category => {
        acc[category] = (acc[category] || 0) + 1;
      });
      return acc;
    }, {});
    const allowedCollections = ["distros", "dewm"];
    if (!allowedCollections.includes(data.type)) {
      return res.status(400).json({ error: "Invalid type" });
    }
    const collection = database.collection(data.type);
    const findResult = await collection.find().project({ _id: 0 }).toArray();
    const scored = findResult
      .map(item => ({
        ...item,
        score: (() => {
          const cats = item.categories || [];
          if (cats.length === 0) return 0;
          const total = cats.reduce(
            (sum, cat) => sum + (categoryWeights[cat] || 0),
            0
          );
          const average = total / cats.length;
          const scaled = Math.min(average * 2, 10);
          return Math.round(scaled * 2) / 2;
        })()
      }))
      .sort((a, b) => b.score - a.score);
    res.status(200).json({
      best: scored[0],
      alternatives: scored.slice(1, 5),
      weights: categoryWeights
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/api/login", async (req, res) => {
  let data = req.body;
  if (!data) return res.status(422).json({ message: "Body missing!" });
  let dataEmail = data.email;
  let dataPassword = data.password;
  if (!dataEmail || !dataPassword) return res.status(422).json({ message: "Body incomplete!" });
  try {
    const usersCollection = database.collection("users");
    let userFindResult = await usersCollection.findOne({ email: dataEmail }, { projection: { _id: 0 } });
    if (!userFindResult) return res.status(200).json({ valid: false });
    const match = await bcrypt.compare(dataPassword, userFindResult.password);
    if (match) res.status(200).json({ valid: true, user_id: userFindResult.id });
    else res.status(200).json({ valid: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Update
app.put("/api/user", async (req, res) => {
  let ID = Number(req.query.id);
  let data = req.body;
  if (!ID || !data) return res.status(422).json({ message: "Body or id missing!" });
  delete data.password;
  try {
    const usersCollection = database.collection("users");
    const result = await usersCollection.updateOne({ id: ID }, { $set: data });
    if (result.matchedCount === 0) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ updated: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete
app.delete("/api/user", async (req, res) => {
  const ID = req.query.id;
  if (!ID) {
    return res.status(422).json({ message: "User ID missing!" });
  }
  try {
    const usersCollection = database.collection("users");
    const testsCollection = database.collection("tests");
    const result = await usersCollection.deleteOne({ id: parseInt(ID) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }
    await testsCollection.deleteMany({ user_id: parseInt(ID) });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/test", async (req, res) => {
  const ID = req.query.id;
  if (!ID) {
    return res.status(422).json({ message: "Test ID missing!" });
  }
  try {
    const testsCollection = database.collection("tests");
    const result = await testsCollection.deleteOne({ user_test_id: parseInt(ID) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Test not found!" });
    }
    res.status(200).json({ message: "Test deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Listen
app.listen(port, () => {
  console.log(`Linux quiz backend listening on port ${port}`);
})