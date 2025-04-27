// server.js
// Includes OCR parsing, expense submission, user management,
// fetching expenses, and requesting clarification with optional note.

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer'; // For file uploads
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Basic Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const app = express();

// --- CORS Configuration ---
const corsOptions = {
  origin: 'http://localhost:5173', // Your frontend origin
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// --- Middleware ---
app.use(bodyParser.json()); // For parsing application/json

// Serve uploaded files statically
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true }); // Create uploads dir if not exists
}
app.use('/uploads', express.static(UPLOADS_DIR)); // Serve files from /uploads route

// --- File Paths ---
const USERS_FILE    = path.join(__dirname, 'src/data/USERS.json');
const EXPENSES_FILE = path.join(__dirname, 'src/data/data.json');
// Python Scripts & Executable (VERIFY THESE PATHS)
const OTP_SCRIPT    = path.join(__dirname, 'src/backend/OTP_emailer.py');
const PARSE_SCRIPT  = path.join(__dirname, 'src/backend/parse_receipt.py');
const CLARIFY_SCRIPT = path.join(__dirname, 'src/backend/clarification_emailer.py'); // Path to clarification script
const PYTHON_BIN    = path.join(__dirname, '.venv/bin/python3'); // Path to Python in venv (adjust if needed)

// === HELPER FUNCTIONS ===
function readJSON(file) {
  try {
    if (!fs.existsSync(file)) {
        console.warn(`File not found: ${file}. Returning default structure.`);
        if (file === USERS_FILE) return { employees: [], admins: [] };
        if (file === EXPENSES_FILE) return [];
        return {};
    }
    const fileContent = fs.readFileSync(file, 'utf-8');
    if (!fileContent) { // Handle empty file
        console.warn(`File is empty: ${file}. Returning default structure.`);
        if (file === USERS_FILE) return { employees: [], admins: [] };
        if (file === EXPENSES_FILE) return [];
        return {};
    }
    return JSON.parse(fileContent);
  } catch (error) {
      console.error(`Error reading or parsing JSON file ${file}:`, error);
      // Return default structure on error to prevent crashes
      if (file === USERS_FILE) return { employees: [], admins: [] };
      if (file === EXPENSES_FILE) return [];
      // Re-throw only if it's not a read/parse error we can handle with defaults
      throw new Error(`Failed to process file ${path.basename(file)}`);
  }
}

function writeJSON(file, data) {
   try {
       fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
       console.log(`Successfully wrote to ${file}`);
   } catch (error) {
       console.error(`Error writing JSON file ${file}:`, error);
       throw error; // Allow endpoint handler to catch and respond
   }
}

function getUsers() { return readJSON(USERS_FILE); }
function saveUsers(users) {
    if (!users || !Array.isArray(users.employees) || !Array.isArray(users.admins)) {
        console.error("Attempted to save invalid users structure:", users);
        throw new Error("Invalid users data structure provided to saveUsers");
    }
    writeJSON(USERS_FILE, users);
}

// === MULTER CONFIGURATION for File Uploads ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, UPLOADS_DIR); },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = path.parse(file.originalname);
    const uniqueFilename = `${originalName.name}-${timestamp}${originalName.ext}`;
    cb(null, uniqueFilename);
  }
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) { cb(null, true); }
  else { cb(new Error('Invalid file type. Only JPG, PNG, PDF allowed.'), false); }
};
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: fileFilter });
// Middleware to handle potential multer errors
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error("Multer Error:", err.message);
        return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
    } else if (err) {
        console.error("File Upload Error:", err.message);
        return res.status(400).json({ success: false, message: err.message || "File upload failed." });
    }
    next(); // Proceed if no error
};


// === API ENDPOINTS ===

