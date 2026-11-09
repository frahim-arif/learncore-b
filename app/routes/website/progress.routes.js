
const mongoose = require("mongoose");

const Progress = require("../../models/Progress");
const Course = require("../../models/Course");
const Lesson = require("../../models/Lesson");
const Enrollment = require("../../models/Enrollment");
const studentAuth = require("../../middleware/studentAuth");

// Check course access
const checkCourseAccess = async (studentId, course) => {
  if (course.accessType === "free") return true;

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: course._id,
    paymentStatus: { $in: ["approved", "not_required"] },
  });

  return Boolean(enrollment);
};

module.exports = (server) => {
  // MARK LESSON AS COMPLETED
  server.post(
    "/api/student/progress/complete",
    studentAuth,
    async (req, res) => {
      try {
        const { courseId, lessonId } = req.body;

        if (
          !mongoose.Types.ObjectId.isValid(courseId) ||
          !mongoose.Types.ObjectId.isValid(lessonId)
        ) {
          return res.status(400).json({
            success: false,
            message: "Valid course ID and lesson ID are required",
          });
        }

        const course = await Course.findOne({
          _id: courseId,
          isPublished: true,
        });

        if (!course) {
          return res.status(404).json({
            success: false,
            message: "Course not found",
          });
        }

        const lesson = await Lesson.findOne({
          _id: lessonId,
          course: courseId,
          isPublished: true,
        });

        if (!lesson) {
          return res.status(404).json({
            success: false,
            message: "Published lesson not found in this course",
          });
        }

        const isEnrolled = await checkCourseAccess(
          req.student._id,
          course
        );

        if (!isEnrolled && !lesson.isPreview) {
          return res.status(403).json({
            success: false,
            message: "You are not enrolled in this course",
          });
        }

        const progress = await Progress.findOneAndUpdate(
          {
            student: req.student._id,
            course: courseId,
          },
          {
            $addToSet: {
              completedLessons: lessonId,
            },
            $set: {
              lastWatchedLesson: lessonId,
              lastWatchedAt: new Date(),
            },
            $setOnInsert: {
              student: req.student._id,
              course: courseId,
            },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );

        const availableLessonFilter = {
          course: courseId,
          isPublished: true,
          ...(isEnrolled ? {} : { isPreview: true }),
        };

        const totalLessons = await Lesson.countDocuments(
          availableLessonFilter
        );

        const completedCount = progress.completedLessons.filter(
          (id) =>
            id &&
            progress.completedLessons.some(
              (completedId) =>
                completedId.toString() === id.toString()
            )
        ).length;

        const availableCompletedCount = await Lesson.countDocuments({
          ...availableLessonFilter,
          _id: { $in: progress.completedLessons },
        });

        const completionPercentage =
          totalLessons === 0
            ? 0
            : Math.round((availableCompletedCount / totalLessons) * 100);

        progress.completionPercentage = completionPercentage;
        await progress.save();

        return res.json({
          success: true,
          message: "Lesson marked as completed",
          progress: {
            completedLessons: progress.completedLessons,
            totalLessons,
            completedCount: availableCompletedCount,
            completionPercentage,
            lastWatchedLesson: progress.lastWatchedLesson,
            lastWatchedAt: progress.lastWatchedAt,
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

  // GET COURSE PROGRESS
  server.get(
    "/api/student/progress/:courseId",
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
        });

        if (!course) {
          return res.status(404).json({
            success: false,
            message: "Course not found",
          });
        }

        const isEnrolled = await checkCourseAccess(
          req.student._id,
          course
        );

        const lessonFilter = {
          course: courseId,
          isPublished: true,
          ...(isEnrolled ? {} : { isPreview: true }),
        };

        const totalLessons = await Lesson.countDocuments(lessonFilter);

        const progress = await Progress.findOne({
          student: req.student._id,
          course: courseId,
        }).populate("lastWatchedLesson", "title duration");

        const completedCount = progress
          ? await Lesson.countDocuments({
              ...lessonFilter,
              _id: { $in: progress.completedLessons },
            })
          : 0;

        const completionPercentage =
          totalLessons === 0
            ? 0
            : Math.round((completedCount / totalLessons) * 100);

        return res.json({
          success: true,
          course: {
            id: course._id,
            title: course.title,
          },
          isEnrolled,
          progress: {
            completedCount,
            totalLessons,
            completionPercentage,
            completedLessons: progress
              ? progress.completedLessons
              : [],
            lastWatchedLesson: progress
              ? progress.lastWatchedLesson
              : null,
            lastWatchedAt: progress
              ? progress.lastWatchedAt
              : null,
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
