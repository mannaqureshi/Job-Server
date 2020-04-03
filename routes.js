const express = require("express");
const axios = require("axios").default;
const urls = require("./resources/urls");
const { refreshAccessToken } = require("./resources/utils");
const qs = require("querystring");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("<h1>Logistive | Movonics</h1>");
});

router.post("/logistive/payments/initiate", async (req, res) => {
  const response = await axios.post(
    `https://easypay.easypaisa.com.pk/easypay/Index.jsf`,
    qs.stringify({
      storeId: "9813",
      amount: "10",
      postBackURL: `http://localhost:5000/api/payments/firstHandler`,
      orderRefNum: "1101",
      autoRedirect: "1",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  res.json({ ...response.data });
});

router.get("/logistive/payments/firstHandler", (req, res) => {
  const { auth_token, postBackURL } = req.query;
  res.json({ success: true, auth_token, postBackURL });
});

router.get("/logistive/payments/secondHandler", (req, res) => {
  const { status, desc, orderRefNumber } = req.query;

  res.json({ status, desc, orderRefNumber });
});

router.post("/logistive/leads", async (req, res) => {
  const {
    email,
    name,
    phone,
    movingFrom,
    movingTo,
    jobDate,
    package,
  } = req.body;
  const { token_type, access_token } = await refreshAccessToken();
  console.log(req.body);
  try {
    const response = await axios.post(
      urls.AddLeadUrl,
      {
        data: [
          {
            Last_Name: name,
            Email: email,
            Phone: phone,
            Moving_to_City: movingTo,
            Current_City: movingFrom,
            Estimated_Job_Date: jobDate,
            Lead_Source: "Website Logistive.pk",
            Lead_Status: "New Lead",
            Type_of_Truck: package,
          },
        ],
      },
      {
        headers: {
          Authorization: `${token_type} ${access_token}`,
        },
      }
    );
    const repsonseMessage =
      response.data.data[0].code == "SUCCESS" ? true : false;

    res.json({
      id: response.data.data[0].details.id,
      success: repsonseMessage,
    });
  } catch (error) {
    console.log(error);
    res.json(error);
  }
});

router.post("/movonics/leads", async (req, res) => {
  try {
    const { token_type, access_token } = await refreshAccessToken("movonics");
    console.log(access_token);
    console.log(req.body);

    const response = await axios.post(
      urls.AddLeadUrl,
      {
        data: [
          {
            ...req.body,
            Lead_Status: "New Lead",
          },
        ],
      },
      {
        headers: {
          Authorization: `${token_type} ${access_token}`,
        },
      }
    );
    console.log(response.data);

    const repsonseMessage =
      response.data.data[0].code == "SUCCESS" ? true : false;

    res.json({
      id: response.data.data[0].details.id,
      success: repsonseMessage,
    });
  } catch (error) {
    console.log(error);
    res.json(error);
  }
});

router.post("/movonics/unbounce", async (req, res) => {
  try {
    const { token_type, access_token } = await refreshAccessToken("movonics");
    console.log(access_token);
    delete req.body.pageVariant;
    delete req.body.pageId;
    console.log(req.body);

    const response = await axios.post(
      urls.AddLeadUrl,
      {
        data: [
          {
            ...req.body,
            Lead_Status: "New Lead",
            Web_Source: "Movonics",
          },
        ],
      },
      {
        headers: {
          Authorization: `${token_type} ${access_token}`,
        },
      }
    );
    console.log(response.data);
    const repsonseMessage =
      response.data.data[0].code == "SUCCESS" ? true : false;
    return res.status(200).redirect(`https://www.movonics.com/thankyou`);
  } catch (error) {
    console.log(error);
    return res.status(302).redirect(`https://www.movonics.com/Error`);
  }
});
module.exports = router;
