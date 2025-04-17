import openai
import os
import base64
from dotenv import load_dotenv
import json

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

def encode_image(raw_image_bytes: bytes) -> str:
    return base64.b64encode(raw_image_bytes).decode("utf-8")

def extract_form_data(base64_image: str):
    full_prompt = """
You are a form understanding AI. The user has uploaded a scanned image of a form.

Extract the following:

1. A list of form fields with:
   - `label`: The human-readable label from the form (e.g., "Full Name").
   - `key`: A simplified snake_case version of the label (e.g., "full_name").
   - `type`: One of ["text", "checkbox", "date", "dropdown"] based on the field style or value.
   - `options` (only if dropdown): list of options.
   
2. A dictionary called `extractedData` where the keys match the field keys and the values are extracted from the form.

Return a JSON in the following format:
{
  "name": "Generated Form Template Name",
  "fields": [ ... ],
  "extractedData": { ... }
}
""".strip()

    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    { "type": "text", "text": full_prompt },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=1500,
    )

    raw_output = response["choices"][0]["message"]["content"]
    cleaned = raw_output.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        raise ValueError("Could not decode JSON from LLM response")
