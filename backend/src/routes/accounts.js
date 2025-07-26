const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { protect } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// @desc    Get all accounts for user
// @route   GET /api/accounts
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error("Get accounts error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get single account
// @route   GET /api/accounts/:id
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: {
        transactions: {
          take: 10,
          orderBy: {
            date: "desc",
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Account not found",
      });
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Get account error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Create account
// @route   POST /api/accounts
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { name, type, balance, currency } = req.body;

    const account = await prisma.account.create({
      data: {
        name,
        type,
        balance: parseFloat(balance) || 0,
        currency: currency || "USD",
        userId: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Create account error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, type, balance, currency, isActive } = req.body;

    const account = await prisma.account.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Account not found",
      });
    }

    const updatedAccount = await prisma.account.update({
      where: {
        id: req.params.id,
      },
      data: {
        name,
        type,
        balance: balance ? parseFloat(balance) : undefined,
        currency,
        isActive,
      },
    });

    res.json({
      success: true,
      data: updatedAccount,
    });
  } catch (error) {
    console.error("Update account error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Delete account
// @route   DELETE /api/accounts/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Account not found",
      });
    }

    // Soft delete by setting isActive to false
    await prisma.account.update({
      where: {
        id: req.params.id,
      },
      data: {
        isActive: false,
      },
    });

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

module.exports = router;