// --- OTP ---
app.post('/send-OTP', (req, res) => {
    console.log("Received /send-OTP request:", req.body);
    const { email, otp, role } = req.body;
    if (!email || !otp || !role) { return res.status(400).json({ success: false, message: 'Email, role and OTP required.' }); }
    if (!email.includes('@')) { return res.status(400).json({ success: false, message: 'Invalid email format.' }); }
    try {
        const users = getUsers();
        const isEmp = users.employees?.includes(email);
        const isAdm = users.admins?.includes(email);
        if (role === 'employee' && !isEmp) { return res.status(403).json({ success: false, message: 'Not registered as employee.' }); }
        if (role === 'admin' && !isAdm) { return res.status(403).json({ success: false, message: 'Not registered for admin access.' }); }

        if (!fs.existsSync(OTP_SCRIPT)) {
             console.error(`OTP script not found at: ${OTP_SCRIPT}`);
             return res.status(500).json({ success: false, message: "Server configuration error: OTP script missing." });
        }
        if (!fs.existsSync(PYTHON_BIN)) {
             console.error(`Python executable not found at: ${PYTHON_BIN}`);
             return res.status(500).json({ success: false, message: "Server configuration error: Python executable missing." });
        }

        const command = `"${PYTHON_BIN}" "${OTP_SCRIPT}" "${email}" "${otp}"`;
        console.log(`Executing command: ${command}`);
        exec(command, (err, stdout, stderr) => {
            if (err) { console.error(`Error executing Python script: ${err.message}`); return res.status(500).json({ success: false, message: 'Server error: Failed to execute OTP sender.' }); }
            if (stderr) { console.error(`Python script stderr: ${stderr}`); }
            console.log(`Python script stdout: ${stdout}`);
            res.json({ success: true, message: 'OTP sent.' });
        });
    } catch (readErr) {
        console.error("Error processing /send-OTP:", readErr);
        res.status(500).json({ success: false, message: 'Server error checking user roles.' });
    }
});

// --- USERS ---
app.get('/get-users', (req, res) => {
  try {
    const usersData = getUsers();
    if (!usersData || !Array.isArray(usersData.employees) || !Array.isArray(usersData.admins)) {
        console.error("Data read from USERS_FILE is not in the expected format:", usersData);
        return res.status(500).json({ message: 'Server error: Invalid user data structure.' });
    }
    res.json(usersData);
  } catch (err){
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
    const list = role + 's';
    if (users[list]?.includes(email)) { return res.status(409).json({ message: `User already exists as ${role}.` }); }
    users[list] = users[list] || [];
    users[list].push(email);
    saveUsers(users);
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
    let users = getUsers();
    users.employees = (users.employees || []).filter(e => e !== email);
    users.admins    = (users.admins || []).filter(a => a !== email);
    const list = newRole + 's';
    users[list] = users[list] || [];
    if (!users[list].includes(email)) { users[list].push(email); }
    saveUsers(users);
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
    let users = getUsers();
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
    saveUsers(users);
    res.json({ success: true });
   } catch (err) {
      console.error("Delete user error:", err);
      res.status(500).json({ message: "Failed to delete user."});
   }
});


// --- Receipt Parsing Endpoint ---
app.post('/parse-receipt', upload.single('receiptFile'), handleUploadError, (req, res) => {
    console.log("Received /parse-receipt request");
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No receipt file was uploaded.' });
    }
    const uploadedFilePath = req.file.path;
    console.log(`File uploaded for parsing: ${uploadedFilePath}`);

    if (!fs.existsSync(PARSE_SCRIPT)) {
        console.error(`Parse script not found at: ${PARSE_SCRIPT}`);
        fs.unlink(uploadedFilePath, (unlinkErr) => { if (unlinkErr) console.error(`Error deleting temp file: ${unlinkErr}`); });
        return res.status(500).json({ success: false, message: "Server configuration error: Parsing script missing." });
    }
     if (!fs.existsSync(PYTHON_BIN)) {
        console.error(`Python executable not found at: ${PYTHON_BIN}`);
        fs.unlink(uploadedFilePath, (unlinkErr) => { if (unlinkErr) console.error(`Error deleting temp file: ${unlinkErr}`); });
        return res.status(500).json({ success: false, message: "Server configuration error: Python executable missing." });
    }

    const command = `"${PYTHON_BIN}" "${PARSE_SCRIPT}" "${uploadedFilePath}"`;
    console.log(`Executing parse command: ${command}`);

    exec(command, (error, stdout, stderr) => {
        fs.unlink(uploadedFilePath, (unlinkErr) => { // Delete temp file
            if (unlinkErr) console.error(`Error deleting temporary uploaded file ${uploadedFilePath}:`, unlinkErr);
            else console.log(`Successfully deleted temporary file: ${uploadedFilePath}`);
        });

        if (error) {
            console.error(`Error executing parse script: ${error.message}`);
            console.error(`Stderr from script (if any): ${stderr}`);
            return res.status(500).json({ success: false, message: 'Failed to parse receipt due to server error.' });
        }
        if (stderr) { console.warn(`Stderr from parse script: ${stderr}`); }
        console.log(`Stdout from parse script: ${stdout}`);

        try {
            const parsedData = JSON.parse(stdout);
            if (typeof parsedData !== 'object' || parsedData === null) { throw new Error("Parsed data is not a valid object."); }
            console.log("Successfully parsed receipt data:", parsedData);
            res.json({ success: true, parsed: parsedData });
        } catch (parseError) {
            console.error(`Failed to parse JSON output from script: ${parseError}`);
            console.error(`Original script output (stdout): ${stdout}`);
            res.status(500).json({ success: false, message: 'Parsing completed, but failed to read results.' });
        }
    });
});


