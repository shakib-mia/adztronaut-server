const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const { worksCollection } = require("../constants");

const router = express.Router();

router.get("/", async (req, res) => {
  const works = await worksCollection.find({}).toArray();
  res.send(works);
});

router.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  const work = await worksCollection.findOne({ slug });
  if (!work) {
    return res.status(404).send({ message: "Work not found" });
  }
  res.send(work);
});

module.exports = router;
