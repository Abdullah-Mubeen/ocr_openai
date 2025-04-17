const uploadForm = document.getElementById("uploadForm");
const formContainer = document.getElementById("formContainer");
const jsonOutput = document.getElementById("jsonOutput");
const jsonData = document.getElementById("jsonData");

uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(uploadForm);
    formContainer.innerHTML = "⏳ Extracting and generating form...";
    formContainer.classList.remove("hidden");

    try {
        const response = await fetch("http://localhost:8000/extract", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Form extraction failed");

        const data = await response.json();
        renderForm(data);
        showJson(data);
    } catch (err) {
        formContainer.innerHTML = `<p class="text-red-600">❌ ${err.message}</p>`;
    }
});

function formatDate(value) {
    if (!value || value.includes("-") === false) return "";
    const [day, month, year] = value.split("-");
    if (day && month && year) {
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return value;
}


function renderForm(template) {
    formContainer.innerHTML = `<h2 class="text-xl font-bold mb-4">${template.name}</h2>`;
    const formEl = document.createElement("form");
    formEl.className = "space-y-4";
    formEl.id = "dynamicForm";
  
    function formatDate(value) {
      if (!value || !value.includes("-")) return "";
      const [day, month, year] = value.split("-");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  
    template.fields.forEach((field, index) => {
      const wrapper = document.createElement("div");
      const inputId = `field_${field.key}_${index}`;
  
      // Create label
      const label = document.createElement("label");
      label.className = "block font-semibold mb-1";
      label.setAttribute("for", inputId);
      label.textContent = field.label;
      wrapper.appendChild(label);
  
      // Create input element
      let input;
      const value = template.extractedData?.[field.key] ?? "";
  
      switch (field.type) {
        case "text":
        case "date":
          input = document.createElement("input");
          input.type = field.type;
          input.value = field.type === "date" ? formatDate(value) : value;
          break;
  
        case "checkbox":
          input = document.createElement("input");
          input.type = "checkbox";
          input.checked = Boolean(value);
          break;
  
        case "dropdown":
          input = document.createElement("select");
          field.options?.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt;
            option.textContent = opt;
            if (opt.toLowerCase() === value?.toLowerCase()) {
              option.selected = true;
            }
            input.appendChild(option);
          });
          break;
  
        default:
          input = document.createElement("input");
          input.type = "text";
          input.value = value;
      }
  
      // Common attributes
      input.className = "border p-2 rounded w-full";
      input.name = field.key;
      input.dataset.key = field.key;
      input.id = inputId; // ✅ assign id to match label
      wrapper.appendChild(input);
      formEl.appendChild(wrapper);
    });
  
    // Add Save Button
    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700";
    submitBtn.textContent = "📤 Save & Print JSON";
  
    submitBtn.addEventListener("click", () => {
      const inputs = formEl.querySelectorAll("[data-key]");
      const result = {};
      inputs.forEach(input => {
        const key = input.dataset.key;
        result[key] = input.type === "checkbox" ? input.checked : input.value;
      });
      alert("✅ Data captured. Check console or preview below.");
      console.log("Final edited form data:", result);
      showJson({ ...template, extractedData: result });
    });
  
    formEl.appendChild(submitBtn);
    formContainer.appendChild(formEl);
    formContainer.classList.remove("hidden"); // Ensure form is visible
  }
  


function showJson(obj) {
    jsonData.textContent = JSON.stringify(obj, null, 2);
    jsonOutput.classList.remove("hidden");
}