// --- Expense Submission Endpoint ---
app.post('/submit-expense', upload.single('receiptFile'), handleUploadError, (req, res) => {
    console.log("Received /submit-expense request");
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Receipt file is required.' });
    }
    const { expenseType, notes, email, vendor, date, total } = req.body;

    if (!expenseType || !email || !vendor || !date || total === undefined) {
        console.error("Missing required fields for expense submission:", req.body);
        fs.unlink(req.file.path, (err) => { if (err) console.error(`Error deleting unused file ${req.file.path}:`, err); });
        return res.status(400).json({ success: false, message: 'Missing required expense information (Type, Email, Vendor, Date, Total).' });
    }

    const receiptUrl = `/uploads/${req.file.filename}`;
    console.log(`Expense file saved, accessible at URL: ${receiptUrl}`);

    try {
        const newExpense = {
            id: Date.now(), email: email, expenseType: expenseType, vendor: vendor,
            date: date, total: parseFloat(total) || 0, notes: notes || '',
            status: 'Pending', submittedAt: new Date().toISOString(), receiptUrl: receiptUrl,
        };
        const expenses = readJSON(EXPENSES_FILE);
        expenses.push(newExpense);
        writeJSON(EXPENSES_FILE, expenses);
        console.log("Expense successfully submitted and saved:", newExpense.id);
        res.status(201).json({ success: true, message: 'Expense submitted successfully.', expense: newExpense });
    } catch (error) {
        console.error("Error saving expense data:", error);
        fs.unlink(req.file.path, (err) => { if (err) console.error(`Error deleting file ${req.file.path} after save failure:`, err); });
        res.status(500).json({ success: false, message: 'Failed to save expense data due to server error.' });
    }
});


// --- EXPENSES CRUD ---
app.get('/get-expenses', (req, res) => {
    const file = EXPENSES_FILE;
    console.log('[get-expenses] looking for file at:', file);
    try {
        if (!fs.existsSync(file)) { return res.status(500).json({ error: 'Expenses file missing' }); }
        const data = readJSON(file);
        console.log('[get-expenses] loaded', data.length, 'records');
        return res.json(data);
    } catch (err) {
        console.error('[get-expenses] error reading file:', err);
        return res.status(500).json({ error: 'Failed to load expenses' });
    }
});

app.get('/get-expense/:expenseId', (req, res) => {
  const { expenseId } = req.params;
  console.log(`Received /get-expense request for ID: ${expenseId}`);
  try {
      const expenses = readJSON(EXPENSES_FILE);
      const expense = expenses.find(e => e.id.toString() === expenseId); // Compare as string
      if (!expense) {
          console.log(`Expense ID ${expenseId} not found.`);
          return res.status(404).json({ success: false, message: 'Expense not found.' });
      }
      console.log(`Found expense:`, expense.id);
      res.json({ success: true, expense: expense });
  } catch (error) {
      console.error(`Error fetching expense ${expenseId}:`, error);
      res.status(500).json({ success: false, message: 'Server error fetching expense details.' });
  }
});

