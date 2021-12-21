const express = require("express");
const Category = require("../models/Category");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const multer = require("multer");
const router = express.Router();

const FILE_TYPE_MAP = {
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
  "image/png": "png",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("Invalid image type");

    if (isValid) {
      uploadError = null;
    }

    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    // console.log("MULTIPART", file);
    // MULTIPART {
    //   fieldname: 'image',
    //   originalname: 'blob-1602613664965.jpeg',
    //   encoding: '7bit',
    //   mimetype: 'image/jpeg'
    // }
    const extension = FILE_TYPE_MAP[file.mimetype];
    const filename = file.originalname
      .replace(" ", "-")
      .split(`.${extension}`)
      .join("");
    cb(null, `${filename}-${Date.now()}.${extension}`);
  },
});

const uploadStorage = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  try {
    let filter = {};

    if (req.query.categories) {
      filter = { category: req.query.categories.split(",") };
    }

    const product = await Product.find(filter).populate("category");

    res.send(product);
  } catch (err) {
    res.status(400).json({
      error: err,
      success: false,
    });
  }
});

router.get("/get/count", async (req, res) => {
  try {
    const productCount = await Product.countDocuments();

    res.json({
      productCount,
    });
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.get("/get/featured/:count", async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  try {
    const featuredProduct = await Product.find({ isFeatured: true }).limit(
      +count
    );

    res.send(featuredProduct);
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id).populate("category");

    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "No product found" });
    }

    res.send(product);
  } catch (err) {
    res.status(404).json({ success: false, message: err });
  }
});

router.post(`/`, uploadStorage.single("image"), async (req, res) => {
  const {
    name,
    description,
    richDescription,
    brand,
    price,
    category,
    countInStock,
    rating,
    numReviews,
    isFeatured,
  } = req.body;

  // console.log("INSIDE ROUTE", req.file);
  // INSIDE ROUTE {
  //   fieldname: 'image',
  //   originalname: 'blob-1602613664965.jpeg',
  //   encoding: '7bit',
  //   mimetype: 'image/jpeg',
  //   destination: 'public/uploads',
  //   filename: 'blob-1602613664965-1634298721915.jpeg',
  //   path: 'public\\uploads\\blob-1602613664965-1634298721915.jpeg',
  //   size: 6311
  // }

  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: "No image found" });
  }

  const fileName = file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

  try {
    const categoryId = await Category.findById(category);

    if (!categoryId) {
      return res
        .status(400)
        .json({ success: false, message: "No category found" });
    }

    const product = await Product({
      name,
      description,
      richDescription,
      image: `${basePath}${fileName}`,
      brand,
      price,
      category,
      countInStock,
      rating,
      numReviews,
      isFeatured,
    });

    const newProduct = await product.save();

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err,
    });
  }
});

router.put("/:id", uploadStorage.single("image"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid object id" });
    }
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "No category found" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "No product found" });
    }

    const file = req.file;
    let imagePath;

    if (file) {
      const fileName = file.filename;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
      imagePath = `${basePath}${fileName}`;
    } else {
      imagePath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        image: imagePath,
      },
      {
        new: true,
      }
    );

    res.send(updatedProduct);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

router.put(
  "/gallery-images/:id",
  uploadStorage.array("images", 10),
  async (req, res) => {
    try {
      const files = req.files;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
      let imagesPath = [];

      if (files) {
        files.map((file) => imagesPath.push(`${basePath}${file.filename}`));
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          images: imagesPath,
        },
        {
          new: true,
        }
      );

      if (!updatedProduct) {
        return res
          .status(400)
          .json({ success: false, message: "No product found" });
      }

      res.send(updatedProduct);
    } catch (err) {
      res.status(404).json({ success: false, error: err });
    }
  }
);

router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "No Product found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err,
    });
  }
});

module.exports = router;
