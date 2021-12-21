const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");

    if (!users) {
      return res
        .status(400)
        .json({ success: false, message: "No users found" });
    }

    res.send(users);
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const users = await User.findById(req.params.id).select("-passwordHash");

    if (!users) {
      return res
        .status(400)
        .json({ success: false, message: "No users found" });
    }

    res.send(users);
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.get("/get/count", async (req, res) => {
  try {
    const userCount = await User.countDocuments();

    res.send({ userCount });
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Wrong credentials" });
    }

    const isMatchPassword = await user.comparePassword(req.body.password);
    if (!isMatchPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Wront credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, isAdmin: user.isAdmin },
      process.env.SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.send({ user: user.email, token: token });
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = new User({
      ...req.body,
      passwordHash: req.body.passwordHash,
    });

    const newUser = await user.save();

    res.send(newUser);
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.post("/register", async (req, res) => {
  try {
    const user = new User({
      ...req.body,
      passwordHash: req.body.passwordHash,
    });

    const newUser = await user.save();

    res.send(newUser);
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: "No user found" });
    }

    res.send(updatedUser);
  } catch (err) {
    res.status(404).json({ error: err });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndRemove(req.params.id);

    if (!deletedUser) {
      return res.status(400).json({ message: "No user found" });
    }

    res.send({ message: "User deleted successfully" });
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

module.exports = router;
