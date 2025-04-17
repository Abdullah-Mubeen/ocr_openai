import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from utils import encode_image, extract_form_data

app = FastAPI(title="Form Extractor API")

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, replace with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the Data directory exists
DATA_DIR = "./Data"
FORMS_DIR = "./Data/Forms"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(FORMS_DIR, exist_ok=True)

# Models
class FormField(BaseModel):
    type: str
    label: str
    key: str
    options: Optional[List[str]] = None

class FormTemplate(BaseModel):
    name: str
    fields: List[FormField]
    extractedData: Optional[Dict[str, Any]] = None

@app.get("/")
async def root():
    return {"message": "Form Extractor API is running", "status": "ok"}

@app.post("/extract")
async def extract_form(
    image: UploadFile = File(...),
    form_name: str = Form("unnamed_form")
):
    # Validate the image
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_content = await image.read()
        base64_image = encode_image(image_content)
        form_template = extract_form_data(base64_image)

        # Save as a form template (for reuse)
        sanitized_name = "".join([c if c.isalnum() else "_" for c in form_template["name"]])
        file_path = os.path.join(FORMS_DIR, f"{sanitized_name}.json")

        with open(file_path, "w") as f:
            json.dump(form_template, f, indent=2)

        return form_template

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing form: {str(e)}")


@app.post("/save-form-template")
async def save_form_template(form: FormTemplate):
    try:
        sanitized_name = "".join([c if c.isalnum() else "_" for c in form.name])
        file_path = os.path.join(FORMS_DIR, f"{sanitized_name}.json")
        
        with open(file_path, "w") as f:
            json.dump(form.dict(), f, indent=2)
        
        return {"message": f"Form template '{form.name}' saved successfully", "path": file_path}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving form template: {str(e)}")

@app.get("/list-form-templates")
async def list_form_templates():
    try:
        templates = []
        for filename in os.listdir(FORMS_DIR):
            if filename.endswith(".json"):
                file_path = os.path.join(FORMS_DIR, filename)
                with open(file_path, "r") as f:
                    form_data = json.load(f)
                    templates.append({
                        "name": form_data.get("name", filename[:-5]),
                        "filename": filename
                    })
        
        return {"templates": templates}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing form templates: {str(e)}")

@app.get("/form-template/{name}")
async def get_form_template(name: str):
    try:
        sanitized_name = "".join([c if c.isalnum() else "_" for c in name])
        file_path = os.path.join(FORMS_DIR, f"{sanitized_name}.json")
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Form template '{name}' not found")
        
        with open(file_path, "r") as f:
            form_data = json.load(f)
        
        return form_data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving form template: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)