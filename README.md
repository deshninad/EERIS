# EERIS – Expense Entry and Reimbursement Information System

EERIS is a full-stack web application designed for student organizations to streamline expense reporting and reimbursement workflows. It allows members to upload receipts, track the status of their submissions, and export reports, while administrators can manage users, approve expenses, and analyze organizational spending trends — all through a unified interface.

---

## 🚀 Features

- 🔐 OTP-based secure login system
- 📤 Receipt upload and expense submission
- 📊 Admin dashboard with expense analytics
- 🧾 PDF export of individual and filtered reports
- 📁 Role-based access control for members and admins
- 📬 Email notifications using custom SMTP
- 💡 Built-in rate limiting and OpenAI integration (e.g., receipt classification)

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express.js
- **Database:** JSON file-based storage (can be extended to MongoDB)
- **Auth & Email:** Custom OTP with nodemailer and SMTP
- **AI Integration:** OpenAI API (optional)

---

## ⚙️ Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/EERIS.git
cd EERIS
```

### 2. Install Dependencies

Make sure `node.js` and `npm` are installed.

```bash
node -v
npm -v
npm install
```

### 3. Run the Development Servers

- For the frontend (Vite):

```bash
npm run dev
```

- For the backend (OTP and receipt processing):

```bash
node server.js
```

---

## 🔐 Environment Configuration

Create a `.env` file inside the `/src/backend` directory (same level as `OTP_emailer.py`) with the following variables:

```
EMAIL_ADDRESS="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
OPENAI_API_KEY="your-openai-api-key"
```

> 🔒 **Note:** Only Gmail accounts with App Passwords (not regular passwords) are supported. Visit [this guide](https://support.google.com/mail/answer/185833?hl=en) to set up an app password. Emails with 2FA enabled must use this method.

---

## 📂 Project Structure

```
EERIS/
├── src/
│   ├── backend/
│   │   ├── OTP_emailer.py
│   │   ├── server.js
│   │   └── ... 
│   └── frontend/
│       ├── components/
│       ├── pages/
│       └── ...
├── .env
└── package.json
```

---


## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📫 Contact

Built with 💻 by [Ninad Deshpande](mailto:ndeshpande2@usf.edu)
