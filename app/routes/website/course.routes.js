
const mongoose = require("mongoose");

const Course = require("../../models/Course");
const Lesson = require("../../models/Lesson");
const Enrollment = require("../../models/Enrollment");
const studentAuth = require("../../middleware/studentAuth");

module.exports = (server) => {
  // GET ALL PUBLISHED COURSES
  server.get("/api/student/courses", studentAuth, async (req, res) => {
    try {
      const courses = await Course.find({
        isPublished: true,
      })
        .populate("skill", "name slug")
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean();

      const enrollments = await Enrollment.find({
        student: req.student._id,
        paymentStatus: { $in: ["approved", "not_required"] },
      }).select("course paymentStatus");

      const enrolledCourseIds = new Set(
        enrollments.map((item) => item.course.toString())
      );

      const result = courses.map((course) => {
        const isFree = course.accessType === "free";
        const isEnrolled =
          isFree || enrolledCourseIds.has(course._id.toString());

        return {
          ...course,
          isEnrolled,
          isLocked: !isEnrolled,
        };
      });

      return res.json({
        success: true,
        count: result.length,
        courses: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET SINGLE COURSE DETAILS
  server.get(
    "/api/student/courses/:courseId",
    studentAuth,
    async (req, res) => {
      try {
        const { courseId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid course ID",
          });
        }

        const course = await Course.findOne({
          _id: courseId,
          isPublished: true,
        }).populate("skill", "name slug");

        if (!course) {
          return res.status(404).json({
            success: false,
            message: "Course not found",
          });
        }

        const enrollment = await Enrollment.findOne({
          student: req.student._id,
          course: courseId,
          paymentStatus: { $in: ["approved", "not_required"] },
        });

        const isEnrolled =
          course.accessType === "free" || Boolean(enrollment);

        const lessons = await Lesson.find({
          course: courseId,
          isPublished: true,
          ...(isEnrolled ? {} : { isPreview: true }),
        })
          .select("title description duration isPreview displayOrder youtubeVideoId")
          .sort({ displayOrder: 1, createdAt: 1 });

        return res.json({
          success: true,
          course,
          isEnrolled,
          lessons,
          lockedLessons: isEnrolled
            ? 0
            : await Lesson.countDocuments({
                course: courseId,
                isPublished: true,
                isPreview: false,
              }),
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  );

  // GET LESSON VIDEO
  server.get(
    "/api/student/lessons/:lessonId",
    studentAuth,
    async (req, res) => {
      try {
        const { lessonId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid lesson ID",
          });
        }

        const lesson = await Lesson.findOne({
          _id: lessonId,
          isPublished: true,
        }).populate("course", "title slug accessType isPublished");

        if (!lesson || !lesson.course || !lesson.course.isPublished) {
          return res.status(404).json({
            success: false,
            message: "Lesson not found",
          });
        }

        let hasAccess = lesson.isPreview === true;

        if (lesson.course.accessType === "free") {
          hasAccess = true;
        }

        if (!hasAccess) {
          const enrollment = await Enrollment.findOne({
            student: req.student._id,
            course: lesson.course._id,
            paymentStatus: { $in: ["approved", "not_required"] },
          });

          hasAccess = Boolean(enrollment);
        }

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: "Please enroll in this course to access this lesson",
            locked: true,
          });
        }

        return res.json({
          success: true,
          lesson: {
            id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            isPreview: lesson.isPreview,
            youtubeVideoId: lesson.youtubeVideoId,
            course: {
              id: lesson.course._id,
              title: lesson.course.title,
            },
          },
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  );
};
