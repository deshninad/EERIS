import sys
import smtplib
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

load_dotenv()

def send_otp_email(email, otp):
    smtp_server = os.getenv("SMTP_SERVER")  # SMTP server
    port = int(os.getenv("SMTP_PORT"))  # SMTP port (converted to integer)
    user_email = os.getenv("EMAIL_ADDRESS")  # Email address
    password = os.getenv("EMAIL_PASSWORD")  # Email password

    # Ensure the environment variables are loaded correctly
    if not smtp_server or not port or not user_email or not password:
        print("Error: Missing environment variables.")
        sys.exit(1)

    subject = "Your OTP Code"
    body = f"Your OTP code is: {otp}.\n"
    body += "Please do not reply to this email. This inbox is not monitored."
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = user_email
    msg['To'] = email

    try:
        with smtplib.SMTP(smtp_server, port) as server:
            server.starttls()  # Upgrade the connection to secure
            server.login(user_email, password)  # Log in to the email server
            server.sendmail(user_email, email, msg.as_string())  # Send to recipient email
            print(f"Email sent to {email}")
    except Exception as e:
        print(f"Failed to send email to {email}: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 OTP_emailer.py <email> <otp>")
        sys.exit(1)

    email = sys.argv[1]
    otp = sys.argv[2]

    send_otp_email(email, otp)
