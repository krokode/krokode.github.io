// 3DBubbleCarousel/stats-editor.js

const DIGITS_TO_SUPERSCRIPT = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻'
  };

  const SUPERSCRIPT_TO_DIGITS = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁺': '+', '⁻': '-'
  };

  function formatScientific(val) {
    if (val === null || val === undefined) return '';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    
    const str = num.toString();
    const match = str.match(/^([+-]?\d+(?:\.\d+)?)[eE]\+?([+-]?\d+)$/);
    if (match) {
      const coeff = match[1];
      const exp = match[2];
      const superExp = exp.split('').map(char => DIGITS_TO_SUPERSCRIPT[char] || char).join('');
      return `${coeff} × 10${superExp}`;
    }
    return str;
  }

  function parseScientific(str) {
    if (str === null || str === undefined) return 0;
    let cleanStr = String(str).trim();
    
    // Replace superscript unicode characters with standard digits
    cleanStr = cleanStr.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, m => SUPERSCRIPT_TO_DIGITS[m]);
    
    // Replace multiplication and power patterns (e.g. x 10^22, * 10**22, × 10 22) with scientific e notation
    cleanStr = cleanStr.replace(/(?:[×x*]\s*10\s*(?:\^|\*\*|\s)?\s*([+-]?\d+))/gi, 'e$1');
    
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  }

  class StatsEditor {
    /**
     * Generates a fully interactive DOM node for the activity stats editor.
     * @param {Object} item - The activity item object to edit (name, value, unit, color).
     * @param {number} index - The index of the item inside the carousel config list.
     * @param {function} onSave - Callback fired when save is confirmed: (newValue) => void.
     * @param {function} onCancel - Callback fired when cancel is clicked: () => void.
     * @returns {HTMLElement} The assembled editor overlay DOM element.
     */
    static create(item, index, onSave, onCancel, onDelete) {
      const overlay = document.createElement('div');
      overlay.className = 'inline-stats-editor';
      
      const themeColor = item.color || 'var(--primary)';

      const content = document.createElement('div');
      content.className = 'editor-overlay-card';
      content.innerHTML = `
        <div class="editor-header">
          <span class="material-symbols-outlined" style="color: ${themeColor}">edit_note</span>
          <span class="editor-subtitle">Adjust Progress</span>
        </div>
        <h3 class="editor-title">
          <span style="color: ${themeColor}">${item.name}</span> Value
        </h3>
      `;
      
      const form = document.createElement('form');
      form.className = 'editor-form-grid';
      
      const inputWrapper = document.createElement('div');
      inputWrapper.className = 'editor-input-wrapper';
      
      const btnMinus = document.createElement('button');
      btnMinus.type = 'button';
      btnMinus.className = 'step-btn';
      btnMinus.innerHTML = '<span class="material-symbols-outlined">remove</span>';
      
      const input = document.createElement('input');
      input.type = 'text'; // String input allows mathematical/exponent formatting e.g. e22, x10^22
      input.className = 'editor-input-field';
      input.value = formatScientific(item.value);
      
      const btnPlus = document.createElement('button');
      btnPlus.type = 'button';
      btnPlus.className = 'step-btn';
      btnPlus.innerHTML = '<span class="material-symbols-outlined">add</span>';
      
      const unitLabel = document.createElement('span');
      unitLabel.className = 'editor-unit-label';
      unitLabel.textContent = item.unit || '';
      
      // Step value set to 1 for all measurement types
      const stepVal = 1;
      btnMinus.addEventListener('click', () => {
        const currentVal = parseScientific(input.value);
        input.value = formatScientific(Math.max(0, currentVal - stepVal));
      });
      btnPlus.addEventListener('click', () => {
        const currentVal = parseScientific(input.value);
        input.value = formatScientific(currentVal + stepVal);
      });

      inputWrapper.appendChild(btnMinus);
      inputWrapper.appendChild(input);
      inputWrapper.appendChild(unitLabel);
      inputWrapper.appendChild(btnPlus);
      
      const actionGrid = document.createElement('div');
      actionGrid.className = 'editor-actions-grid';
      
      const btnSave = document.createElement('button');
      btnSave.type = 'submit';
      btnSave.className = 'editor-btn-save';
      btnSave.style.background = themeColor;
      btnSave.style.color = '#ffffff';
      btnSave.innerHTML = '<span class="material-symbols-outlined">check</span> Save';
      
      const btnCancel = document.createElement('button');
      btnCancel.type = 'button';
      btnCancel.className = 'editor-btn-cancel';
      btnCancel.innerHTML = '<span class="material-symbols-outlined">close</span>';
      btnCancel.addEventListener('click', () => {
        if (onCancel) onCancel();
      });
      
      actionGrid.appendChild(btnCancel);

      if (onDelete) {
        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'editor-btn-delete';
        btnDelete.title = `Delete ${item.name} Bubble`;
        btnDelete.innerHTML = '<span class="material-symbols-outlined">delete_forever</span>';
        btnDelete.addEventListener('click', () => {
          onDelete();
        });
        actionGrid.appendChild(btnDelete);
      }

      actionGrid.appendChild(btnSave);
      
      form.appendChild(inputWrapper);
      form.appendChild(actionGrid);
      content.appendChild(form);
      overlay.appendChild(content);
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newVal = parseScientific(input.value);
        if (onSave) onSave(newVal);
      });

      return overlay;
    }
  }

  const globalScope = typeof globalThis !== 'undefined' ? globalThis : window;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsEditor;
  } else if (typeof exports !== 'undefined') {
    exports.StatsEditor = StatsEditor;
  }

  if (globalScope) {
    globalScope.StatsEditor = StatsEditor;
  }

export { StatsEditor };
export default StatsEditor;
