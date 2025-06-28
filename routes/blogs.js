const { ObjectId } = require("mongodb");
const { blogsCollection } = require("../constants");

const router = require("express").Router();

router.get("/", async (req, res) => {
  const query = {};
  const cursor = await blogsCollection.find(query);
  const blogs = await cursor.toArray();
  res.send(blogs);
});

router.get("/:_id", async (req, res) => {
  const query = { _id: new ObjectId(req.params._id) };
  const cursor = await blogsCollection.findOne(query);
  res.send(cursor);
});

router.post("/", async (req, res) => {
  const blog = req.body;

  const cursor = await blogsCollection.insertOne(blog);
  res.send(cursor);
});

router.delete("/:_id", async (req, res) => {
  const { _id } = req.params;
  const query = { _id: new ObjectId(_id) };

  const blogsCursor = await blogsCollection.deleteOne(query);
  res.send(blogsCursor);
});

router.put(
  "/blogs/:_id",
  // verifyToken,
  async (req, res) => {
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
  }
);

module.exports = router;
