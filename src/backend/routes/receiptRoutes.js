import express from 'express';
import Receipt from '../models/Receipt.js';

const router = express.Router();

// 📌 Add Receipt
router.post('/', async (req, res) => {
  try {
    const newReceipt = new Receipt(req.body);
    await newReceipt.save();
    res.status(201).json(newReceipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Get All Receipts
router.get('/', async (req, res) => {
  try {
    const receipts = await Receipt.find();
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
