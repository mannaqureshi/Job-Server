const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");

const storage = path.join(__dirname, "tokens.json");

const { getAccessTokenFromCode } = require("./resources/utils");
require("dotenv").config();

app.use(require("cors")());
app.use(require("body-parser").urlencoded({ extended: false }));
app.use(express.json());

app.use("/api", require("./routes"));

app.listen(process.env.PORT, async () => {
  console.log("Server Started");

  try {
    // const logistiveCredentials = await getAccessTokenFromCode("logistive");
    const movonicsCredentials = await getAccessTokenFromCode("movonics");
    fs.writeFileSync(
      storage,
      JSON.stringify({
        // logistive: logistiveCredentials || {},
        movonics: movonicsCredentials
      })
    );
    console.log("file written");
  } catch (error) {
    console.log(error);
  }
});

module.exports = {
  storage
};