app.post('/update-expense', (req, res) => {
  try {
    const { expenseId, field, newValue } = req.body;
    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Clarification Requested']; // Added new status
    if (field === 'status' && !validStatuses.includes(newValue)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    if (expenseId === undefined || field === undefined || newValue === undefined) { return res.status(400).json({ message: 'Missing required fields' }); }

    const exps = readJSON(EXPENSES_FILE);
    const idx = exps.findIndex(e => e.id.toString() === expenseId.toString());
    if (idx === -1) return res.status(404).json({ message: 'Expense not found.' });

    exps[idx][field] = (field === 'total') ? (parseFloat(newValue) || 0) : newValue; // Ensure total is number

    writeJSON(EXPENSES_FILE, exps);
    console.log(`Updated expense ${expenseId}, field ${field} to ${newValue}`);
    res.json({ success: true });
   } catch (err) {
      console.error("Update expense error:", err);
      res.status(500).json({ message: "Failed to update expense."});
   }
});

app.post('/delete-expense', (req, res) => {
  try {
    const { expenseId } = req.body;
    if (expenseId === undefined) return res.status(400).json({ message: 'expenseId required.' });

    let exps = readJSON(EXPENSES_FILE);
    const initialLength = exps.length;
    const expenseToDelete = exps.find(e => e.id.toString() === expenseId.toString());
    exps = exps.filter(e => e.id.toString() !== expenseId.toString());

    if (exps.length === initialLength) {
        console.log(`Expense ID ${expenseId} not found for deletion.`);
        return res.status(404).json({ message: 'Expense not found for deletion.' });
    }

    // Try deleting associated file
    if (expenseToDelete && expenseToDelete.receiptUrl) {
        const filename = path.basename(expenseToDelete.receiptUrl);
        const filePathToDelete = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePathToDelete)) {
            fs.unlink(filePathToDelete, (unlinkErr) => {
                if (unlinkErr) console.error(`Error deleting receipt file ${filePathToDelete}:`, unlinkErr);
                else console.log(`Successfully deleted receipt file ${filePathToDelete}`);
            });
        } else { console.warn(`Receipt file not found for deleted expense ${expenseId}: ${filePathToDelete}`); }
    }

    writeJSON(EXPENSES_FILE, exps);
    console.log(`Deleted expense ${expenseId}`);
    res.json({ success: true });
  } catch (err) {
      console.error("Delete expense error:", err);
      res.status(500).json({ message: "Failed to delete expense."});
  }
});


// --- Request Clarification Endpoint ---
app.post('/request-clarification/:expenseId', async (req, res) => {
    const { expenseId } = req.params;
    // --- Get optional note from request body ---
    const { clarificationNote } = req.body;
    // ---------------------------------------------

    console.log(`Received clarification request for expense ID: ${expenseId}. Note: "${clarificationNote || 'None'}"`);

    try {
        const expenses = readJSON(EXPENSES_FILE);
        const expenseIndex = expenses.findIndex(e => e.id.toString() === expenseId);
        if (expenseIndex === -1) {
            return res.status(404).json({ success: false, message: 'Expense not found.' });
        }
        const expense = expenses[expenseIndex];
        const employeeEmail = expense.email;
        if (!employeeEmail) {
             return res.status(500).json({ success: false, message: 'Cannot request clarification: Employee email missing.' });
        }

        // Update status
        expenses[expenseIndex].status = 'Clarification Requested';
        writeJSON(EXPENSES_FILE, expenses);
        console.log(`Expense ${expenseId} status updated to 'Clarification Requested'.`);

        // Trigger Email
        if (!fs.existsSync(CLARIFY_SCRIPT)) {
            console.error(`Clarification script not found at: ${CLARIFY_SCRIPT}`);
            return res.json({ success: true, message: 'Status updated, but failed to send email: Script missing.' });
        }
         if (!fs.existsSync(PYTHON_BIN)) {
            console.error(`Python executable not found at: ${PYTHON_BIN}`);
            return res.json({ success: true, message: 'Status updated, but failed to send email: Python executable missing.' });
        }

        const expenseDetails = `ID: ${expense.id}, Vendor: ${expense.vendor}, Date: ${expense.date}, Amount: ${expense.total}`;
        // --- Pass the note as a third argument ---
        const escapedNote = (clarificationNote || '').replace(/"/g, '\\"'); // Escape quotes
        const command = `"${PYTHON_BIN}" "${CLARIFY_SCRIPT}" "${employeeEmail}" "${expenseDetails}" "${escapedNote}"`;
        // ------------------------------------------
        console.log(`Executing clarification email command: ${command}`);
        exec(command, (error, stdout, stderr) => { // Execute async, don't wait
            if (error) { console.error(`Error executing clarification script for expense ${expenseId}: ${error.message}`); console.error(`Stderr (if any): ${stderr}`); }
            else { console.log(`Clarification email script stdout for expense ${expenseId}: ${stdout}`); if (stderr) { console.warn(`Clarification email script stderr for expense ${expenseId}: ${stderr}`); } }
        });

        res.json({ success: true, message: 'Clarification requested and status updated.' }); // Respond immediately
    } catch (error) {
        console.error(`Error processing clarification request for expense ${expenseId}:`, error);
        res.status(500).json({ success: false, message: 'Server error processing clarification request.' });
    }
});


// --- Server Start ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

