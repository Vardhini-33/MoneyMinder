import express from "express";
import multer from "multer";
import fs from "fs";
import csvParser from "csv-parser";
import Transaction from "../models/Transaction.js";
import { verifyToken, verifyUserParam } from "../middleware/auth.js";
import { predictCategory } from "../utils/predictCategory.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.use(verifyToken, verifyUserParam);

// Add transaction. If category is omitted, Gemini/keyword fallback categorizes it.
router.post("/:userId", async (req, res) => {
  try {
    const { description, date, amount, type, category: providedCategory } = req.body;

    if (!description || amount === undefined || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const category = providedCategory || (await predictCategory(description));

    const transaction = await Transaction.create({
      userId: req.userId,
      description,
      category,
      date: date || new Date(),
      type,
      amount: Number(amount),
    });

    res.json({ message: "Transaction added", transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding transaction" });
  }
});

// Get all transactions belonging to the authenticated user.
router.get("/:userId", async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

// CSV upload with server-side categorization.
router.post("/:userId/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!filePath) return res.status(400).json({ message: "No file uploaded" });

    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        try {
          const processed = await Promise.all(
            rows.map(async (r) => {
              const desc = r.description || r.Details || r.Description || "";
              const rawAmount = Number(r.amount || r.Amount || r.AMT || 0);
              const type = r.type || (rawAmount < 0 ? "Expense" : "Income");
              const category = r.category || (await predictCategory(desc));
              const date = r.date || r.Date || new Date();

              return {
                userId: req.userId,
                description: desc,
                date: new Date(date),
                type,
                amount: Math.abs(rawAmount),
                category,
              };
            })
          );

          await Transaction.insertMany(processed);
          res.json({ message: "CSV uploaded successfully", count: processed.length });
        } catch (err) {
          console.error("CSV processing error:", err);
          res.status(500).json({ message: "CSV processing failed" });
        } finally {
          try { fs.unlinkSync(filePath); } catch {}
        }
      })
      .on("error", (err) => {
        try { fs.unlinkSync(filePath); } catch {}
        console.error("CSV read error:", err);
        res.status(500).json({ message: "CSV upload failed" });
      });
  } catch (err) {
    try { if (filePath) fs.unlinkSync(filePath); } catch {}
    console.error(err);
    res.status(500).json({ message: "CSV upload failed" });
  }
});

export default router;
