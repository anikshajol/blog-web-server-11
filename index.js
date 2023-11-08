const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const commentsCollection = client.db("blogsDB").collection("comments");
    const categoryCollection = client.db("blogsDB").collection("categories");
    const wishListCollection = client.db("blogsDB").collection("wishList");

    // get method

    app.get("/blogs", async (req, res) => {
      try {
        const result = await blogsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
      }
    });

    //

    app.get("/blogs/recent-post", async (req, res) => {
      try {
        const result = await blogsCollection
          .find()
          .sort({ time: -1 })
          .limit(6)
          .toArray();

        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/blogs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await blogsCollection.findOne(query);
        res.send(result);
      } catch {}
    });
    app.get("/categories", async (req, res) => {
      try {
        const result = await categoryCollection.find().toArray();
        res.send(result);
      } catch {}
    });

    // get wishlist

    app.get("/wishlist", async (req, res) => {
      try {
        let query = {};
        if (req.query?.email) {
          query = { email: req.query.email };
        }
        const result = await wishListCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // get comments

    app.get("/comments", async (req, res) => {
      try {
        const result = await commentsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/comments/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await commentsCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
      }
    });

    // post method

    app.post("/blogs", async (req, res) => {
      try {
        const newBlogs = req.body;
        console.log(newBlogs);
        const result = await blogsCollection.insertOne(newBlogs);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.post("/wishlist", async (req, res) => {
      try {
        const newWishList = req.body;
        const result = await wishListCollection.insertOne(newWishList);
        console.log(result);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // post method comments

    app.post("/comments", async (req, res) => {
      try {
        const newComments = req.body;
        const result = await commentsCollection.insertOne(newComments);
        res.send(result);
      } catch (error) {
        console.error(error);
      }
    });

    // update method.....

    app.put("/blogs/:id", async (req, res) => {
      const id = { _id: new ObjectId(req.params.id) };
      const body = req.body;
      const updateData = {
        $set: {
          ...body,
        },
      };

      const option = { upsert: true };
      const result = await blogsCollection.updateOne(id, updateData, option);
      console.log(body);
      res.send(result);
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
