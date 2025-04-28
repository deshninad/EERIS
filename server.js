// server.js
// Includes fixes for missing helper functions and improved error handling

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
// import { exec } from 'child_process'; // Ensure this is imported
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, execFile } from 'child_process';


const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
// === CORS Configuration ===
// Allow requests only from your Vite frontend origin
const corsOptions = {
  origin: 'http://localhost:5173', // Adjust if your frontend runs on a different port
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// =========================

app.use(bodyParser.json());

// --- File Paths (Verify these are correct relative to server.js) ---
const USERS_FILE   = path.join(__dirname, 'src/data/USERS.json');
const EXPENSES_FILE = path.join(__dirname, 'src/data/data.json');
const PYTHON_SCRIPT = path.join(__dirname, 'src/backend/OTP_emailer.py');
const PYTHON_VENV_EXECUTABLE = path.join(__dirname, '.venv/bin/python'); // Path to Python in venv (adjust for Windows/venv name)
// ------------------------------------------------------------------

// === HELPER FUNCTIONS ===
function readJSON(file) {
  try {
    if (!fs.existsSync(file)) {
        console.warn(`File not found: ${file}. Returning default structure.`);
        // Return a default structure if the file doesn't exist
        if (file === USERS_FILE) return { employees: [], admins: [] };
        if (file === EXPENSES_FILE) return [];
        return {}; // Default empty object for unknown files
    }
    const fileContent = fs.readFileSync(file, 'utf-8');
    return JSON.parse(fileContent); // Parse the content
  } catch (error) {
      console.error(`Error reading or parsing JSON file ${file}:`, error);
      // Return a default structure on error
      if (file === USERS_FILE) return { employees: [], admins: [] };
      if (file === EXPENSES_FILE) return [];
      // Re-throw other errors or return a specific error object
      throw new Error(`Failed to process file ${path.basename(file)}`);
  }
}

function writeJSON(file, data) {
   try {
       // Optional: Ensure directory exists before writing
       // fs.mkdirSync(path.dirname(file), { recursive: true });
       fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8'); // Added encoding
       console.log(`Successfully wrote to ${file}`);
   } catch (error) {
       console.error(`Error writing JSON file ${file}:`, error);
       throw error; // Allow endpoint handler to catch and respond
   }
}

// --- Added missing helper functions ---
function getUsers() {
    return readJSON(USERS_FILE);
}

function saveUsers(users) {
    // Optional: Add validation here to ensure users object has correct structure
    if (!users || !Array.isArray(users.employees) || !Array.isArray(users.admins)) {
        console.error("Attempted to save invalid users structure:", users);
        throw new Error("Invalid users data structure provided to saveUsers");
    }
    writeJSON(USERS_FILE, users);
}
// ---------------------------------------

// === API ENDPOINTS ===

// --- OTP ---
app.post('/send-OTP', (req, res) => {
    console.log("Received /send-OTP request:", req.body);
    const { email, otp, role } = req.body;

    // Validation
    if (!email || !otp || !role) { console.error("Missing data in /send-OTP"); return res.status(400).json({ success: false, message: 'Email, role and OTP required.' }); }
    if (!email.includes('@')) { console.error("Invalid email format:", email); return res.status(400).json({ success: false, message: 'Invalid email format.' }); }

    try {
        const users = getUsers(); // Use helper
        const isEmp = users.employees?.includes(email);
        const isAdm = users.admins?.includes(email);

        // Role Check
        if (role === 'employee' && !isEmp) { console.warn(`OTP Denied: ${email} not employee.`); return res.status(403).json({ success: false, message: 'Not registered as employee.' }); }
        if (role === 'admin' && !isAdm) { console.warn(`OTP Denied: ${email} not admin.`); return res.status(403).json({ success: false, message: 'Not registered for admin access.' }); }
        console.log(`Role check passed for ${email} as ${role}`);

        // Execute Python Script using venv python
        const command = `"python3" "${PYTHON_SCRIPT}" "${email}" "${otp}"`;
        console.log(`Executing command: ${command}`);

        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error executing Python script: ${err.message}`);
                return res.status(500).json({ success: false, message: 'Server error: Failed to execute OTP sender.' });
            }
            if (stderr) {
                console.error(`Python script stderr: ${stderr}`);
                // Consider if stderr should always indicate failure
            }
            console.log(`Python script stdout: ${stdout}`);
            console.log(`OTP successfully processed for ${email}`);
            res.json({ success: true, message: 'OTP sent.' }); // Send success back
        });

    } catch (readErr) {
        console.error("Error processing /send-OTP (likely reading users file):", readErr);
        res.status(500).json({ success: false, message: 'Server error checking user roles.' });
    }
});

// --- USERS ---
app.get('/get-users', (req, res) => {
  try {
    const usersData = getUsers(); // Calls readJSON which handles file not found/parse errors

    // Explicit check for the expected structure AFTER reading/defaulting
    if (!usersData || !Array.isArray(usersData.employees) || !Array.isArray(usersData.admins)) {
        console.error("Data read from USERS_FILE is not in the expected format:", usersData);
        return res.status(500).json({ message: 'Server error: Invalid user data structure.' });
    }

    // If structure is valid, send it
    res.json(usersData);

  } catch (err){
    // Catch any *other* unexpected errors during the process
    console.error("Unexpected error in /get-users endpoint:", err);
    res.status(500).json({ message: 'Server error: Cannot load users.' });
  }
});

app.post('/add-user', (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !email.includes('@') || !role) return res.status(400).json({ message: 'Valid email and role required.' });
    if (role !== 'admin' && role !== 'employee') return res.status(400).json({ message: 'Role must be admin or employee.' });

    const users = getUsers();
    const list = role + 's'; // 'admins' or 'employees'

    if (users[list]?.includes(email)) { return res.status(409).json({ message: `User already exists as ${role}.` }); }

    users[list] = users[list] || []; // Ensure array exists
    users[list].push(email);
    saveUsers(users); // Use helper
    res.json({ success: true, message: `${email} added as ${role}` });
  } catch (err) {
      console.error("Add user error:", err);
      res.status(500).json({ message: "Failed to add user."});
  }
});

app.post('/update-user', (req, res) => {
  try {
    const { email, newRole } = req.body;
    if (!email || !newRole) return res.status(400).json({ message: 'Email and newRole required.' });
    if (newRole !== 'admin' && newRole !== 'employee') return res.status(400).json({ message: 'Invalid role' });

    let users = getUsers(); // Use helper

    // Remove from both lists first
    users.employees = (users.employees || []).filter(e => e !== email);
    users.admins    = (users.admins || []).filter(a => a !== email);

    // Add to the correct new list
    const list = newRole + 's';
    users[list] = users[list] || []; // Ensure list exists
    if (!users[list].includes(email)) { users[list].push(email); }

    saveUsers(users); // Use helper
    res.json({ success: true });
  } catch (err) {
      console.error("Update user error:", err);
      res.status(500).json({ message: "Failed to update user role."});
  }
});

app.post('/delete-user', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required.' });

    let users = getUsers(); // Use helper

    const initialEmployeeCount = (users.employees || []).length;
    const initialAdminCount = (users.admins || []).length;
    users.employees = (users.employees || []).filter(e => e !== email);
    users.admins    = (users.admins || []).filter(a => a !== email);
    const finalEmployeeCount = (users.employees || []).length;
    const finalAdminCount = (users.admins || []).length;

    if (initialEmployeeCount === finalEmployeeCount && initialAdminCount === finalAdminCount) {
        console.log(`User ${email} not found for deletion.`);
        // Optionally return 404: return res.status(404).json({ message: 'User not found.' });
    }

    saveUsers(users); // Use helper
    res.json({ success: true });
   } catch (err) {
      console.error("Delete user error:", err);
      res.status(500).json({ message: "Failed to delete user."});
  }
});

// --- EXPENSES ---
app.get('/get-expenses', (req, res) => {
    const file = EXPENSES_FILE;
    console.log('[get-expenses] looking for file at:', file);
    try {
        if (!fs.existsSync(file)) { console.error('[get-expenses] file does not exist:', file); return res.status(500).json({ error: 'Expenses file missing' }); }
        const data = readJSON(file);
        console.log('[get-expenses] loaded', data.length, 'records');
        return res.json(data);
    } catch (err) {
        console.error('[get-expenses] error reading file:', err);
        return res.status(500).json({ error: 'Failed to load expenses' });
    }
});

app.post('/update-expense', (req, res) => {
  try {
    // 1) pull in comment
    const { expenseId, field, newValue, comment = '' } = req.body;
    if (
      expenseId === undefined ||
      field     === undefined ||
      newValue  === undefined
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 2) load & update JSON file
    const exps = readJSON(EXPENSES_FILE);
    const idx  = exps.findIndex(e => e.id === expenseId);
    if (idx === -1) {
      return res.status(404).json({ message: 'Expense not found.' });
    }
    exps[idx][field] = field === 'amount'
      ? (parseFloat(newValue) || 0)
      : newValue;

    // 3) write it back
    writeJSON(EXPENSES_FILE, exps);

    // 4) if status changed, fire off notification email
    if (field === 'status') {
      const exp     = exps[idx];
      const to      = exp.email;
      const subject = `Expense #${expenseId} — Status: ${newValue}`;
      const body    = [
        `Hello ${exp.name || exp.email},`,
        ``,
        `Your expense request (ID: ${expenseId}) has been updated to: "${newValue}".`,
        ``,
        comment ? `Admin’s note:\n${comment}\n` : '',
        `Thank you,`,
        `Finance Team`
      ].join('\n');

      const scriptPath = path.join(
        __dirname,
        'src', 'backend',
        'Notification_emailer.py'
      );

      // non-blocking; logs success/failure to your console
      execFile(
        'python3',
        [ scriptPath, to, subject, body ],
        { cwd: path.join(__dirname, 'src', 'backend') },
        (err, stdout, stderr) => {
          if (err) {
            console.error('📧 Notification error:', stderr || err);
          } else {
            console.log('📧 Notification sent:', stdout.trim());
          }
        }
      );
    }

    // 5) respond immediately
    return res.json({ success: true });
  }
  catch (err) {
    console.error('Update expense error:', err);
    return res.status(500).json({ message: 'Failed to update expense.' });
  }
});

app.post('/delete-expense', (req, res) => {
  try {
    const { expenseId } = req.body;
    if (expenseId === undefined) return res.status(400).json({ message: 'expenseId required.' });

    let exps = readJSON(EXPENSES_FILE);
    const initialLength = exps.length;
    exps = exps.filter(e => e.id !== expenseId);

    if (exps.length === initialLength) { console.log(`Expense ID ${expenseId} not found for deletion.`); }

    writeJSON(EXPENSES_FILE, exps);
    res.json({ success: true });
  } catch (err) {
      console.error("Delete expense error:", err);
      res.status(500).json({ message: "Failed to delete expense."});
  }
});


// --- Server Start ---
const PORT = process.env.PORT || 5001; // Ensure this port is free
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
