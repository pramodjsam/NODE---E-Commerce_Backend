const express = require("express");
const Order = require("../models/Order");
const OrderItem = require("../models/Order-Item");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name")
      .sort({ dateOrdered: -1 });

    res.send(orders);
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name")
      .populate({
        path: "orderItems",
        populate: { path: "product", populate: "category" },
      });

    if (!order) {
      return res
        .status(400)
        .json({ success: false, message: "No order found" });
    }

    res.send(order);
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.get("/get/totalsales", async (req, res) => {
  try {
    const totalSales = await Order.aggregate([
      { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } },
    ]);

    return res.send({ totalSales: totalSales.pop().totalSales });
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.get("/get/count", async (req, res) => {
  try {
    const totalCount = await Order.countDocuments();

    res.send({ totalCount });
  } catch (err) {
    res.status(404).jsone({ success: false, error: err });
  }
});

router.get("/get/userorders/:userId", async (req, res) => {
  try {
    const userOrder = await Order.find({ user: req.params.userId }).populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });

    if (!userOrder) {
      return res
        .status(404)
        .json({ success: false, message: "No order found" });
    }

    res.send(userOrder);
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.post("/", async (req, res) => {
  try {
    const orderItemsIds = Promise.all(
      req.body.orderItems.map(async (item) => {
        let orderItems = new OrderItem({
          quantity: item.quantity,
          product: item.product,
        });

        orderItems = await orderItems.save();

        return orderItems._id;
      })
    );

    const orderItemsIdsResolved = await orderItemsIds;

    const totalPrices = await Promise.all(
      orderItemsIdsResolved.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate(
          "product",
          "price"
        );
        const price = orderItem.product.price * orderItem.quantity;
        return price;
      })
    );

    const finalPrice = totalPrices.reduce((a, b) => a + b, 0);

    const order = new Order({
      ...req.body,
      orderItems: orderItemsIdsResolved,
      totalPrice: finalPrice,
    });

    const newOrder = await order.save();

    res.send(newOrder);
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      {
        new: true,
      }
    );

    if (!updatedOrder) {
      return res
        .status(400)
        .json({ success: false, message: "No order found" });
    }

    res.send(updatedOrder);
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res
        .status(400)
        .json({ success: false, message: "No order found" });
    }

    deletedOrder.orderItems.map(async (item) => {
      await OrderItem.findByIdAndDelete(item);
    });

    res.send({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    res.status(404).json({ success: false, error: err });
  }
});

module.exports = router;
