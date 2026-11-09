
const mongoose = require("mongoose");
const Course = require("../../models/Course");
const Skill = require("../../models/Skill");
const Lesson = require("../../models/Lesson");
const Enrollment = require("../../models/Enrollment");
const adminAuth = require("../../middleware/adminAuth");

module.exports = (server) => {

  // CREATE COURSE
  server.post("/api/admin/courses", adminAuth, async (req, res) => {
    try {
      const {
        title,
        slug,
        description,
        skill,
        thumbnail,
        price,
        accessType,
        displayOrder,
      } = req.body;

      if (!title || !slug || !skill) {
        return res.status(400).json({
          success: false,
          message: "Title, slug and skill are required",
        });
      }

      if (!mongoose.isValidObjectId(skill)) {
        return res.status(400).json({
          success: false,
          message: "Invalid skill ID",
        });
      }

      const skillExists = await Skill.findOne({
        _id: skill,
        isActive: true,
      });

      if (!skillExists) {
        return res.status(400).json({
          success: false,
          message: "Active skill not found",
        });
      }

      const normalizedSlug = slug.trim().toLowerCase();

      const existing = await Course.findOne({ slug: normalizedSlug });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Course slug already exists",
        });
      }

      const coursePrice = Number(price ?? 0);

      if (!Number.isFinite(coursePrice) || coursePrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid course price",
        });
      }

      if (!["free", "paid"].includes(accessType || "paid")) {
        return res.status(400).json({
          success: false,
          message: "Invalid access type",
        });
      }

      const course = await Course.create({
        title,
        slug: normalizedSlug,
        description,
        skill,
        thumbnail,
        price: coursePrice,
        accessType: accessType || "paid",
        displayOrder,
      });

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        course,
      });

    } catch (error) {
      console.error("Create Course:", error);

      res.status(500).json({
        success: false,
        message: "Unable to create course",
      });
    }
  });


  // GET ALL COURSES
  server.get("/api/admin/courses", adminAuth, async (req, res) => {
    try {
      const filter = {};

      if (req.query.skill && mongoose.isValidObjectId(req.query.skill)) {
        filter.skill = req.query.skill;
      }

      if (req.query.isPublished !== undefined) {
        filter.isPublished = req.query.isPublished === "true";
      }

      const courses = await Course.find(filter)
        .populate("skill", "name slug")
        .sort({ displayOrder: 1, createdAt: -1 });

      res.json({
        success: true,
        total: courses.length,
        courses,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to fetch courses",
      });
    }
  });


  // GET SINGLE COURSE
  server.get("/api/admin/courses/:id", adminAuth, async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID",
        });
      }

      const course = await Course.findById(req.params.id)
        .populate("skill", "name slug");

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      const lessons = await Lesson.find({
        course: course._id,
      }).sort({ displayOrder: 1 });

      res.json({
        success: true,
        course,
        lessons,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to fetch course",
      });
    }
  });


  // UPDATE COURSE
  server.put("/api/admin/courses/:id", adminAuth, async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID",
        });
      }

      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      const {
        title,
        slug,
        description,
        skill,
        thumbnail,
        price,
        accessType,
        displayOrder,
        isPublished,
      } = req.body;

      if (title !== undefined) course.title = title;
      if (slug !== undefined) course.slug = slug.trim().toLowerCase();
      if (description !== undefined) course.description = description;
      if (thumbnail !== undefined) course.thumbnail = thumbnail;
      if (displayOrder !== undefined) course.displayOrder = displayOrder;

      if (skill !== undefined) {
        if (!mongoose.isValidObjectId(skill)) {
          return res.status(400).json({
            success: false,
            message: "Invalid skill ID",
          });
        }

        const skillExists = await Skill.findOne({
          _id: skill,
          isActive: true,
        });

        if (!skillExists) {
          return res.status(400).json({
            success: false,
            message: "Active skill not found",
          });
        }

        course.skill = skill;
      }

      if (price !== undefined) {
        const coursePrice = Number(price);

        if (!Number.isFinite(coursePrice) || coursePrice < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid course price",
          });
        }

        course.price = coursePrice;
      }

      if (accessType !== undefined) {
        if (!["free", "paid"].includes(accessType)) {
          return res.status(400).json({
            success: false,
            message: "Invalid access type",
          });
        }

        course.accessType = accessType;
      }

      if (isPublished !== undefined) {
        course.isPublished = isPublished;
      }

      const duplicate = await Course.findOne({
        _id: { $ne: course._id },
        slug: course.slug,
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Course slug already exists",
        });
      }

      await course.save();

      res.json({
        success: true,
        message: "Course updated successfully",
        course,
      });

    } catch (error) {
      console.error("Update Course:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update course",
      });
    }
  });


  // PUBLISH / UNPUBLISH COURSE
  server.patch("/api/admin/courses/:id/publish", adminAuth, async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID",
        });
      }

      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      course.isPublished = Boolean(req.body.isPublished);

      await course.save();

      res.json({
        success: true,
        message: course.isPublished
          ? "Course published successfully"
          : "Course unpublished successfully",
        course,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to update course status",
      });
    }
  });


  // DELETE COURSE
  server.delete("/api/admin/courses/:id", adminAuth, async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID",
        });
      }

      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      const [lessonCount, enrollmentCount] = await Promise.all([
        Lesson.countDocuments({ course: course._id }),
        Enrollment.countDocuments({ course: course._id }),
      ]);

      if (lessonCount > 0 || enrollmentCount > 0) {
        return res.status(409).json({
          success: false,
          message: "Course has lessons or student enrollments. Unpublish it instead of deleting.",
        });
      }

      await course.deleteOne();

      res.json({
        success: true,
        message: "Course deleted successfully",
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to delete course",
      });
    }
  });

};
