import json
import random

# Fixed users
users = [
    {"email": "ndeshpande2@usf.edu", "name": "ninad"},
    {"email": "neerajpillai@usf.edu", "name": "neeraj"},
    {"email": "dkarmariya@usf.edu", "name": "dk"},
    {"email": "snagraj@usf.edu", "name": "srishti"},
]

# Sample dropdown data
expenseTypes = ["Travel", "Supplies", "Meal", "Lodging"]
categories = ["Conference", "Office", "Equipment", "Training"]
statuses = ["Pending", "Approved", "Rejected", "Request Clarification"]

# Generate 100 mock expenses
mockExpenses = []
for i in range(1, 121):
    user = random.choice(users)
    mockExpenses.append({
        "id": i,
        "email": user["email"],
        "name": user["name"],
        "expenseType": random.choice(expenseTypes),
        "category": random.choice(categories),
        "status": random.choice(statuses),
        "amount": round(random.uniform(10, 500), 2)
    })

# Save to JSON file
file_path = "C:\\Users\\deshn\\Desktop\\EERIS\\src\\data\\data.json"
with open(file_path, "w") as f:
    json.dump(mockExpenses, f, indent=2)

# Preview first 5 records
print(json.dumps(mockExpenses[:5], indent=2))

# Provide download link information
file_path
