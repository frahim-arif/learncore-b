module.exports = function (app) {
  const controller = require("../../controllers/website/order.controller");

  app.post("/order/place", controller.placeOrder);
};
