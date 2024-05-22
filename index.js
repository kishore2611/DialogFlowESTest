const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require('cors');
const bodyParser = require('body-parser');

dotenv.config();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hi from server!");
});

//Route Middlewares
const apiRoutes = require('./Routes/api');
app.use("/api", apiRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => console.log(`Server Up and Running on Port ${PORT}`));