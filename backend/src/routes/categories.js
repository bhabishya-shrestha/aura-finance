const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { protect } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// @desc    Get all categories for user
// @route   GET /api/categories
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        color,
        icon,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    const category = await prisma.category.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id: req.params.id,
      },
      data: {
        name,
        color,
        icon,
      },
    });

    res.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const category = await prisma.category.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete default category",
      });
    }

    // Update transactions to remove category reference
    await prisma.transaction.updateMany({
      where: {
        categoryId: req.params.id,
      },
      data: {
        categoryId: null,
      },
    });

    await prisma.category.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

module.exports = router;
