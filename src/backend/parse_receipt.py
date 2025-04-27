# src/backend/parse_receipt.py
import sys, os, json
from PIL import Image
import pytesseract
from dotenv import load_dotenv # Used to load .env file if present
from openai import OpenAI

# Load environment variables from a .env file if it exists
# This is helpful for development but OPENAI_API_KEY should still be set
# when running the node server for production/testing.
load_dotenv()

# --- FIX: Get API key from the correct environment variable ---
# The OpenAI library automatically looks for 'OPENAI_API_KEY' if api_key is not passed.
# Or, you can retrieve it manually:
api_key = os.getenv("OPENAI_API_KEY")

# Check if the API key was actually found
if not api_key:
    # Print error to stderr so Node.js can capture it
    print("ERROR: OPENAI_API_KEY environment variable not set or found.", file=sys.stderr)
    # Exit with a non-zero status code to indicate failure
    sys.exit(1)

# Initialize the client (this will now use the key from the environment variable)
# If you retrieved it manually above, you'd pass it: client = OpenAI(api_key=api_key)
# If you rely on the automatic lookup, just use: client = OpenAI()
# Let's stick to passing it explicitly since we checked for it.
client = OpenAI(api_key=api_key)
# --- End FIX ---


def ocr_image(image_path):
    """Performs OCR on the image file."""
    try:
        # Perform OCR using pytesseract
        text = pytesseract.image_to_string(Image.open(image_path))
        return text
    except FileNotFoundError:
        print(f"ERROR: Image file not found at {image_path}", file=sys.stderr)
        raise # Re-raise the exception
    except Exception as e:
        # Catch other potential pytesseract/PIL errors
        print(f"ERROR: OCR failed for {image_path}. Details: {e}", file=sys.stderr)
        raise # Re-raise the exception


def extract_fields(text):
    """Sends text to OpenAI to extract structured fields."""
    # Define the prompt for the OpenAI API
    prompt = f"""
You will get raw text potentially extracted from a receipt via OCR.
Extract exactly these three fields in JSON format:
  * vendor (string): The name of the merchant or store.
  * date (string, YYYY-MM-DD format): The date of the transaction. If multiple dates are present, prefer the main transaction date.
  * total (number, float or integer): The final total amount paid, without any currency symbols or commas.

Instructions:
- If any field is clearly missing or completely unreadable in the text, set its value to an empty string ("").
- For the total, if multiple totals are present (e.g., subtotal, total), extract the final grand total.
- Ensure the date is in YYYY-MM-DD format. Convert if necessary (e.g., MM/DD/YY, Month DD, YYYY). If conversion is impossible, use an empty string.
- Return *only* the JSON object itself, nothing else before or after it.

Raw Text:
---
{text}
---
"""
    try:
        # Make the API call to OpenAI
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # Or consider gpt-4o-mini for potentially better results/cost
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2, # Lower temperature for more deterministic output
            response_format={ "type": "json_object" } # Request JSON output directly if using compatible models
        )
        # Extract the JSON content from the response
        content = response.choices[0].message.content
        return content
    except Exception as e:
        # Handle potential API errors (rate limits, connection issues, etc.)
        print(f"ERROR: OpenAI API call failed. Details: {e}", file=sys.stderr)
        # Return a default JSON structure indicating failure
        return json.dumps({"vendor": "", "date": "", "total": ""})


# Main execution block when the script is run directly
if __name__ == "__main__":
    # Check if the correct number of command-line arguments is provided
    if len(sys.argv) != 2:
        print("Usage: python parse_receipt.py <image_path>", file=sys.stderr)
        sys.exit(1)

    image_file_path = sys.argv[1]
    parsed_json = {"vendor": "", "date": "", "total": ""} # Default structure

    try:
        # Step 1: Perform OCR on the image
        raw_text = ocr_image(image_file_path)
        # print(f"DEBUG: Raw OCR Text:\n---\n{raw_text}\n---", file=sys.stderr) # Optional debug log

        # Step 2: Extract fields using OpenAI
        if raw_text and raw_text.strip(): # Only call OpenAI if OCR produced text
             extracted_json_string = extract_fields(raw_text)
             # Step 3: Parse the JSON string received from OpenAI
             # Add extra validation in case OpenAI doesn't return valid JSON
             try:
                 parsed_json = json.loads(extracted_json_string)
                 # Ensure the basic keys exist, default to "" if not
                 parsed_json = {
                     "vendor": parsed_json.get("vendor", ""),
                     "date": parsed_json.get("date", ""),
                     "total": parsed_json.get("total", "")
                 }
             except json.JSONDecodeError as json_err:
                 print(f"ERROR: Failed to decode JSON from OpenAI response. Response: {extracted_json_string}. Error: {json_err}", file=sys.stderr)
                 # Keep the default empty JSON
        else:
            print("WARN: OCR did not produce any text.", file=sys.stderr)
            # Keep the default empty JSON

    except Exception as e:
        # Catch any other unexpected errors during the process
        print(f"ERROR: An unexpected error occurred during parsing. Details: {e}", file=sys.stderr)
        # Keep the default empty JSON

    # Step 4: Print the final JSON result to stdout for Node.js
    # Ensure it always prints valid JSON, even if steps failed
    print(json.dumps(parsed_json))
