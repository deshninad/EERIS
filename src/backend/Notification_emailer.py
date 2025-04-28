import sys
import smtplib
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

# Load environment variables from .env file in working directory
load_dotenv()

def send_notification_email(to_address, subject, body):
    smtp_server = os.getenv("SMTP_SERVER")
    port = int(os.getenv("SMTP_PORT", 587))
    user_email = os.getenv("EMAIL_ADDRESS")
    password = os.getenv("EMAIL_PASSWORD")

    # Validate environment variables
    if not smtp_server or not user_email or not password:
        print("Error: Missing SMTP configuration in environment variables.")
        sys.exit(1)

    # Compose email
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = user_email
    msg['To'] = to_address

    try:
        with smtplib.SMTP(smtp_server, port) as server:
            server.starttls()
            server.login(user_email, password)
            server.sendmail(user_email, to_address, msg.as_string())
            print(f"Notification sent to {to_address}")
    except Exception as e:
        print(f"Failed to send notification to {to_address}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Usage: python Notification_sender.py <to> <subject> <body>
    if len(sys.argv) != 4:
        print("Usage: python Notification_sender.py <to> <subject> <body>")
        sys.exit(1)

    to_addr = sys.argv[1]
    subj = sys.argv[2]
    body_text = sys.argv[3]
    send_notification_email(to_addr, subj, body_text)
