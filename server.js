// server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { exec } from 'child_process'; // Ensure this is imported
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- IMPORTANT: Verify these paths are correct relative to where server.js runs ---
const USERS_FILE   = path.join(__dirname, 'src/data/USERS.json');
const EXPENSES_FILE = path.join(__dirname, 'src/data/data.json');
const PYTHON_SCRIPT = path.join(__dirname, 'src/backend/OTP_emailer.py');
// ----------------------------------------------------------------------------------

// === HELPER FUNCTIONS ===
function readJSON(file) {
  try {
    if (!fs.existsSync(file)) {
        console.warn(`File not found: ${file}. Returning default structure.`);
        if (file === USERS_FILE) return { employees: [], admins: [] };
        if (file === EXPENSES_FILE) return [];
        return {};
    }
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (error) {
      console.error(`Error reading JSON file ${file}:`, error);
      if (file === USERS_FILE) return { employees: [], admins: [] };
      if (file === EXPENSES_FILE) return [];
      throw error; // Re-throw to be caught by endpoint handler
  }
}

function writeJSON(file, data) {
   try {
       // Optional: Ensure directory exists before writing
       // fs.mkdirSync(path.dirname(file), { recursive: true });
       fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
   } catch (error) {
       console.error(`Error writing JSON file ${file}:`, error);
       throw error; // Allow endpoint handler to catch
   }
}

// --- Added missing helper functions ---
function getUsers() {
    return readJSON(USERS_FILE);
}

function saveUsers(users) {
    // Optional: Add validation before saving if needed
    writeJSON(USERS_FILE, users);
}
// ---------------------------------------

// === API ENDPOINTS ===

// --- OTP ---
app.post('/send-OTP', (req, res) => {
    console.log("Received /send-OTP request:", req.body);
    const { email, otp, role } = req.body;

    if (!email || !otp || !role) { console.error("Missing data in /send-OTP"); return res.status(400).json({ success: false, message: 'Email, role and OTP required.' }); }
    if (!email.includes('@')) { console.error("Invalid email format:", email); return res.status(400).json({ success: false, message: 'Invalid email format.' }); }

    try {
        const users = getUsers();
        const isEmp = users.employees?.includes(email); // Use optional chaining
        const isAdm = users.admins?.includes(email);

        if (role === 'employee' && !isEmp) { console.warn(`OTP Denied: ${email} not employee.`); return res.status(403).json({ success: false, message: 'Not registered as employee.' }); }
        if (role === 'admin' && !isAdm) { console.warn(`OTP Denied: ${email} not admin.`); return res.status(403).json({ success: false, message: 'Not registered for admin access.' }); }
        console.log(`Role check passed for ${email} as ${role}`);

        // Execute Python Script
        const command = `python3 "${PYTHON_SCRIPT}" "${email}" "${otp}"`; // Use path variable, quote args
        console.log(`Executing command: ${command}`);

        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error executing Python script: ${err.message}`);
                // Don't send detailed error to client
                return res.status(500).json({ success: false, message: 'Server error: Failed to send OTP.' });
            }
            if (stderr) {
                // Log Python script errors but might still succeed depending on script logic
                console.error(`Python script stderr: ${stderr}`);
            }
            console.log(`Python script stdout: ${stdout}`);
            console.log(`OTP successfully processed for ${email}`);
            // Assume script success if no error thrown by exec
            res.json({ success: true, message: 'OTP sent.' });
        });

    } catch (readErr) {
        console.error("Error reading users file during OTP check:", readErr);
        res.status(500).json({ success: false, message: 'Server error checking user roles.' });
    }
});

// --- USERS ---
app.get('/get-users', (req, res) => { try { res.json(getUsers()); } catch (err){ res.status(500).json({ message: 'Cannot load users.' }); } });
app.post('/add-user', (req, res) => { try { const { email, role } = req.body; if (!email || !email.includes('@') || !role) return res.status(400).json({ message: 'Valid email and role required.' }); if (role !== 'admin' && role !== 'employee') return res.status(400).json({ message: 'Role must be admin or employee.' }); const users = getUsers(); const list = role + 's'; if (users[list]?.includes(email)) { return res.status(409).json({ message: `User already exists as ${role}.` }); } users[list] = users[list] || []; users[list].push(email); saveUsers(users); res.json({ success: true, message: `${email} added as ${role}` }); } catch (err) { console.error("Add user error:", err); res.status(500).json({ message: "Failed to add user."}); } });
app.post('/update-user', (req, res) => { try { const { email, newRole } = req.body; if (!email || !newRole) return res.status(400).json({ message: 'Email and newRole required.' }); if (newRole !== 'admin' && newRole !== 'employee') return res.status(400).json({ message: 'Invalid role' }); let users = getUsers(); users.employees = (users.employees || []).filter(e => e !== email); users.admins = (users.admins || []).filter(a => a !== email); const list = newRole + 's'; users[list] = users[list] || []; if (!users[list].includes(email)) { users[list].push(email); } saveUsers(users); res.json({ success: true }); } catch (err) { console.error("Update user error:", err); res.status(500).json({ message: "Failed to update user role."}); } });
app.post('/delete-user', (req, res) => { try { const { email } = req.body; if (!email) return res.status(400).json({ message: 'Email required.' }); let users = getUsers(); const initialEmployeeCount = (users.employees || []).length; const initialAdminCount = (users.admins || []).length; users.employees = (users.employees || []).filter(e => e !== email); users.admins = (users.admins || []).filter(a => a !== email); const finalEmployeeCount = (users.employees || []).length; const finalAdminCount = (users.admins || []).length; if (initialEmployeeCount === finalEmployeeCount && initialAdminCount === finalAdminCount) { console.log(`User ${email} not found for deletion.`); } saveUsers(users); res.json({ success: true }); } catch (err) { console.error("Delete user error:", err); res.status(500).json({ message: "Failed to delete user."}); } });

// --- EXPENSES ---
app.get('/get-expenses', (req, res) => { const file = EXPENSES_FILE; try { if (!fs.existsSync(file)) { console.error('[get-expenses] file does not exist:', file); return res.status(500).json({ error: 'Expenses file missing' }); } const data = readJSON(file); return res.json(data); } catch (err) { console.error('[get-expenses] error reading file:', err); return res.status(500).json({ error: 'Failed to load expenses' }); } });
app.post('/update-expense', (req, res) => { try { const { expenseId, field, newValue } = req.body; if (expenseId === undefined || field === undefined || newValue === undefined) { return res.status(400).json({ message: 'Missing required fields' }); } const exps = readJSON(EXPENSES_FILE); const idx = exps.findIndex(e => e.id === expenseId); if (idx === -1) return res.status(404).json({ message: 'Expense not found.' }); exps[idx][field] = (field === 'amount') ? (parseFloat(newValue) || 0) : newValue; writeJSON(EXPENSES_FILE, exps); res.json({ success: true }); } catch (err) { console.error("Update expense error:", err); res.status(500).json({ message: "Failed to update expense."}); } });
app.post('/delete-expense', (req, res) => { try { const { expenseId } = req.body; if (expenseId === undefined) return res.status(400).json({ message: 'expenseId required.' }); let exps = readJSON(EXPENSES_FILE); const initialLength = exps.length; exps = exps.filter(e => e.id !== expenseId); if (exps.length === initialLength) { console.log(`Expense ID ${expenseId} not found for deletion.`); } writeJSON(EXPENSES_FILE, exps); res.json({ success: true }); } catch (err) { console.error("Delete expense error:", err); res.status(500).json({ message: "Failed to delete expense."}); } });

// --- Server Start ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

