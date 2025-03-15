import express from 'express';
// import dotenv from 'dotenv';
// import fs from 'fs';
// import connectDB from './config/db.js';
// import receiptRoutes from './routes/receiptRoutes.js';
// import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url'; // Required for __dirname alternative
//import db from './src/backend/db.js';


// __dirname workaround for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv.config();
// connectDB();

// app.use(express.json());
// app.use(cors());

// app.use('/api/receipts', receiptRoutes);
// app.use('/api/auth', authRoutes);


const app = express();
app.use(bodyParser.json());
app.use(cors());
// Route to send OTP
app.post('/send-OTP', (req, res) => {
  const { email, otp } = req.body; // Destructuring email and OTP from the request body

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  // Construct the command to run the Python script with email and OTP
  const command = `python src/backend/OTP_emailer.py ${email} ${otp}`;
  console.log('Executing command:', command);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Error executing script' });
    }
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
      return res.status(500).json({ success: false, message: 'Script error' });
    }
    console.log(`Script stdout: ${stdout}`);
    // Send success response when OTP is sent
    res.json({ success: true, message: 'OTP sent successfully' });
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
