const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
const moment = require("moment");
require("dotenv").config();

// middleware

app.use(cors());
app.use(express.json());

// mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jgojmkc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const blogsCollection = client.db("blogsDB").collection("blogs");

    // get method
    app.get("/blogs/recent-post", async (req, res) => {
      try {
        const result = await blogsCollection
          .find()
          .sort({ time: -1 })
          .limit(6)
          .toArray();

        res.send(result);
      } catch {
        (err) => {
          console.log(err);
        };
      }
    });

    // post method

    app.post("/blogs", async (req, res) => {
      try {
        const newBlogs = req.body;
        console.log(newBlogs);
        const result = await blogsCollection.insertOne(newBlogs);
        res.send(result);
      } catch {
        (err) => {
          console.log(err);
        };
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello blog server");
});

app.listen(port, () => {
  console.log("This is using from ", port);
});
