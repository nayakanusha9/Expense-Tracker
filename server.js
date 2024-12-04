const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());

// In-memory storage
let expenses = [];

// Predefined expense categories
const categories = ["Food", "Travel", "Utilities", "Shopping", "Health", "Other"];

// Helper function for validation
const validateExpense = (expense) => {
    if (!expense.category || !categories.includes(expense.category)) {
        return "Invalid category.";
    }
    if (!expense.amount || typeof expense.amount !== "number" || expense.amount <= 0) {
        return "Amount must be a positive number.";
    }
    if (!expense.date || isNaN(new Date(expense.date))) {
        return "Invalid date.";
    }
    return null;
};

// 1. Add Expense (POST /expenses)
app.post('/expenses', (req, res) => {
    const { category, amount, date } = req.body;
    const error = validateExpense({ category, amount, date });

    if (error) {
        return res.status(400).json({ status: "error", error });
    }

    const expense = { id: expenses.length + 1, category, amount, date: new Date(date) };
    expenses.push(expense);
    res.json({ status: "success", data: expense });
});

// 2. Get Expenses (GET /expenses)
app.get('/expenses', (req, res) => {
    const { category, startDate, endDate } = req.query;
    let filteredExpenses = expenses;

    if (category) {
        filteredExpenses = filteredExpenses.filter((e) => e.category === category);
    }
    if (startDate) {
        filteredExpenses = filteredExpenses.filter((e) => new Date(e.date) >= new Date(startDate));
    }
    if (endDate) {
        filteredExpenses = filteredExpenses.filter((e) => new Date(e.date) <= new Date(endDate));
    }

    res.json({ status: "success", data: filteredExpenses });
});

// 3. Analyze Spending (GET /expenses/analysis)
app.get('/expenses/analysis', (req, res) => {
    const totalByCategory = categories.reduce((acc, category) => {
        acc[category] = expenses
            .filter((e) => e.category === category)
            .reduce((sum, e) => sum + e.amount, 0);
        return acc;
    }, {});

    res.json({ status: "success", data: totalByCategory });
});

// 4. Generate Summary (CRON job)
cron.schedule('0 0 * * *', () => {
    console.log("Generating daily expense summary...");
    const today = new Date().toISOString().split("T")[0];
    const dailyExpenses = expenses.filter(
        (e) => e.date.toISOString().split("T")[0] === today
    );
    console.log(`Daily summary: ${JSON.stringify(dailyExpenses)}`);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Expense Tracker API running on http://localhost:${PORT}`);
});
