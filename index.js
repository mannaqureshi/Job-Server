const express = require("express");
const app = express();
const path = require("path");
const { encrypt, decrypt } = require("./resources/utils");

var sslRedirect = require("heroku-ssl-redirect");
const storage = path.join(__dirname, "tokens.json");

require("dotenv").config();

app.use(require("cors")());
app.use(sslRedirect());
app.use(require("body-parser").urlencoded({ extended: false }));
app.use(express.json());

app.use("/api", require("./routes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log("Server Started on " + PORT);
});

module.exports = {
  storage,
};
