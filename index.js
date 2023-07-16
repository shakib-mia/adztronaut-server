const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const app = express();
require("dotenv").config();
const cors = require("cors");

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send(`form port ${port}`);
});

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "beemediaindia@gmail.com",
    pass: "wconuttoyodedgdy",
  },
});

const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_password}@cluster0.v1ya6g8.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  client.connect();
  const blogsCollection = client.db("adztronaut").collection("blogs");
  const usersCollection = client.db("adztronaut").collection("admin");
  const subscribersCollection = client
    .db("adztronaut")
    .collection("subscribers");

  try {
    app.get("/blogs", async (req, res) => {
      const query = {};
      const cursor = await blogsCollection.find(query);
      const blogs = await cursor.toArray();
      res.send(blogs);
    });

    app.get("/blogs/:_id", async (req, res) => {
      const query = { _id: new ObjectId(req.params._id) };
      const cursor = await blogsCollection.findOne(query);
      res.send(cursor);
    });

    app.post("/blogs", async (req, res) => {
      const { post } = req.body;
      const { token } = req.headers;

      const { email } = jwt.decode(token);

      const cursor = await usersCollection.find({ email });
      const user = await cursor.toArray();

      if (user[0]) {
        const blogsCursor = await blogsCollection.insertOne(post);
        res.send(blogsCursor);
      } else {
        res.send({ status: 401, message: "Unauthorized user" });
      }
    });

    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      const cursor = await usersCollection.find({ email, password });
      const user = await cursor.toArray();

      if (user[0]) {
        const token = jwt.sign({ email }, process.env.access_token_secret, {
          expiresIn: "1d",
        });
        res.send({ success: true, token });
      } else {
        res.send({ success: false, message: "wrong credentials" });
      }
    });

    app.post("/send-email", (req, res) => {
      const { name, email, mobile, businessType } = req.body;
      const mailOptions = {
        from: email,
        to: process.env.email,
        subject: businessType,
        text: `from ${email}, ${name}, ${mobile}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error sending email:", error);
          res.status(400).send("Error sending email", error);
        } else {
          console.log("Email sent:", info.response);
          res.status(200).send(info.response);
        }
      });
    });

    app.post("/subscribers", async (req, res) => {
      const { email } = req.body;
      // console.log(email);
      const query = { email: email };

      const cursor = subscribersCollection.find(query);
      const subscriber = await cursor.toArray();
      if (subscriber[0]) {
        res.status(409).send({ message: "Email already exists" });
      } else {
        const postCursor = await subscribersCollection.insertOne(query);
        res.send(postCursor);
      }
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("listening on port", port);
});
