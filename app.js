const express = require("express");
require("dotenv/config");
require("colors");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");
const usersRouter = require("./routes/users");
const ordersRouter = require("./routes/orders");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");
const api = process.env.API_URL;

const app = express();

//Middlewares
app.use(cors());
app.options("*", cors());
app.use(express.json());
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
app.use(morgan("tiny"));
app.use(authJwt());
app.use(errorHandler);

//Routes
app.use(`${api}/products`, productsRouter);
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/orders`, ordersRouter);

//Database
mongoose
  .connect(process.env.CONNECTION_STRING)
  .then((db) => {
    console.log(`Database connected: ${db.connections[0].host}`.cyan.underline);
  })
  .catch((err) => {
    console.log(`${err}`.red.bold);
  });

//Server
app.listen(3000, () => {
  console.log("server is running on http://localhost:3000/".yellow.bold);
});
