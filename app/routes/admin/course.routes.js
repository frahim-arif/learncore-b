module.exports = function (app) {
  const controller = require("../../controllers/admin/course.controller");

  app.post("/admin/course/add", controller.addCourse);
  app.get("/admin/course/all", controller.getCourses);
};
