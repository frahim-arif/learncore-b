const axios = require("axios");

const isTest = process.env.PHONEPE_ENV === "TEST";

const TOKEN_URL = isTest
  ? "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token"
  : "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";

const PAY_URL = isTest
  ? "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay"
  : "https://api.phonepe.com/apis/pg/checkout/v2/pay";

const STATUS_URL = isTest
  ? "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order"
  : "https://api.phonepe.com/apis/pg/checkout/v2/order";

async function getPhonePeToken() {
  const params = new URLSearchParams();

  params.append("client_id", process.env.PHONEPE_CLIENT_ID);
  params.append("client_version", process.env.PHONEPE_CLIENT_VERSION);
  params.append("client_secret", process.env.PHONEPE_CLIENT_SECRET);
  params.append("grant_type", "client_credentials");

  const res = await axios.post(TOKEN_URL, params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return `${res.data.token_type} ${res.data.access_token}`;
}

async function createPhonePePayment({
  merchantOrderId,
  amount,
  courseId,
  userEmail,
  userPhone,
}) {
  const token = await getPhonePeToken();

  const payload = {
    merchantOrderId,
    amount: Number(amount) * 100,
    expireAfter: 1200,
    paymentFlow: {
      type: "PG_CHECKOUT",
      merchantUrls: {
        redirectUrl: `${process.env.FRONTEND_URL}/payment/status?orderId=${merchantOrderId}`,
      },
    },
    metaInfo: {
      udf1: courseId || "",
      udf2: userEmail || "",
    },
  };

  if (userPhone) {
    payload.prefillUserLoginDetails = {
      phoneNumber: userPhone,
    };
  }

  const res = await axios.post(PAY_URL, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  });

  return res.data;
}

async function checkPhonePeStatus(merchantOrderId) {
  const token = await getPhonePeToken();

  const res = await axios.get(
    `${STATUS_URL}/${merchantOrderId}/status?details=false&errorContext=true`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    }
  );

  return res.data;
}

module.exports = {
  createPhonePePayment,
  checkPhonePeStatus,
};