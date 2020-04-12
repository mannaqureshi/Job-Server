const axios = require("axios").default;
const qs = require("querystring");
const urls = require("./urls");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const storage = path.join(__dirname, "../", "tokens.json");

module.exports.refreshAccessToken = (company) => {
  const credentials = JSON.parse(fs.readFileSync(storage));
  let id = process.env[`${company}_client_id`];
  let secret = process.env[`${company}_client_secret`];

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(urls.RefreshTokenUrl, null, {
        params: {
          refresh_token: credentials[company].refresh_token,
          client_id: id,
          client_secret: secret,
          grant_type: `refresh_token`,
        },
      });
      if (response.data.error) {
        reject(response.data.error);
      }
      resolve(response.data);
    } catch (error) {
      console.log(error);
    }
  });
};

// module.exports.getAccessTokenFromCode = (company) => {
//   let id = process.env[`${company}_client_id`];
//   let secret = process.env[`${company}_client_secret`];
//   let code = process.env[`${company}_code`];
//   let scope = process.env.scope;
//   return new Promise(async (resolve, reject) => {
//     try {
//       const response = await axios.post(
//         urls.AccessTokenUrl,
//         qs.stringify({
//           scope,
//           client_id: id,
//           client_secret: secret,
//           code,
//           grant_type: "authorization_code",
//         }),
//         {
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//         }
//       );
//       if (response.data.error) {
//         reject(response.data.error);
//       }
//       resolve(response.data);
//     } catch (error) {
//       reject(error);
//     }
//   });
// };
