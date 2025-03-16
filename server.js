import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // Required for __dirname alternative

// __dirname workaround for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Function to load USERS.json dynamically
const getUsers = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'src/data/USERS.json'), 'utf-8');
    console.log(data)
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading USERS.json:', error);
    return null;
  }
};

// Route to send OTP with role-based verification
app.post('/send-OTP', (req, res) => {
  const { email, otp, role } = req.body; // Extract role from request

  if (!email || !otp || !role) {
    return res.status(400).json({ message: 'Email, role, and OTP are required.' });
  }

  // Load user data
  const users = getUsers();
  if (!users) {
    return res.status(500).json({ message: 'Error loading user data' });
  }

  const isEmployee = users.employees.includes(email);
  const isAdmin = users.admins.includes(email);

  // Check role-based access
  if (role === 'employee' && !isEmployee) {
    return res.status(403).json({ message: 'Access denied: You are not registered as an employee.' });
  }

  if (role === 'admin' && !isAdmin && !isEmployee) {
    return res.status(403).json({ message: 'Access denied: You are not registered as an admin.' });
  }

  // Construct command to run Python script
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
    res.json({ success: true, message: 'OTP sent successfully' });
  });
});

// Route to fetch USERS.json for frontend role validation
app.get('/get-users', (req, res) => {
  const users = getUsers();
  if (!users) {
    return res.status(500).json({ message: 'Error loading user data' });
  }
  console.log(users)
  res.json(users);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
