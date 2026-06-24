module.exports = (server) => {
  const paymentController = require(
    "../../controllers/website/payment.controller"
  );

  server.post(
    "/api/payment/create-order",
    paymentController.createOrder
  );

  server.get(
    "/api/payment/status/:merchantOrderId",
    paymentController.checkStatus
  );
};