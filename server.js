// server.js (FINAL MERGED + ACCURATE PARSING)

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, execFile } from 'child_process';
import dotenv from 'dotenv';
import Tesseract from 'tesseract.js';
import OpenAI from 'openai';


dotenv.config({ path: './src/backend/.env' });
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const upload         = multer({ dest: 'uploads/' });
const openai         = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === CORS Configuration ===
// Allow requests only from your Vite frontend origin
const corsOptions = {
  origin: 'http://localhost:5173', // Adjust if your frontend runs on a different port
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(cors({ origin: 'http://localhost:5173' }));
// =========================

app.use(bodyParser.json());

// ─── File paths ─────────────────────────────────────────────────
const USERS_FILE    = path.join(__dirname, 'src/data/USERS.json');
const EXPENSES_FILE = path.join(__dirname, 'src/data/data.json');
const PYTHON_SCRIPT = path.join(__dirname, 'src/backend/OTP_emailer.py');

// ─── Helpers ────────────────────────────────────────────────────
function readJSON(file) {
  if (!fs.existsSync(file)) {
    return file === USERS_FILE ? { employees: [], admins: [] } : [];
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function getUsers() {
  return readJSON(USERS_FILE);
}

function saveUsers(u) {
  writeJSON(USERS_FILE, u);
}

// ─── OTP endpoint ───────────────────────────────────────────────
app.post('/send-OTP', (req, res) => {
  // more try catch blocks
  try {
    const { email, otp, role } = req.body;
    if (!email || !otp || !role) {
      return res.status(400).json({ message: 'Missing fields.' });
    }

    const users = getUsers();
    const authorized =
      (role === 'employee' && users.employees.includes(email)) ||
      (role === 'admin'    && users.admins.includes(email));

    if (!authorized) {
      return res.status(403).json({ message: 'Not registered for this role.' });
    }

    // Execute Python script
    const command = `python3 "${PYTHON_SCRIPT}" "${email}" "${otp}"`;
    console.log(`Executing command: ${command}`);
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error executing Python script: ${err.message}`);
        return res.status(500).json({
          success: false,
          message: 'Server error: Failed to send OTP.'
        });
      }
      if (stderr) {
        console.warn(`Python script stderr: ${stderr.trim()}`);
      }
      console.log(`Python script stdout: ${stdout.trim()}`);
      return res.json({ success: true, message: 'OTP sent.' });
    });

  } catch (readErr) {
    console.error('Error processing /send-OTP:', readErr);
    return res.status(500).json({
      success: false,
      message: 'Server error checking user roles.'
    });
  }
});

// ─── Users CRUD ─────────────────────────────────────────────────
app.get('/get-users', (req, res) => {
  return res.json(getUsers());
});

app.post('/add-user', (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ message: 'Missing fields.' });
  }
  const u = getUsers();
  u[role + 's'] = u[role + 's'] || [];
  u[role + 's'].push(email);
  saveUsers(u);
  return res.json({ success: true });
});

app.post('/update-user', (req, res) => {
  const { email, newRole } = req.body;
  if (!email || !newRole) {
    return res.status(400).json({ message: 'Missing fields.' });
  }
  let u = getUsers();
  u.employees = (u.employees || []).filter(e => e !== email);
  u.admins    = (u.admins    || []).filter(a => a !== email);
  u[newRole + 's'] = u[newRole + 's'] || [];
  u[newRole + 's'].push(email);
  saveUsers(u);
  return res.json({ success: true });
});

app.post('/delete-user', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Missing fields.' });
  }
  let u = getUsers();
  u.employees = (u.employees || []).filter(e => e !== email);
  u.admins    = (u.admins    || []).filter(a => a !== email);
  saveUsers(u);
  return res.json({ success: true });
});

// ─── Expenses CRUD ──────────────────────────────────────────────
app.get('/get-expenses', (req, res) => {
  return res.json(readJSON(EXPENSES_FILE));
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

// server.js
app.get('/health', (_, res) => res.sendStatus(200));   // replies 200 if server is alive


app.post('/delete-expense', (req, res) => {
  const { expenseId } = req.body;
  if (expenseId == null) {
    return res.status(400).json({ message: 'Missing fields.' });
  }
  let exps = readJSON(EXPENSES_FILE);
  exps     = exps.filter(e => e.id !== expenseId);
  writeJSON(EXPENSES_FILE, exps);
  return res.json({ success: true });
});

// ─── Upload Receipt + OCR + OpenAI Parse ────────────────────────
app.post('/upload-receipt', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // 1) OCR with Tesseract
    const filePath       = path.join(__dirname, req.file.path);
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
    fs.unlink(filePath, err => { if (err) console.error('Temp delete err:', err); });

    // 2) Extract via OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            `You are a JSON-only extractor. No code fences or markdown.\n` +
            `From the receipt text extract exactly these fields:\n` +
            `• vendor (string)\n` +
            `• date   (YYYY-MM-DD string)\n` +
            `• total  (decimal string, e.g. "78.90")`
        },
        { role: 'user', content: `Receipt Text:\n${text}` }
      ],
      temperature: 0
    });

    let raw   = completion.choices[0].message.content.trim();
    let clean = raw
      .replace(/^```json/, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    let parsed = {};
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error('AI JSON parse fail:', raw);
    }

    // 3) Fallbacks & normalization
    let vendor = parsed.vendor || '';
    let date   = parsed.date   || '';
    let total  = parsed.total  || '';

    // normalize date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const m = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      if (m) {
        const [mo, da, yr] = m[1].split('/');
        date = `${yr}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`;
      }
    }

    // normalize total
    if (!/^\d+(\.\d{2})$/.test(total)) {
      const m = text.match(/(?:Total\s*[:]?|\bEST\.\s*TOTAL AMOUNT US\$)\s*\$?([\d,]+\.?\d{2})/i);
      if (m) total = m[1];
    }

    return res.json({ vendor, date, total });
  } catch (err) {
    console.error('/upload-receipt error:', err);
    return res.status(500).json({ message: 'Server error parsing receipt.' });
  }
});


// ─── Create New Expense ─────────────────────────────────────────
app.post('/add-expense', (req, res) => {
  const exps = readJSON(EXPENSES_FILE);
  const newId = exps.length ? Math.max(...exps.map(e => e.id)) + 1 : 1;

  // pull the bits you care about from the body
  const { email, expenseType, category, date, total, name, notes } = req.body;

  const newExp = {
    id:       newId,
    email,
    expenseType,
    category,
    status:   'Pending',    // default for newly submitted// 
    amount:   parseFloat(total) || 0,
    name,
    date,
    notes:    notes || ''
  };

  exps.push(newExp);
  writeJSON(EXPENSES_FILE, exps);
  res.json(newExp);
});

// ─── Start Server ───────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
