
const mongoose = require("mongoose");
const Skill = require("../../models/Skill");
const adminAuth = require("../../middleware/adminAuth");

module.exports = (server) => {

  // CREATE SKILL
  server.post("/api/admin/skills", adminAuth, async (req, res) => {
    try {
      const { name, slug, description, thumbnail, displayOrder } = req.body;

      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message: "Skill name and slug are required",
        });
      }

      const normalizedSlug = slug.trim().toLowerCase();

      const existing = await Skill.findOne({
        $or: [
          { name: name.trim() },
          { slug: normalizedSlug },
        ],
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Skill name or slug already exists",
        });
      }

      const skill = await Skill.create({
        name,
        slug: normalizedSlug,
        description,
        thumbnail,
        displayOrder,
      });

      res.status(201).json({
        success: true,
        message: "Skill created successfully",
        skill,
      });

    } catch (error) {
      console.error("Create Skill:", error);

      res.status(500).json({
        success: false,
        message: "Unable to create skill",
      });
    }
  });


  // GET ALL SKILLS
  server.get("/api/admin/skills", adminAuth, async (req, res) => {
    try {
      const skills = await Skill.find()
        .sort({ displayOrder: 1, createdAt: -1 });

      res.json({
        success: true,
        total: skills.length,
        skills,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to fetch skills",
      });
    }
  });


  // GET SINGLE SKILL
  server.get("/api/admin/skills/:id", adminAuth, async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid skill ID",
        });
      }

      const skill = await Skill.findById(req.params.id);

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found",
        });
      }

      res.json({
        success: true,
        skill,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to fetch skill",
      });
    }
  });


  // UPDATE SKILL
  server.put("/api/admin/skills/:id", adminAuth, async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid skill ID",
        });
      }

      const { name, slug, description, thumbnail, displayOrder, isActive } = req.body;

      const skill = await Skill.findById(req.params.id);

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found",
        });
      }

      if (name !== undefined) skill.name = name.trim();
      if (slug !== undefined) skill.slug = slug.trim().toLowerCase();
      if (description !== undefined) skill.description = description;
      if (thumbnail !== undefined) skill.thumbnail = thumbnail;
      if (displayOrder !== undefined) skill.displayOrder = displayOrder;
      if (isActive !== undefined) skill.isActive = isActive;

      const duplicate = await Skill.findOne({
        _id: { $ne: skill._id },
        $or: [
          { name: skill.name },
          { slug: skill.slug },
        ],
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Skill name or slug already exists",
        });
      }

      await skill.save();

      res.json({
        success: true,
        message: "Skill updated successfully",
        skill,
      });

    } catch (error) {
      console.error("Update Skill:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update skill",
      });
    }
  });


  // DELETE SKILL
  server.delete("/api/admin/skills/:id", adminAuth, async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid skill ID",
        });
      }

      const skill = await Skill.findByIdAndDelete(req.params.id);

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Skill not found",
        });
      }

      res.json({
        success: true,
        message: "Skill deleted successfully",
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to delete skill",
      });
    }
  });

};
