import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  managerId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['new', 'viewed', 'approved'], default: 'new' },
  category: { type: String },
  fileUrl: { type: String },
  date: { type: Date, default: Date.now },
});

export default mongoose.model('Receipt', receiptSchema);
