import openai
import base64
import json
import os
from dotenv import load_dotenv   
 
load_dotenv()

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def process_response(response, image_path):
    json_string = response['choices'][0]['message']['content']
    json_string = json_string.replace("```json\n", "").replace("\n```", "")
    
    try:
        json_data = json.loads(json_string)
    except json.JSONDecodeError:
        print("❌ Failed to decode JSON. Output was:\n", json_string)
        return

    filename_without_extension = os.path.splitext(os.path.basename(image_path))[0]
    json_filename = f"{filename_without_extension}.json"

    os.makedirs("./Data", exist_ok=True)
    with open(f"./Data/{json_filename}", 'w') as file:
        json.dump(json_data, file, indent=4)

    print(f"✅ JSON data saved to ./Data/{json_filename}")

# === CONFIGURATION ===
image_local = 'bank form.png'  # Replace with your image file
openai.api_key = os.getenv("OPENAI_API_KEY")  # Get the API key from .env

# === ENCODE IMAGE ===
base64_img = f"data:image/png;base64,{encode_image(image_local)}"

# === GPT-4o CALL ===
response = openai.ChatCompletion.create(
    model='gpt-4o',
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "Extract data from this form image in editable JSON format"
                    )
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": base64_img
                    }
                }
            ]
        }
    ],
    max_tokens=1500,
)

process_response(response, image_local)
