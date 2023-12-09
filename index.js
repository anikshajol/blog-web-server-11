const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

// middleware

app.use(
  cors({
    origin: [
      "https://blog-web-6c715.web.app",
      // "https://majestic-custard-3f8211.netlify.app",
      // "https://654cbb3bd9a9610b846fefbc--majestic-custard-3f8211.netlify.app/",
    ],
    credentials: true,
  })
);
// Example for Express.js
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(express.json());
app.use(cookieParser());

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

// middleware
const logger = (req, res, next) => {
  // console.log("log: info", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log("token in the middleware", token);
  if (!token) {
    return res.status(401).send({ Message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ Message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });

  // next();
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const blogsCollection = client.db("blogsDB").collection("blogs");
    const commentsCollection = client.db("blogsDB").collection("comments");
    const categoryCollection = client.db("blogsDB").collection("categories");
    const wishListCollection = client.db("blogsDB").collection("wishList");

    // jwt

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log("user of token", user);

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ Success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      // console.log("logging out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ Success: true });
    });

    // get method

    app.get("/blogs", async (req, res) => {
      try {
        // console.log("cok cok cokies", req.cookies);
        let query = {};

        if (req.query?.category) {
          // If a category parameter is provided, filter by category
          query = { category: req.query.category };
        }

        // console.log(query);

        const result = await blogsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching blogs");
      }
    });

    //

    app.get("/blogs/recent-post", async (req, res) => {
      try {
        // console.log("cok col", req.cookies);
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

    app.get("/blogs/:id", logger, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await blogsCollection.findOne(query);
        res.send(result);
      } catch {}
    });
    app.get("/categories", logger, async (req, res) => {
      try {
        // console.log("cok cok", req.cookies);
        const result = await categoryCollection.find().toArray();
        res.send(result);
      } catch {}
    });

    // get wishlist

    app.get("/wishlist", async (req, res) => {
      try {
        // console.log("cok cok", req.user);

        if (req.user.email != req.query.email) {
          return res.status(403).send({ Message: "Forbidden access" });
        }

        let query = {};

        if (req.query?.email) {
          query = { email: req.query.email };
        }
        console.log(query);
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

    app.get("/comments/:id", logger, verifyToken, async (req, res) => {
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
        // console.log(newBlogs);
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
        // console.log(result);
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
      // console.log(body);
      res.send(result);
    });

    // delete method;

    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishListCollection.deleteOne(query);
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
