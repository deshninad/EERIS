# src/backend/clarification_emailer.py
import sys
import smtplib
from email.mime.text import MIMEText
import os # To potentially get sender email/password from environment variables

# --- Configuration ---
# It's better to get sensitive info from environment variables
# For testing, you can hardcode, but replace before deploying!
SENDER_EMAIL = os.environ.get("EMAIL_USER") or "your_sender_email@example.com" # Replace with your actual sender email or env var name
SENDER_PASSWORD = os.environ.get("EMAIL_PASSWORD") or "your_app_password" # Replace with your actual app password or env var name
SMTP_SERVER = "smtp.gmail.com" # Example for Gmail
SMTP_PORT = 587 # Example for Gmail TLS
# --- End Configuration ---

def send_clarification_email(recipient_email, expense_details, admin_note=""): # Add default empty string for note
    """Sends an email requesting clarification for an expense."""

    # Check if sender credentials are set (avoid using default placeholders)
    if not SENDER_EMAIL or SENDER_EMAIL == "your_sender_email@example.com" or \
       not SENDER_PASSWORD or SENDER_PASSWORD == "your_app_password":
        print("ERROR: Sender email or password not configured correctly in clarification_emailer.py or environment variables.")
        sys.exit(1) # Exit if configuration is missing

    subject = "Clarification Needed for Your Expense Report"

    # --- Construct email body ---
    body_lines = [
        "Hi there,",
        "",
        "We need some clarification regarding one of your submitted expenses.",
        "",
        f"Expense Details: {expense_details}",
        ""
    ]
    # Add the admin's note if provided and not just whitespace
    if admin_note and admin_note.strip():
        body_lines.append("Admin Note:")
        body_lines.append(f'"{admin_note}"') # Quote the note for clarity
        body_lines.append("")

    # Add standard closing lines
    body_lines.extend([
        "Could you please provide more information or context about this charge?",
        "You can reply to this email or contact the admin department.",
        "",
        "Thanks,",
        "Admin Team",
        "EERIS"
    ])
    body = "\n".join(body_lines)
    # --- End Body Construction ---

    # Create the email message object
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient_email

    # Send the email using SMTP
    try:
        print(f"Attempting to connect to SMTP server {SMTP_SERVER}:{SMTP_PORT}...")
        # Using 'with' ensures the connection is automatically closed even if errors occur
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo() # Identify ourselves to the SMTP server
            server.starttls() # Upgrade the connection to secure TLS
            server.ehlo() # Re-identify ourselves over the secure connection
            print("Attempting to log in...")
            server.login(SENDER_EMAIL, SENDER_PASSWORD) # Log in to the sender account
            print("Login successful. Sending email...")
            server.sendmail(SENDER_EMAIL, [recipient_email], msg.as_string()) # Send the email
            print(f"Clarification email successfully sent to {recipient_email}")
    except smtplib.SMTPAuthenticationError as e:
        # Handle specific authentication errors (wrong password, less secure apps disabled, etc.)
        print(f"SMTP Authentication Error: Failed to log in. Check email/password/app password settings.")
        print(f"Error details: {e}")
        sys.exit(1) # Indicate failure
    except Exception as e:
        # Handle other potential errors (connection refused, timeout, etc.)
        print(f"Failed to send clarification email to {recipient_email}")
        print(f"Error: {e}")
        sys.exit(1) # Indicate failure

# This block runs if the script is executed directly from the command line
if __name__ == "__main__":
    # --- Accept 2 or 3 command-line arguments ---
    # sys.argv[0] is the script name (clarification_emailer.py)
    # sys.argv[1] should be the recipient's email address
    # sys.argv[2] should be the expense details string
    # sys.argv[3] (optional) is the admin's note
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        # Print usage instructions if the wrong number of arguments is provided
        print("Usage: python clarification_emailer.py <recipient_email> \"<expense_details_string>\" [\"<optional_admin_note>\"]")
        sys.exit(1) # Exit indicating incorrect usage

    # Assign arguments to variables
    recipient = sys.argv[1]
    details = sys.argv[2]
    # Get the note if the 4th argument exists, otherwise default to an empty string
    note = sys.argv[3] if len(sys.argv) == 4 else ""
    # --- End Argument Handling ---

    # Call the main function to send the email
    send_clarification_email(recipient, details, note)
