// 3DBubbleCarousel/add-bubble.js

(() => {
  const SUPERSCRIPT_TO_DIGITS = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁺': '+', '⁻': '-'
  };

  function parseScientific(str) {
    if (str === null || str === undefined) return 0;
    let cleanStr = String(str).trim();
    
    // Replace superscript unicode characters with digits
    cleanStr = cleanStr.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, m => SUPERSCRIPT_TO_DIGITS[m]);
    
    // Replace custom multiplication structures (e.g. x 10^22) with e notation
    cleanStr = cleanStr.replace(/(?:[×x*]\s*10\s*(?:\^|\*\*|\s)?\s*([+-]?\d+))/gi, 'e$1');
    
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  }

  class AddBubble {
    /**
     * Generates a fully interactive DOM node for the "Add New Bubble" overlay form.
     * @param {Array} existingItems - The list of current items in the carousel to check for color collisions.
     * @param {function} onSave - Callback fired when bubble is created: (newBubbleItem) => void.
     * @param {function} onCancel - Callback fired when cancel is clicked: () => void.
     * @returns {HTMLElement} The assembled add bubble overlay DOM element.
     */
    static create(existingItems, onSave, onCancel) {
      const overlay = document.createElement('div');
      overlay.className = 'inline-stats-editor';

      // State for the color picker
      let hue = 180;
      let sat = 100;
      let val = 100;
      let chosenColorStr = `hsl(${hue}, ${sat}%, ${val / 2}%)`; // Standard HSL representation for CSS
      let colorIsDuplicate = false;
      let activeUnits = [];

      // Helper: Parse hue from existing item color strings
      function getHueFromString(colorStr) {
        if (!colorStr) return null;
        const oklchMatch = colorStr.match(/oklch\([\d%.]+\s+[\d%.]+\s+(\d+(?:\.\d+)?)\)/);
        if (oklchMatch) return parseFloat(oklchMatch[1]);
        
        const hslMatch = colorStr.match(/hsl\((\d+(?:\.\d+)?)/);
        if (hslMatch) return parseFloat(hslMatch[1]);
        
        return null;
      }

      const existingHues = existingItems
        .filter(item => !item.isAddButton)
        .map(item => getHueFromString(item.color))
        .filter(h => h !== null);

      const content = document.createElement('div');
      content.className = 'editor-overlay-card add-bubble-overlay';
      content.innerHTML = `
        <div class="editor-header">
          <span class="material-symbols-outlined" style="color: var(--primary)">add_circle</span>
          <span class="editor-subtitle">Create Component</span>
        </div>
        <h3 class="editor-title">Add New Bubble</h3>
      `;

      const form = document.createElement('form');
      form.className = 'add-bubble-form';

      // Split layout container
      const splitLayout = document.createElement('div');
      splitLayout.className = 'add-bubble-split';

      // 1. LEFT SIDE: Color Picker & Name
      const leftPanel = document.createElement('div');
      leftPanel.className = 'add-bubble-panel left-panel';

      const nameGroup = document.createElement('div');
      nameGroup.className = 'form-group';
      nameGroup.innerHTML = `
        <label class="form-label">Bubble Name</label>
        <input type="text" id="bubble-name-input" class="editor-input-field name-input" placeholder="e.g. Cardio, Water" required>
      `;
      leftPanel.appendChild(nameGroup);

      // Color picker container
      const pickerLabel = document.createElement('label');
      pickerLabel.className = 'form-label';
      pickerLabel.textContent = 'Select Bubble Color';
      leftPanel.appendChild(pickerLabel);

      const pickerContainer = document.createElement('div');
      pickerContainer.className = 'color-picker-container';

      // Color Field (Sat/Val plane)
      const colorField = document.createElement('div');
      colorField.className = 'color-field';
      
      const colorFieldMarker = document.createElement('div');
      colorFieldMarker.className = 'color-field-marker';
      colorField.appendChild(colorFieldMarker);

      // Hue Slider (Rainbow column)
      const hueSliderWrapper = document.createElement('div');
      hueSliderWrapper.className = 'hue-slider-wrapper';
      
      const hueSlider = document.createElement('input');
      hueSlider.type = 'range';
      hueSlider.min = '0';
      hueSlider.max = '360';
      hueSlider.value = String(hue);
      hueSlider.className = 'hue-slider-range';
      hueSliderWrapper.appendChild(hueSlider);

      pickerContainer.appendChild(colorField);
      pickerContainer.appendChild(hueSliderWrapper);
      leftPanel.appendChild(pickerContainer);

      // Preview and warning box
      const previewRow = document.createElement('div');
      previewRow.className = 'color-preview-row';
      
      const colorPreviewCircle = document.createElement('div');
      colorPreviewCircle.className = 'color-preview-circle';
      
      const warningText = document.createElement('div');
      warningText.className = 'color-warning-text';
      
      previewRow.appendChild(colorPreviewCircle);
      previewRow.appendChild(warningText);
      leftPanel.appendChild(previewRow);

      // 2. RIGHT SIDE: Units List & Dynamic Inputs
      const rightPanel = document.createElement('div');
      rightPanel.className = 'add-bubble-panel right-panel';

      const unitsGroup = document.createElement('div');
      unitsGroup.className = 'form-group';
      unitsGroup.innerHTML = `
        <label class="form-label">Supported Units (comma-separated)</label>
        <input type="text" id="bubble-units-input" class="editor-input-field units-input" placeholder="e.g. steps, meters, calories" required>
      `;
      rightPanel.appendChild(unitsGroup);

      // Dynamic inputs container
      const dynamicValuesWrapper = document.createElement('div');
      dynamicValuesWrapper.className = 'dynamic-values-wrapper';
      
      const dynamicValuesTitle = document.createElement('label');
      dynamicValuesTitle.className = 'form-label';
      dynamicValuesTitle.textContent = 'Initial Metric Values';
      dynamicValuesTitle.style.display = 'none';
      
      const dynamicValuesList = document.createElement('ul');
      dynamicValuesList.className = 'dynamic-values-list';
      
      dynamicValuesWrapper.appendChild(dynamicValuesTitle);
      dynamicValuesWrapper.appendChild(dynamicValuesList);
      rightPanel.appendChild(dynamicValuesWrapper);

      splitLayout.appendChild(leftPanel);
      splitLayout.appendChild(rightPanel);
      form.appendChild(splitLayout);

      // 3. BOTTOM PANEL: Save and Cancel buttons
      const actionGrid = document.createElement('div');
      actionGrid.className = 'editor-actions-grid';

      const btnCancel = document.createElement('button');
      btnCancel.type = 'button';
      btnCancel.className = 'editor-btn-cancel';
      btnCancel.innerHTML = '<span class="material-symbols-outlined">close</span>';
      btnCancel.addEventListener('click', () => {
        if (onCancel) onCancel();
      });

      const btnSave = document.createElement('button');
      btnSave.type = 'submit';
      btnSave.className = 'editor-btn-save add-btn-save';
      btnSave.innerHTML = '<span class="material-symbols-outlined">check</span> Save Bubble';

      actionGrid.appendChild(btnCancel);
      actionGrid.appendChild(btnSave);
      form.appendChild(actionGrid);
      content.appendChild(form);
      overlay.appendChild(content);

      // COLOR PICKER INTERACTION
      function updateColorPicker() {
        // 1. Set background color of the Sat/Val plane
        colorField.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;

        // 2. Calculate HSL representing the current SV cursor selection
        // Value mapped to HSL lightness: V - (V * S / 2)
        const sFraction = sat / 100;
        const vFraction = val / 100;
        const lFraction = vFraction * (1 - sFraction / 2);
        const hslLightness = Math.round(lFraction * 100);
        const hslSaturation = lFraction === 0 || lFraction === 1 ? 0 : Math.round(((vFraction - lFraction) / Math.min(lFraction, 1 - lFraction)) * 100);

        chosenColorStr = `hsl(${hue}, ${hslSaturation}%, ${hslLightness}%)`;

        // 3. Update preview circle color
        colorPreviewCircle.style.backgroundColor = chosenColorStr;

        // 4. Validate against existing hues
        colorIsDuplicate = false;
        for (const exHue of existingHues) {
          let hueDiff = Math.abs(hue - exHue);
          if (hueDiff > 180) hueDiff = 360 - hueDiff;
          if (hueDiff < 15) {
            colorIsDuplicate = true;
            break;
          }
        }

        // 5. Update UI warning and save button state
        if (colorIsDuplicate) {
          warningText.innerHTML = '<span class="material-symbols-outlined warning-icon">warning</span> Color is too similar to another bubble';
          warningText.classList.add('active');
          btnSave.disabled = true;
          btnSave.style.opacity = '0.5';
        } else {
          warningText.textContent = '';
          warningText.classList.remove('active');
          validateForm();
        }
      }

      // Color Field Slider coordinate updater
      function setColorFieldCoords(clientX, clientY) {
        const rect = colorField.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(clientY - rect.top, rect.height));

        // Calculate Saturation (0-100) and Value (0-100)
        sat = Math.round((x / rect.width) * 100);
        val = Math.round((1 - y / rect.height) * 100);

        // Move marker
        colorFieldMarker.style.left = `${x}px`;
        colorFieldMarker.style.top = `${y}px`;

        updateColorPicker();
      }

      // Color field mouse events
      let isDrawingColor = false;
      colorField.addEventListener('mousedown', (e) => {
        isDrawingColor = true;
        setColorFieldCoords(e.clientX, e.clientY);
      });
      window.addEventListener('mousemove', (e) => {
        if (isDrawingColor) setColorFieldCoords(e.clientX, e.clientY);
      });
      window.addEventListener('mouseup', () => {
        isDrawingColor = false;
      });

      // Color field touch events
      colorField.addEventListener('touchstart', (e) => {
        isDrawingColor = true;
        if (e.touches.length > 0) setColorFieldCoords(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      colorField.addEventListener('touchmove', (e) => {
        if (isDrawingColor && e.touches.length > 0) {
          setColorFieldCoords(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
      window.addEventListener('touchend', () => {
        isDrawingColor = false;
      });

      // Hue slider event
      hueSlider.addEventListener('input', () => {
        hue = parseInt(hueSlider.value, 10);
        updateColorPicker();
      });

      // UNITS PARSER & DYNAMIC LISTS
      const unitsInput = form.querySelector('#bubble-units-input');
      unitsInput.addEventListener('input', () => {
        const valStr = unitsInput.value || '';
        activeUnits = valStr.split(',')
          .map(u => u.trim())
          .filter(u => u.length > 0);

        // Clear list
        dynamicValuesList.innerHTML = '';

        if (activeUnits.length > 0) {
          dynamicValuesTitle.style.display = 'block';
          activeUnits.forEach(unitName => {
            const li = document.createElement('li');
            li.className = 'dynamic-unit-row';
            li.innerHTML = `
              <span class="dynamic-unit-name">${unitName}</span>
              <div class="dynamic-input-wrapper">
                <input type="text" class="dynamic-val-input" data-unit="${unitName}" value="0">
              </div>
            `;
            dynamicValuesList.appendChild(li);
          });
        } else {
          dynamicValuesTitle.style.display = 'none';
        }
        validateForm();
      });

      // FORM VALIDATION
      const nameInput = form.querySelector('#bubble-name-input');
      nameInput.addEventListener('input', validateForm);

      function validateForm() {
        const nameVal = nameInput.value.trim();
        const hasName = nameVal.length > 0;
        const hasUnits = activeUnits.length > 0;

        if (hasName && hasUnits && !colorIsDuplicate) {
          btnSave.disabled = false;
          btnSave.style.opacity = '1';
          btnSave.style.cursor = 'pointer';
        } else {
          btnSave.disabled = true;
          btnSave.style.opacity = '0.5';
          btnSave.style.cursor = 'not-allowed';
        }
      }

      // Initial color setup
      setTimeout(() => {
        const rect = colorField.getBoundingClientRect();
        sat = 100;
        val = 100;
        colorFieldMarker.style.left = `${rect.width}px`;
        colorFieldMarker.style.top = '0px';
        updateColorPicker();
      }, 100);

      // FORM SUBMISSION
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (colorIsDuplicate || btnSave.disabled) return;

        const nameVal = nameInput.value.trim();
        
        const newBubble = {
          id: nameVal.toLowerCase().replace(/\s+/g, '_'),
          name: nameVal,
          color: chosenColorStr,
          units: activeUnits,
          unit: activeUnits[0] // Set first unit as active initially
        };

        // Gather dynamically input values for each unit using scientific parsing
        const valueInputs = dynamicValuesList.querySelectorAll('.dynamic-val-input');
        valueInputs.forEach(inp => {
          const uName = inp.getAttribute('data-unit');
          const uVal = parseScientific(inp.value);
          newBubble[uName] = uVal;
        });

        if (onSave) onSave(newBubble);
      });

      return overlay;
    }
  }

  // Export for ES modules, fallback to global for direct script inclusion
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AddBubble;
  } else if (typeof exports !== 'undefined') {
    exports.AddBubble = AddBubble;
  } else {
    window.AddBubble = AddBubble;
  }
})();
