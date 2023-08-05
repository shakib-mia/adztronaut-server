const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const app = express();
require("dotenv").config();
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // The folder where uploaded files will be stored.
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name for storage.
  },
});

const upload = multer({ storage: storage });

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

const verifyToken = (req, res, next) => {
  const { token } = req.headers;

  // console.log(token);

  if (!token) {
    return res.status(401).send("Unauthorized access");
  }

  jwt.verify(token, process.env.access_token_secret, (error, decoded) => {
    // console.log(error, decoded);
    if (decoded?.email) {
      next();
    }

    if (error) {
      return res.status(403).send("Wrong token");
    }
  });

  // console.log(decoded);

  // const token = authHeader,
};

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
      const blog = req.body;
      const { token } = req.headers;
      // console.log(req.headers);
      // blog.blogImage = `http://localhost:5000/file/${
      //   req.file.path.split("/")[1]
      // }`;


      const cursor = await blogsCollection.insertOne(blog);
      res.send(cursor)

      // res.send(blog);

      // res.send({
      //   path: "http://localhost:5000/file/" + req.file.path.split("/")[1],
      // });

      if (!token) {
        res.status(401).send({ message: "Unauthorized user" });
      } else {
        const { email } = jwt.decode(token);

        const cursor = await usersCollection.find({ email });
        const user = await cursor.toArray();

        // console.log(blog);
        if (user[0]) {
          // const blogsCursor = await blogsCollection.insertOne(blog);
          // res.send(blogsCursor);
        } else {
          res.status(401).send({ message: "Unauthorized user" });
        }
      }
    });

    app.delete("/blogs/:_id", verifyToken, async (req, res) => {
      const { _id } = req.params;
      const query = { _id: new ObjectId(_id) };

      const blogsCursor = await blogsCollection.deleteOne(query);
      res.send(blogsCursor);
    });

    app.put("/blogs/:_id", verifyToken, async (req, res) => {
      const { _id } = req.params;
      const query = { _id: new ObjectId(_id) };

      const blog = req.body;

      // console.log(blog);

      const options = {
        upsert: true,
      };

      const updatedDoc = {
        $set: {
          ...blog,
        },
      };
      // console.log(blog);
      const updateBlogCursor = await blogsCollection.updateOne(
        query,
        updatedDoc,
        options
      );
      // const updatedBlogs = await updateBlogCursor.toArray();

      // console.log(updateBlogCursor);
      // console.log(updatedBlogs);

      res.send({
        ...updateBlogCursor,
        message: `Blog ${_id} updated successfully`,
      });
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


    app.post('/file', upload.single("file"), (req,res) => {
      res.send({fileUrl: req.protocol + '://' + req.get('host') + req.originalUrl + '/' + req.file.filename});
    })

    app.get("/file/:filename", (req,res) => {
      const options = {
        root: __dirname, // Replace this with the root directory you want to use.
      };
      const fileName = `./uploads/${req.params.filename}`;
      res.sendFile(fileName, options, (err) => {
        if (err) {
          console.error('Error sending file:', err);
        }
      });
    })

  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("listening on port", port);
});
