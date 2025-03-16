# React + Vite

Basic Setup:
In terminal, ensure node.js and npm are installed:
node -v
npm -v
npm install

Then, to run the vite server, use npm run dev
To run .js server, use node server.js

A .env file is needed **in the format below** for email access. Must be in backend, same directory level as OTP_emailer.py. Need an app password from gmail, search online on how to, to use here. No other email can be used which has 2FA, which is almost all of them.:

EMAIL_ADDRESS="xxxxx@gmail.com"
EMAIL_PASSWORD="xxxxxx"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
