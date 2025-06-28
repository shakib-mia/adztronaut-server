// constants.js

const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config(); // Ensure you have dotenv installed and configured

const uri = `mongodb+srv://adztronaut:${process.env.db_password}@cluster0.v1ya6g8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const db = client.db("adztronaut");

const blogsCollection = db.collection("blogs");
const usersCollection = db.collection("admin");
const subscribersCollection = db.collection("subscribers");
const worksCollection = db.collection("works");

module.exports = {
  client,
  // connectDB,
  blogsCollection,
  usersCollection,
  subscribersCollection,
  worksCollection,
};
