const {
  createPhonePePayment,
  checkPhonePeStatus,
} = require("../../services/phonepe.service");

exports.createOrder = async (req, res) => {
  try {
    const {
      amount,
      courseId,
      userEmail,
      userPhone,
    } = req.body;

    if (!amount || !courseId || !userEmail) {
      return res.status(400).json({
        success: false,
        message: "amount, courseId and userEmail are required",
      });
    }

    const merchantOrderId = "COURSE_" + Date.now();

    const data = await createPhonePePayment({
      merchantOrderId,
      amount,
      courseId,
      userEmail,
      userPhone,
    });

    res.json({
      success: true,
      merchantOrderId,
      phonepeOrderId: data.orderId,
      redirectUrl: data.redirectUrl,
      state: data.state,
    });
  } catch (err) {
    console.log("PhonePe Error:", err.response?.data || err.message);

    res.status(500).json({
      success: false,
      message: "PhonePe payment create failed",
      error: err.response?.data || err.message,
    });
  }
};

exports.checkStatus = async (req, res) => {
  try {
    const { merchantOrderId } = req.params;

    if (!merchantOrderId) {
      return res.status(400).json({
        success: false,
        message: "merchantOrderId is required",
      });
    }

    const data = await checkPhonePeStatus(merchantOrderId);

    /*
      PhonePe state examples:
      COMPLETED = payment success
      FAILED = payment failed
      PENDING = payment pending
    */

    if (data.state === "COMPLETED") {
      // Yahan baad me course unlock ka code lagega
      // Example:
      // await Enrollment.create({ courseId, userEmail, merchantOrderId, status: "PAID" });

      return res.json({
        success: true,
        paymentSuccess: true,
        message: "Payment completed",
        data,
      });
    }

    if (data.state === "FAILED") {
      return res.json({
        success: true,
        paymentSuccess: false,
        message: "Payment failed",
        data,
      });
    }

    return res.json({
      success: true,
      paymentSuccess: false,
      message: "Payment pending",
      data,
    });
  } catch (err) {
    console.log("PhonePe Status Error:", err.response?.data || err.message);

    res.status(500).json({
      success: false,
      message: "PhonePe status check failed",
      error: err.response?.data || err.message,
    });
  }
};