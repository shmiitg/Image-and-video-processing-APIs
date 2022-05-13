const express = require("express");
const routes = require("./routes");
const cookieParser = require("cookie-parser");

const app = express();

global.__basedir = __dirname;

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

const port = process.env.port || 4000;

app.listen(port, () => console.log("Server running on port 4000"));
