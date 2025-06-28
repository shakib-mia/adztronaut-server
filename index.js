const express = require("express");
const cors = require("cors");
const {
  connectDB,
  blogsCollection,
  usersCollection,
  subscribersCollection,
  worksCollection,
} = require("./constants");
const multer = require("multer");
const serverless = require("serverless-http");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

// Connect DB once at start
(async () => {
  await connectDB();
})();

// Routes
const routes = [
  {
    endpoint: "/blogs",
    path: require("./routes/blogs.js"),
  },
  {
    endpoint: "/works",
    path: require("./routes/works.js"),
  },
];

routes.forEach((route) => {
  app.use(route.endpoint, route.path);
});

// Example GET route
app.get("/blogs", async (req, res) => {
  const blogs = await blogsCollection.find({}).toArray();
  res.send(blogs);
});

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload-image", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: "No file uploaded" });
  }
  // File is already stored on the server by multer in the 'uploads' folder
  const fileUrl =
    req.protocol + "://" + req.get("host") + "/file/" + req.file.filename;
  res.send({
    fileUrl,
    fileData: {
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    },
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

app.post("/contact", (req, res) => {
  const { name, email, message, subject } = req.body;

  const mailOptions = {
    from: `"${name}" <${email}>`, // Sender shown as: "John Doe <john@example.com>"
    to: process.env.gmail_user, // Your email to receive the message
    subject: `📩 ${subject} from ${email}`, // Add an emoji to make it stand out
    html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #7F00E1;">📬 New Message from Portfolio</h2>
        <hr style="margin: 20px 0;" />
        <p>
          <strong>Name:</strong> ${name}
        </p>
        <p>
          <strong>Email:</strong> <a href="mailto:${email}">${email}</a>
        </p>
        <p>
          <strong>Subject:</strong> ${subject}
        </p>
        <p style="margin-top: 20px;">
          <strong>Message:</strong>
        </p>
        <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap;">
          ${message}
        </p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">
          This message was sent from your portfolio contact form.
        </p>
      </div>`,
  };

  // Save the contact message and send the email in parallel
  Promise.all([
    subscribersCollection.insertOne({ name, email, message, subject }),
    new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error);
        } else {
          resolve(info.response);
        }
      });
    }),
  ])
    .then(([dbResult, emailResponse]) => {
      res.status(200).send({
        message: "Contact message saved and email sent successfully",
        dbResult,
        emailResponse,
      });
    })
    .catch((error) => {
      console.error("Error in contact endpoint:", error);
      res.status(500).send("Error saving contact message or sending email");
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

app.post("/file", upload.single("file"), (req, res) => {
  res.send({
    fileUrl:
      req.protocol +
      "://" +
      req.get("host") +
      req.originalUrl +
      "/" +
      req.file?.filename,
  });
});

app.get("/file/:filename", (req, res) => {
  const options = {
    root: __dirname, // Replace this with the root directory you want to use.
  };
  const fileName = `./uploads/${req.params?.filename}`;
  res.sendFile(fileName, options, (err) => {
    if (err) {
      console.error("Error sending file:", err);
    }
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
