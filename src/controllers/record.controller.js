import { Record } from "../models/record.model.js";

export const createRecord = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    if (!amount || !type || !category || !date) {
      return res.status(400).json({
        success: false,
        message: "Amount, type, category and date are required"
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be income or expense"
      });
    }

    const record = await Record.create({
      amount,
      type,
      category: category.toLowerCase(),
      date,
      notes,
      createdBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: "Record created successfully",
      record
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getRecords = async (req, res) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = "date",
      order = "desc",
    } = req.query;

    let filter = {};

    if (type) {
      filter.type = type.toLowerCase();
    }

    if (category) {
      filter.category = category.toLowerCase().trim();
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { category: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNumber - 1) * limitNumber;

    const allowedSortFields = ["date", "amount", "category"];
    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "date";

    const sortOrder = order === "asc" ? 1 : -1;

    const records = await Record.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limitNumber);

    const totalRecords = await Record.countDocuments(filter);

    return res.status(200).json({
      success: true,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalRecords / limitNumber),
      totalRecords,
      count: records.length,
      records,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await Record.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    const { amount, type, category, date, notes } = req.body;
    const allowedUpdates = {};
    if (amount !== undefined) allowedUpdates.amount = amount;
    if (type !== undefined) allowedUpdates.type = type;
    if (category !== undefined) allowedUpdates.category = category.toLowerCase();
    if (date !== undefined) allowedUpdates.date = date;
    if (notes !== undefined) allowedUpdates.notes = notes;

    const updated = await Record.findByIdAndUpdate(id, allowedUpdates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({ success: true, message: "Record updated successfully", data: updated });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await Record.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    await Record.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Record deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting record",
      error: error.message,
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const result = await Record.aggregate([
      { $match: matchStage },

      {
        $facet: {

          stats: [
            {
              $group: {
                _id: "$type",
                total: { $sum: "$amount" },
              },
            },
          ],

          categoryBreakdown: [
            {
              $group: {
                _id: {
                  category: "$category",
                  type: "$type",
                },
                total: { $sum: "$amount" },
              },
            },
            { $sort: { total: -1 } },
          ],

          monthlyData: [
            {
              $group: {
                _id: {
                  year: { $year: "$date" },
                  month: { $month: "$date" },
                  type: "$type",
                },
                total: { $sum: "$amount" },
              },
            },
            {
              $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                type: "$_id.type",
                total: 1,
              },
            },
            {
              $sort: {
                year: 1,
                month: 1,
              },
            },
          ],
        },
      },
    ]);

    const stats = result[0]?.stats || [];

    let totalIncome = 0;
    let totalExpense = 0;

    stats.forEach((item) => {
      if (item._id === "income") totalIncome = item.total;
      if (item._id === "expense") totalExpense = item.total;
    });

    const balance = totalIncome - totalExpense;

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          balance,
        },
        categoryBreakdown: result[0]?.categoryBreakdown || [],
        monthlyData: result[0]?.monthlyData || [],
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};