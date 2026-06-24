const Course = require("../../models/Course");

exports.addCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.json({ success: true, course });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.getCourses = async (req, res) => {
  const courses = await Course.find({});
  res.json(courses);
};
