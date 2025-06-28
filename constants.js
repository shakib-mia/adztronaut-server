const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://adztronaut:UaWymWdnUl4if7CO@cluster0.v1ya6g8.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const blogsCollection = client.db("adztronaut").collection("blogs");
const usersCollection = client.db("adztronaut").collection("admin");
const subscribersCollection = client.db("adztronaut").collection("subscribers");
const worksCollection = client.db("adztronaut").collection("works");

module.exports = {
  client,
  blogsCollection,
  usersCollection,
  subscribersCollection,
  worksCollection,
};
