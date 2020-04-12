const express = require("express");
const axios = require("axios").default;
const urls = require("./resources/urls");
const { refreshAccessToken } = require("./resources/utils");
const qs = require("querystring");
const aes = require("aes-cross");
const router = express.Router();

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

router.post("/logistive/unbounce", async (req, res) => {
  try {
    const { token_type, access_token } = await refreshAccessToken("logistive");
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
            Lead_Source: "Movonics_UB",
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
            Lead_Source: "Movonics_UB",
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

router.get("/invoices/:id", async (req, res) => {
  const invoiceId = req.params.id;
  const { token_type, access_token } = await refreshAccessToken("movonics");
  try {
    const response = await axios.get(`${urls.GetInvoice}/${invoiceId}`, {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });

    if (response.data.code == 0) {
      let {
        invoice_id,
        invoice_number,
        invoice_url,
        currency_symbol,
        line_items,
        total,
      } = response.data.invoice;

      const items = line_items.map(
        ({ name, description, rate, quantity, item_total }) => {
          return {
            name,
            description,
            rate,
            quantity,
            total: item_total,
          };
        }
      );
      return res.json({
        invoice: {
          invoice_id,
          invoice_number,
          invoice_url,
          currency_symbol,
          items,
          total,
        },
        success: true,
      });
    }
    throw new Error(response.message);
  } catch (error) {
    return res.json({ message: error, success: false });
  }
});

router.post("/payments/initiate", async (req, res) => {
  const { invoice_id, invoice_number } = req.body;
  let amount = 0;
  const { token_type, access_token } = await refreshAccessToken("movonics");
  try {
    const response_invoice = await axios.get(
      `${urls.GetInvoice}/${invoice_id}`,
      {
        headers: {
          Authorization: `${token_type} ${access_token}`,
        },
      }
    );
    amount = `${response_invoice.data.invoice.total}.0`;

    const params = {
      amount,
      autoRedirect: 0,
      orderRefNum: invoice_number,
      // paymentMethod: "CC_PAYMENT_METHOD",
      postBackURL: `http://localhost:5000/api/payments/firstHandler`,
      storeId: "9813",
    };

    let queryParams = Object.keys(params).reduce((acc, key) => {
      return (acc += `${key}=${params[key]}&`);
    }, ``);
    queryParams = queryParams.substr(0, queryParams.length - 1);
    console.log(queryParams);
    console.log(
      aes.encText(queryParams, `LGPL1103O1MJ947U`, null, "base64", "base64")
    );

    // 2077566000001660111

    const response = await axios.post(
      `https://easypay.easypaisa.com.pk/easypay/Index.jsf`,
      qs.stringify({
        ...params,
        merchantHashedReq: aes.encText(
          queryParams,
          `LGPL1103O1MJ947U`,
          null,
          "base64",
          "base64"
        ),
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log(response.data);

    res.json({ ...response.data });
  } catch (error) {
    console.log("Error");
    return res.json({ message: error, success: false });
  }
});

router.get("/payments/firstHandler", (req, res) => {
  const { auth_token, postBackURL } = req.query;
  res.json({ success: true, auth_token, postBackURL });
});

router.get("/payments/secondHandler", (req, res) => {
  const { status, desc, orderRefNumber } = req.query;
  res.json({ status, desc, orderRefNumber });
});

module.exports = router;
