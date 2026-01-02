import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Swagger UI
const swaggerDocument = YAML.load(path.join(__dirname, "openapi.yaml"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/", (req, res) => res.redirect("/docs"));

// Get
app.get("/api/user", async (req, res) => {
  try {
    let ID = req.query.id;
    if (!ID) {
      return res.status(422).json({ message: "No user ID found in request!" });
    }
    const collection = database.collection("users");
    const findResult = await collection.findOne(
      { id: parseInt(ID) },
      { projection: { _id: 0, password: 0 } }
    );
    if (findResult) {
      res.status(200).json(findResult);
    } else {
      res.status(404).json({ message: `No user found with id ${ID}` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/distro", async (req, res) => {
  try {
    let ID = req.query.id;
    if (!ID) {
      return res.status(422).json({ message: "No distro ID found in request!" });
    }
    const collection = database.collection("distros");
    const findResult = await collection.findOne(
      { id: parseInt(ID) },
      { projection: { _id: 0 } }
    );
    if (findResult) {
      res.status(200).json(findResult);
    } else {
      res.status(404).json({ message: `No distro found with id ${ID}` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/dewm", async (req, res) => {
  try {
    let ID = req.query.id;
    if (!ID) {
      return res.status(422).json({ message: "No DE/WM ID found in request!" });
    }
    const collection = database.collection("dewm");
    const findResult = await collection.findOne(
      { id: parseInt(ID) },
      { projection: { _id: 0 } }
    );
    if (findResult) {
      res.status(200).json(findResult);
    } else {
      res.status(404).json({ message: `No DE/WM found with id ${ID}` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/tests", async (req, res) => {
  try {
    let ID = req.query.id;
    let TYPE = req.query.type;
    if (!ID) {
      return res.status(422).json({ message: "No user ID found in request!" });
    }
    if (!TYPE) {
      return res.status(422).json({ message: "No test type found in request!" });
    }
    TYPE = TYPE.toLowerCase();
    if (TYPE !== "dewm" && TYPE !== "distro") {
      return res.status(404).json({ message: "Given test type doesn't exist!" });
    }
    const collection = database.collection("tests");
    const query = { user_id: parseInt(ID), type: TYPE };
    const cursor = collection.find(query).project({ _id: 0 });
    const count = await collection.countDocuments(query);
    if (count === 0) {
      return res.status(404).json({ message: `No tests found with user id ${ID} and type ${TYPE}` });
    }
    const results = [];
    for await (const item of cursor) {
      results.push(item);
    }
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/quiz", async (req, res) => {
  try {
    let NUMBER = req.query.number;
    let TYPE = req.query.type;
    if (!NUMBER) return res.status(422).json({ message: "No question NUMBER found in request!" });
    if (!TYPE) return res.status(422).json({ message: "No test type found in request!" });
    TYPE = TYPE.toLowerCase();
    if (TYPE !== "dewm" && TYPE !== "distro") return res.status(404).json({ message: "Given test type doesn't exist!" });
    const collection = database.collection(TYPE + "_test");
    const findResult = await collection.findOne({ question_number: parseInt(NUMBER) }, { projection: { _id: 0 } });
    if (findResult) {
      res.status(200).json(findResult);
    } else {
      res.status(404).json({ message: `No question found with number ${NUMBER}` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Post
app.post("/api/quiz", async (req, res) => {
  try {
    const data = req.body;
    if (!data) return res.status(422).json({ message: "Body missing!" });
    const { user_id, type, result, top_scores } = data;
    if (!user_id || !type || !result || !top_scores) return res.status(422).json({ message: "Body incomplete!" });

    const testsCollection = database.collection("tests");
    const lastTestGlobal = await testsCollection.findOne({}, { sort: { id: -1 }, projection: { _id: 0 } });
    const lastTestUser = await testsCollection.findOne({ user_id: parseInt(user_id) }, { sort: { user_test_id: -1 }, projection: { _id: 0 } });

    const responseDataID = lastTestGlobal ? lastTestGlobal.id + 1 : 1;
    const responseDataUserTestID = lastTestUser ? lastTestUser.user_test_id + 1 : 1;

    let dataResultObject = {};
    let dataTopScoresArray = [];

    if (type === "dewm") {
      dataResultObject = { dewm_id: result.id, score: result.score };
      dataTopScoresArray = top_scores.map(i => ({ score: i.score, dewm_id: i.id }));
    }
    if (type === "distro") {
      dataResultObject = { distro_id: result.id, score: result.score };
      dataTopScoresArray = top_scores.map(i => ({ score: i.score, distro_id: i.id }));
    }

    const responseData = {
      id: responseDataID,
      user_test_id: responseDataUserTestID,
      user_id,
      type,
      result: dataResultObject,
      top_scores: dataTopScoresArray
    };

    await testsCollection.insertOne(responseData);
    res.status(200).json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}); 

app.post("/api/user", async (req, res) => {
  try {
    const data = req.body;
    const { firstname, lastname, birthdate, email, password } = data || {};
    if (!firstname || !lastname || !birthdate || !email || !password) {
      return res.status(422).json({ message: "Body incomplete!" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const usersCollection = database.collection("users");
    const lastUser = await usersCollection.find().sort({ id: -1 }).limit(1).toArray();
    const newId = lastUser.length > 0 ? lastUser[0].id + 1 : 1;

    const newUser = {
      id: newId,
      firstname,
      lastname,
      email,
      password: hashedPassword,
      avatar: "",
      age: birthdate,
      date_created: new Date().toLocaleString("nl-BE", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false }),
      current_os: "",
      current_distro: "",
      current_dewm: "", 
      test_amount: { distro: 0, dewm: 0 }
    };

    await usersCollection.insertOne(newUser);
    res.status(200).json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/getscores", async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.answers || !Array.isArray(data.answers) || !data.type) {
      return res.status(422).json({ message: "Body missing or incomplete!" });
    }
    const allowedCollections = ["distros", "dewm"];
    if (!allowedCollections.includes(data.type)) {
      return res.status(400).json({ error: "Invalid type" });
    }
    const categoryWeights = data.answers.reduce((acc, answer) => {
      (answer.categories || []).forEach(cat => {
        acc[cat] = (acc[cat] || 0) + 1;
      });
      return acc;
    }, {});
    const collection = database.collection(data.type);
    const findResult = await collection.find().project({ _id: 0 }).toArray();
    const scored = findResult
      .map(item => {
        const cats = item.categories || [];
        if (cats.length === 0) return { ...item, score: 0 };
        const total = cats.reduce((sum, cat) => sum + (categoryWeights[cat] || 0), 0);
        const average = total / cats.length;
        const scaled = Math.min(average * 2, 10);
        return { ...item, score: Math.round(scaled * 2) / 2 };
      })
      .sort((a, b) => b.score - a.score);
    res.status(200).json({
      best: scored[0] || null,
      alternatives: scored.slice(1, 5),
      weights: categoryWeights
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.post("/api/login", async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.email || !data.password) {
      return res.status(422).json({ message: "Body missing or incomplete!" });
    }
    const usersCollection = database.collection("users");
    const user = await usersCollection.findOne(
      { email: data.email },
      { projection: { _id: 0, password: 1, id: 1 } }
    );
    if (!user) return res.status(200).json({ valid: false });
    const match = await bcrypt.compare(data.password, user.password);
    if (match) res.status(200).json({ valid: true, user_id: user.id });
    else res.status(200).json({ valid: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Update
app.put("/api/user", async (req, res) => {
  try {
    const ID = Number(req.query.id);
    const data = req.body;
    if (!ID || !data) return res.status(422).json({ message: "Body or id missing!" });
    delete data.password;
    const usersCollection = database.collection("users");
    const result = await usersCollection.updateOne({ id: ID }, { $set: data });
    if (result.matchedCount === 0) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ updated: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete
app.delete("/api/user", async (req, res) => {
  try {
    const ID = req.query.id;
    if (!ID) return res.status(422).json({ message: "User ID missing!" });
    const usersCollection = database.collection("users");
    const testsCollection = database.collection("tests");
    const result = await usersCollection.deleteOne({ id: parseInt(ID) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "User not found!" });
    await testsCollection.deleteMany({ user_id: parseInt(ID) });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/test", async (req, res) => {
  try {
    const ID = req.query.id;
    if (!ID) return res.status(422).json({ message: "Test ID missing!" });
    const testsCollection = database.collection("tests");
    const result = await testsCollection.deleteOne({ user_test_id: parseInt(ID) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Test not found!" });
    res.status(200).json({ message: "Test deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Listen
app.listen(port, () => {
  console.log(`Linux quiz backend listening on port ${port}`);
})