
const mongoose = require("mongoose");
const Lesson = require("../../models/Lesson");
const Course = require("../../models/Course");
const adminAuth = require("../../middleware/adminAuth");

module.exports = (server) => {
  // CREATE LESSON
  server.post("/api/admin/lessons", adminAuth, async (req, res) => {
    try {
      const {
        title,
        description,
        course,
        youtubeVideoId,
        duration,
        isPreview,
        isPublished,
        displayOrder,
      } = req.body;

      if (!title || !course || !youtubeVideoId) {
        return res.status(400).json({
          success: false,
          message: "Title, course and YouTube video ID are required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(course)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID",
        });
      }

      if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeVideoId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid YouTube video ID",
        });
      }

      const courseExists = await Course.findById(course);

      if (!courseExists) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      const lesson = await Lesson.create({
        title,
        description,
        course,
        youtubeVideoId,
        duration: Number(duration) || 0,
        isPreview: isPreview === true,
        isPublished: isPublished === true,
        displayOrder: Number(displayOrder) || 0,
      });

      return res.status(201).json({
        success: true,
        message: "Lesson created successfully",
        lesson,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET LESSONS BY COURSE
  server.get(
    "/api/admin/courses/:courseId/lessons",
    adminAuth,
    async (req, res) => {
      try {
        const { courseId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid course ID",
          });
        }

        const lessons = await Lesson.find({ course: courseId })
          .sort({ displayOrder: 1, createdAt: 1 })
          .populate("course", "title slug");

        return res.json({
          success: true,
          count: lessons.length,
          lessons,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  );

  // GET SINGLE LESSON
  server.get("/api/admin/lessons/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lesson ID",
        });
      }

      const lesson = await Lesson.findById(id).populate(
        "course",
        "title slug"
      );

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Lesson not found",
        });
      }

      return res.json({
        success: true,
        lesson,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // UPDATE LESSON
  server.put("/api/admin/lessons/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lesson ID",
        });
      }

      const lesson = await Lesson.findById(id);

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Lesson not found",
        });
      }

      const {
        title,
        description,
        course,
        youtubeVideoId,
        duration,
        isPreview,
        isPublished,
        displayOrder,
      } = req.body;

      if (course !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(course)) {
          return res.status(400).json({
            success: false,
            message: "Invalid course ID",
          });
        }

        const courseExists = await Course.findById(course);

        if (!courseExists) {
          return res.status(404).json({
            success: false,
            message: "Course not found",
          });
        }

        lesson.course = course;
      }

      if (youtubeVideoId !== undefined) {
        if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeVideoId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid YouTube video ID",
          });
        }

        lesson.youtubeVideoId = youtubeVideoId;
      }

      if (title !== undefined) lesson.title = title;
      if (description !== undefined) lesson.description = description;

      if (duration !== undefined) {
        const parsedDuration = Number(duration);

        if (!Number.isFinite(parsedDuration) || parsedDuration < 0) {
          return res.status(400).json({
            success: false,
            message: "Duration must be a valid non-negative number",
          });
        }

        lesson.duration = parsedDuration;
      }

      if (isPreview !== undefined) {
        lesson.isPreview = isPreview === true;
      }

      if (isPublished !== undefined) {
        lesson.isPublished = isPublished === true;
      }

      if (displayOrder !== undefined) {
        lesson.displayOrder = Number(displayOrder) || 0;
      }

      await lesson.save();

      return res.json({
        success: true,
        message: "Lesson updated successfully",
        lesson,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // PUBLISH / UNPUBLISH LESSON
  server.patch(
    "/api/admin/lessons/:id/publish",
    adminAuth,
    async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid lesson ID",
          });
        }

        if (typeof req.body.isPublished !== "boolean") {
          return res.status(400).json({
            success: false,
            message: "isPublished must be true or false",
          });
        }

        const lesson = await Lesson.findByIdAndUpdate(
          id,
          { isPublished: req.body.isPublished },
          { new: true, runValidators: true }
        );

        if (!lesson) {
          return res.status(404).json({
            success: false,
            message: "Lesson not found",
          });
        }

        return res.json({
          success: true,
          message: "Lesson publish status updated",
          lesson,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  );

  // DELETE LESSON
  server.delete("/api/admin/lessons/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lesson ID",
        });
      }

      const lesson = await Lesson.findByIdAndDelete(id);

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Lesson not found",
        });
      }

      return res.json({
        success: true,
        message: "Lesson deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });
};
