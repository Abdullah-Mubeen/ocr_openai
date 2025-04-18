from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import openai
import os
import base64
from dotenv import load_dotenv
import json
import uvicorn

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

@app.post("/extract")
async def extract_form(
    image: UploadFile = File(...),
    form_name: str = Form(...)
):
    try:
        # Read the uploaded image
        image_content = await image.read()
        
        # Encode image to base64
        base64_image = encode_image(image_content)
        
        # Extract form data using OpenAI
        form_data = extract_form_data(base64_image)
        
        # Update the form name if provided
        if form_name and form_name != "auto_form":
            form_data["name"] = form_name
            
        return form_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)