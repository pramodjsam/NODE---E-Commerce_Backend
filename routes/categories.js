const express = require("express");
const Category = require("../models/Category");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();

    if (!categories) {
      return res
        .status(400)
        .json({ success: false, message: "No categories found" });
    }

    res.send(categories);
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err,
    });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: "No category found" });
    }

    res.send(category);
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err,
    });
  }
});

router.post("/", async (req, res) => {
  const { name, icon, color } = req.body;
  const category = new Category({
    name,
    icon,
    color,
  });
  const newCategory = await category.save();
  res.send(newCategory);
  try {
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err,
    });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findByIdAndUpdate(
      id,
      {
        ...req.body,
      },
      {
        new: true,
      }
    );

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "No category found" });
    }

    res.send(category);
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: "No category found",
      });
    }

    res.send({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err,
    });
  }
});

module.exports = router;
