const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { protect } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// @desc    Get all transactions for user
// @route   GET /api/transactions
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      accountId,
      categoryId,
      type,
      startDate,
      endDate,
    } = req.query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      userId: req.user.id,
    };

    if (accountId) where.accountId = accountId;
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const total = await prisma.transaction.count({ where });

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { date, description, amount, type, accountId, categoryId } = req.body;

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: req.user.id,
      },
    });

    if (!account) {
      return res.status(400).json({
        success: false,
        error: "Invalid account",
      });
    }

    // Verify category belongs to user (if provided)
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId: req.user.id,
        },
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          error: "Invalid category",
        });
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(date),
        description,
        amount: parseFloat(amount),
        type,
        accountId,
        categoryId,
        userId: req.user.id,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const { date, description, amount, type, accountId, categoryId } = req.body;

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    // Verify account belongs to user (if changing)
    if (accountId && accountId !== existingTransaction.accountId) {
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId: req.user.id,
        },
      });

      if (!account) {
        return res.status(400).json({
          success: false,
          error: "Invalid account",
        });
      }
    }

    // Verify category belongs to user (if provided)
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId: req.user.id,
        },
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          error: "Invalid category",
        });
      }
    }

    const transaction = await prisma.transaction.update({
      where: {
        id: req.params.id,
      },
      data: {
        date: date ? new Date(date) : undefined,
        description,
        amount: amount ? parseFloat(amount) : undefined,
        type,
        accountId,
        categoryId,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    await prisma.transaction.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

module.exports = router;
