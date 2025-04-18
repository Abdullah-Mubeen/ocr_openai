 // Element references
 const uploadForm = document.getElementById("uploadForm");
 const imagePreviewSection = document.getElementById("imagePreviewSection");
 const extractedFormSection = document.getElementById("extractedFormSection");
 const formContainer = document.getElementById("formContainer");
 const jsonOutputSection = document.getElementById("jsonOutputSection");
 const jsonData = document.getElementById("jsonData");
 const previewImg = document.getElementById("previewImg");
 const loadingOverlay = document.getElementById("loadingOverlay");
 const imageInput = document.getElementById("imageInput");
 const downloadBtn = document.getElementById("downloadBtn");
 const editModeToggle = document.getElementById("editModeToggle");
 const statusSection = document.getElementById("statusSection");
 const statusContent = document.getElementById("statusContent");
 const dragArea = document.getElementById("dragArea");

 // Global variables
 let currentJsonData = null;
 let editMode = true;

 // Collapse functionality
 document.querySelectorAll(".collapse-toggle").forEach(button => {
   button.addEventListener("click", function() {
     const targetId = this.getAttribute("data-target");
     const targetElement = document.getElementById(targetId);
     const icon = this.querySelector("i");
     
     if (targetElement.classList.contains("expanded-section")) {
       targetElement.classList.remove("expanded-section");
       targetElement.classList.add("hidden-section");
       icon.classList.add("rotate-180");
     } else {
       targetElement.classList.remove("hidden-section");
       targetElement.classList.add("expanded-section");
       icon.classList.remove("rotate-180");
     }
   });
 });

 // Drag and drop functionality
 ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
   dragArea.addEventListener(eventName, preventDefaults, false);
 });

 function preventDefaults(e) {
   e.preventDefault();
   e.stopPropagation();
 }

 ["dragenter", "dragover"].forEach(eventName => {
   dragArea.addEventListener(eventName, highlight, false);
 });

 ["dragleave", "drop"].forEach(eventName => {
   dragArea.addEventListener(eventName, unhighlight, false);
 });

 function highlight() {
   dragArea.classList.add("border-indigo-500", "bg-indigo-50");
 }

 function unhighlight() {
   dragArea.classList.remove("border-indigo-500", "bg-indigo-50");
 }

 dragArea.addEventListener("drop", handleDrop, false);

 function handleDrop(e) {
   const dt = e.dataTransfer;
   const files = dt.files;
   imageInput.files = files;
   handleImagePreview();
 }

 // Image preview functionality
 imageInput.addEventListener("change", handleImagePreview);

 function handleImagePreview() {
   const file = imageInput.files[0];
   if (file) {
     const reader = new FileReader();
     reader.onload = function(e) {
       previewImg.src = e.target.result;
       imagePreviewSection.classList.remove("hidden");
       imagePreviewSection.classList.add("fade-in");
     };
     reader.readAsDataURL(file);
   }
 }

 // Form submission
 uploadForm.addEventListener("submit", async (e) => {
   e.preventDefault();

   // Reset and show loading
   loadingOverlay.classList.remove("hidden");
   clearStatus();

   const formData = new FormData(uploadForm);

   try {
     // Make the actual API call
     const response = await fetch("http://localhost:8000/extract", {
       method: "POST",
       body: formData,
     });

     if (!response.ok) {
       const errorData = await response.json().catch(() => ({}));
       throw new Error(errorData.detail || "Form extraction failed");
     }

     const data = await response.json();
     currentJsonData = data;
     
     // Show success status
     showStatus("success", "Form extracted successfully! You can now edit and verify the extracted data.");
     
     renderForm(data);
     showJson(data);
     
     // Show form and JSON sections
     extractedFormSection.classList.remove("hidden");
     extractedFormSection.classList.add("fade-in");
     jsonOutputSection.classList.remove("hidden");
     jsonOutputSection.classList.add("fade-in");
   } catch (err) {
     showStatus("error", `Error: ${err.message}`);
     console.error("Error:", err);
   } finally {
     loadingOverlay.classList.add("hidden");
   }
 });

 // Status management
 function showStatus(type, message) {
   statusSection.classList.remove("hidden");
   statusSection.classList.add("fade-in");
   
   let icon, bgColor, textColor;
   
   switch(type) {
     case "success":
       icon = "fa-check-circle";
       bgColor = "bg-green-100";
       textColor = "text-green-700";
       break;
     case "error":
       icon = "fa-exclamation-circle";
       bgColor = "bg-red-100";
       textColor = "text-red-700";
       break;
     case "info":
       icon = "fa-info-circle";
       bgColor = "bg-blue-100";
       textColor = "text-blue-700";
       break;
     default:
       icon = "fa-info-circle";
       bgColor = "bg-gray-100";
       textColor = "text-gray-700";
   }
   
   statusContent.className = `rounded-lg p-4 ${bgColor} ${textColor}`;
   statusContent.innerHTML = `
     <div class="flex items-start">
       <div class="flex-shrink-0">
         <i class="fas ${icon} text-xl"></i>
       </div>
       <div class="ml-3">
         <p class="text-sm font-medium">${message}</p>
       </div>
     </div>
   `;
 }

 function clearStatus() {
   statusSection.classList.add("hidden");
   statusContent.innerHTML = "";
 }

 // Format date for form fields
 function formatDate(value) {
   if (!value || typeof value !== "string") return "";
   
   // Handle various date formats
   // DD-MM-YYYY format
   if (value.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
     const [day, month, year] = value.split("-");
     return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
   } 
   // MM/DD/YYYY format
   else if (value.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
     const [month, day, year] = value.split("/");
     return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
   }
   // YYYY-MM-DD format (already HTML date input format)
   else if (value.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
     return value;
   }
   
   return "";
 }

 // Render form from JSON data
 function renderForm(template) {
   formContainer.innerHTML = `<h2 class="text-xl font-bold mb-4">${template.name}</h2>`;
   const formEl = document.createElement("form");
   formEl.className = "space-y-6";
   formEl.id = "dynamicForm";
 
   template.fields.forEach((field, index) => {
     const wrapper = document.createElement("div");
     wrapper.className = "bg-gray-50 p-4 rounded-lg transition hover:bg-gray-100";
     const inputId = `field_${field.key}_${index}`;
 
     // Create label
     const labelContainer = document.createElement("div");
     labelContainer.className = "flex justify-between items-center mb-2";
     
     const label = document.createElement("label");
     label.className = "font-medium text-gray-700";
     label.setAttribute("for", inputId);
     label.textContent = field.label;
     
     const fieldType = document.createElement("span");
     fieldType.className = "text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded";
     fieldType.textContent = field.type;
     
     labelContainer.appendChild(label);
     labelContainer.appendChild(fieldType);
     wrapper.appendChild(labelContainer);
 
     // Create input element
     let input;
     const value = template.extractedData?.[field.key] ?? "";
 
     switch (field.type) {
       case "text":
         input = document.createElement("input");
         input.type = "text";
         input.value = value;
         input.className = "form-input border border-gray-300 rounded-lg px-4 py-2 w-full transition focus:ring-2 focus:ring-indigo-200";
         if (!editMode) input.disabled = true;
         break;
 
       case "date":
         input = document.createElement("input");
         input.type = "date";
         input.value = formatDate(value);
         input.className = "form-input border border-gray-300 rounded-lg px-4 py-2 w-full transition focus:ring-2 focus:ring-indigo-200";
         if (!editMode) input.disabled = true;
         break;
 
       case "checkbox":
         const checkboxWrapper = document.createElement("div");
         checkboxWrapper.className = "flex items-center";
         
         input = document.createElement("input");
         input.type = "checkbox";
         input.checked = value === true || value === "true" || value === "yes" || value === "checked";
         input.className = "h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500";
         if (!editMode) input.disabled = true;
         
         const checkboxLabel = document.createElement("span");
         checkboxLabel.className = "ml-2 text-gray-700";
         checkboxLabel.textContent = input.checked ? "Yes" : "No";
         
         input.addEventListener("change", () => {
           checkboxLabel.textContent = input.checked ? "Yes" : "No";
         });
         
         checkboxWrapper.appendChild(input);
         checkboxWrapper.appendChild(checkboxLabel);
         wrapper.appendChild(checkboxWrapper);
         break;
 
       case "dropdown":
         input = document.createElement("select");
         input.className = "form-select border border-gray-300 rounded-lg px-4 py-2 w-full transition focus:ring-2 focus:ring-indigo-200";
         if (!editMode) input.disabled = true;
         
         // Add empty option
         const emptyOption = document.createElement("option");
         emptyOption.value = "";
         emptyOption.textContent = "-- Select --";
         input.appendChild(emptyOption);
         
         // Add all options
         field.options?.forEach(opt => {
           const option = document.createElement("option");
           option.value = opt;
           option.textContent = opt;
           if (opt.toLowerCase() === String(value).toLowerCase()) {
             option.selected = true;
           }
           input.appendChild(option);
         });
         break;
 
       default:
         input = document.createElement("input");
         input.type = "text";
         input.value = value;
         input.className = "form-input border border-gray-300 rounded-lg px-4 py-2 w-full transition focus:ring-2 focus:ring-indigo-200";
         if (!editMode) input.disabled = true;
     }
 
     // Common attributes
     input.name = field.key;
     input.dataset.key = field.key;
     input.id = inputId;
     
     if (field.type !== "checkbox") {
       wrapper.appendChild(input);
     }
     
     formEl.appendChild(wrapper);
   });
 
   // Add Save Button
   const submitBtn = document.createElement("button");
   submitBtn.type = "button";
   submitBtn.className = "btn-primary bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold w-full flex items-center justify-center";
   submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Save & Update JSON';
   if (!editMode) submitBtn.disabled = true;
 
   submitBtn.addEventListener("click", () => {
     const inputs = formEl.querySelectorAll("[data-key]");
     const result = {};
     inputs.forEach(input => {
       const key = input.dataset.key;
       result[key] = input.type === "checkbox" ? input.checked : input.value;
     });
     
     const updatedTemplate = { ...template, extractedData: result };
     currentJsonData = updatedTemplate;
     showJson(updatedTemplate);
     
     const alertBox = document.createElement("div");
     alertBox.className = "alert bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mt-4 mb-4";
     alertBox.innerHTML = '<div class="flex"><div class="flex-shrink-0"><i class="fas fa-check-circle mt-1"></i></div><div class="ml-3"><p class="font-medium">Success!</p><p class="text-sm">Form data updated successfully.</p></div></div>';
     
     const existingAlert = formEl.querySelector(".alert");
     if (existingAlert) {
       formEl.removeChild(existingAlert);
     }
     
     formEl.insertBefore(alertBox, submitBtn);
     
     setTimeout(() => {
       alertBox.style.opacity = "0";
       setTimeout(() => {
         if (formEl.contains(alertBox)) {
           formEl.removeChild(alertBox);
         }
       }, 300);
     }, 3000);
   });
 
   formEl.appendChild(submitBtn);
   formContainer.appendChild(formEl);
 }

 // Show JSON data
 function showJson(obj) {
   jsonData.textContent = JSON.stringify(obj, null, 2);
 }

 // Toggle edit mode
 editModeToggle.addEventListener("click", () => {
   editMode = !editMode;
   
   const toggleText = editModeToggle.querySelector("span");
   toggleText.textContent = editMode ? "ON" : "OFF";
   toggleText.className = editMode ? "text-indigo-600" : "text-gray-600";
   
   const inputs = document.querySelectorAll("#dynamicForm input, #dynamicForm select");
   inputs.forEach(input => {
     input.disabled = !editMode;
   });
   
   const saveButton = document.querySelector("#dynamicForm button");
   if (saveButton) {
     saveButton.disabled = !editMode;
     saveButton.className = editMode 
       ? "btn-primary bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold w-full flex items-center justify-center"
       : "btn-primary bg-gray-400 text-white px-6 py-3 rounded-lg font-bold w-full flex items-center justify-center cursor-not-allowed";
   }
 });

 // JSON download functionality
 downloadBtn.addEventListener("click", () => {
   if (!currentJsonData) return;
   
   const json = JSON.stringify(currentJsonData, null, 2);
   const blob = new Blob([json], {type: "application/json"});
   const url = URL.createObjectURL(blob);
   
   const a = document.createElement("a");
   a.href = url;
   a.download = `${currentJsonData.name || "form_data"}.json`;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);
   
   showStatus("info", "JSON file downloaded successfully!");
 });