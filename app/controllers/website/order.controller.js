const Order = require("../../models/Course");

exports.placeOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.json({ success: true, order });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};
