// index.js

document.addEventListener('DOMContentLoaded', async () => {
    let activeItemIndex = 0;
    let rawData = [];

    // Load initial items from localStorage if available, otherwise fall back to bubbleConfig.js
    const savedData = localStorage.getItem('bubble_carousel_data');
    const configCopy = JSON.parse(JSON.stringify(BUBBLE_CAROUSEL_CONFIG)); // Deep copy config object
    if (savedData) {
      try {
        configCopy.items = JSON.parse(savedData);
      } catch (err) {
        console.error('Failed to parse saved bubble carousel data, resetting to defaults.', err);
        localStorage.removeItem('bubble_carousel_data');
      }
    }

    // 1. Instantiate the Carousel class
    const carousel = new BubbleCarousel('#carousel-mount', {
      config: configCopy,
      
      // Fired when swiped or clicked to another bubble
      onIndexChange: (idx) => {
        activeItemIndex = idx;
        updateHeaderTitle(idx);
      },

      // Fired when any bubble item is clicked
      onItemClick: (item, index, isFocused) => {
        if (item.isAddButton) {
          showAddBubbleOverlay();
          return;
        }

        if (isFocused) {
          // Cycle metrics modes on clicking the active focused bubble
          cycleBubbleUnit(item, index);
        } else {
          carousel.selectIndex(index);
        }
      },

      // Render prop to overlay badge icons
      renderBubbleBadge: (item, index, isFocused) => {
        if (isFocused && !item.isAddButton) {
          const btn = document.createElement('span');
          btn.className = 'material-symbols-outlined custom-edit-trigger';
          btn.textContent = 'edit';
          btn.title = `Edit ${item.name} Value`;
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showInlineEditor(item, index);
          });
          return btn;
        }
        return null;
      }
    });

    // Initialize the carousel
    await carousel.init();
    rawData = carousel.config.items;
    
    // Set initial header title
    updateHeaderTitle(carousel.currentIndex);

    // Render custom header Start/Stop button
    const startStopBtn = document.createElement('button');
    startStopBtn.className = 'start-stop-btn';
    startStopBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
    startStopBtn.title = 'Start';
    startStopBtn.addEventListener('click', () => {
      startStopBtn.classList.toggle('active');
      if (startStopBtn.classList.contains('active')) {
        startStopBtn.innerHTML = '<span class="material-symbols-outlined">stop</span>';
        startStopBtn.title = 'Stop';
      } else {
        startStopBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
        startStopBtn.title = 'Start';
      }
    });
    carousel.setHeaderActions(startStopBtn);

    // Cycle specific bubble's active unit
    function cycleBubbleUnit(item, index) {
      if (!item.units || item.units.length <= 1) return;

      const currentUnit = item.unit;
      const currentIndex = item.units.indexOf(currentUnit);
      const nextIndex = (currentIndex + 1) % item.units.length;
      const nextUnit = item.units[nextIndex];

      rawData = rawData.map((act, idx) => {
        if (idx === index) {
          return { ...act, unit: nextUnit };
        }
        return act;
      });

      // Save unit changes to localStorage
      localStorage.setItem('bubble_carousel_data', JSON.stringify(rawData));

      carousel.updateItems(rawData);
      updateHeaderTitle(index);
    }

    // Dynamic header title update based on focused bubble unit
    function updateHeaderTitle(idx) {
      const activeItem = rawData[idx];
      if (activeItem && !activeItem.isAddButton) {
        const activeUnit = activeItem.unit || '';
        const uppercaseUnit = activeUnit ? ` (${activeUnit.toUpperCase()})` : '';
        carousel.config.title = `${activeItem.name}${uppercaseUnit}`;
      } else {
        carousel.config.title = BUBBLE_CAROUSEL_CONFIG.title || "Bubbles Summary";
      }
      carousel.render();
    }

    // Show Inline Editor Panel in overlay slot
    function showInlineEditor(item, index) {
      // Pass helper properties (resolvedValue and resolvedUnit) to the stats editor
      const tempItem = {
        name: item.name,
        color: item.color,
        value: item.resolvedValue ?? 0,
        unit: item.resolvedUnit ?? ''
      };

      const editorNode = StatsEditor.create(
        tempItem,
        index,
        (newVal) => {
          // Save callback: save to the dynamic key corresponding to active unit
          rawData = rawData.map((act, idx) => {
            if (idx === index) {
              const activeUnit = act.unit;
              if (activeUnit) {
                return { ...act, [activeUnit]: newVal };
              } else {
                return { ...act, value: newVal };
              }
            }
            return act;
          });
          
          // Save value changes to localStorage
          localStorage.setItem('bubble_carousel_data', JSON.stringify(rawData));

          carousel.setOverlayContent(null);
          carousel.updateItems(rawData);
        },
        () => {
          // Cancel callback
          carousel.setOverlayContent(null);
        },
        () => {
          // Delete callback
          if (confirm(`Delete the "${item.name}" bubble and all its associated data?`)) {
            // Remove from rawData
            rawData = rawData.filter((_, idx) => idx !== index);
            
            // Save changes to localStorage
            localStorage.setItem('bubble_carousel_data', JSON.stringify(rawData));

            carousel.setOverlayContent(null);
            carousel.updateItems(rawData);
            
            // Select next valid index so carousel focus behaves correctly
            const nextIndex = Math.min(index, rawData.length - 2); // -2 ignores Add Button at end
            carousel.selectIndex(Math.max(0, nextIndex));
          }
        }
      );

      carousel.setOverlayContent(editorNode);
    }

    // Show Add Bubble Panel in overlay slot
    function showAddBubbleOverlay() {
      const overlayNode = AddBubble.create(
        rawData,
        (newBubble) => {
          // Save callback: add new item to rawData (place it right before the "Add New" button)
          const insertIndex = rawData.length - 1;
          rawData.splice(insertIndex, 0, newBubble);

          // Save changes to localStorage
          localStorage.setItem('bubble_carousel_data', JSON.stringify(rawData));

          carousel.setOverlayContent(null);
          carousel.updateItems(rawData);
          
          // Focus the newly added bubble
          carousel.selectIndex(insertIndex);
        },
        () => {
          // Cancel callback
          carousel.setOverlayContent(null);
        }
      );

      carousel.setOverlayContent(overlayNode);
    }

    // Reset defaults button logic
    const resetDefaultsBtn = document.getElementById('reset-defaults-btn');
    if (resetDefaultsBtn) {
      resetDefaultsBtn.addEventListener('click', () => {
        if (confirm('Revert all values to bubbleConfig.js defaults?')) {
          localStorage.removeItem('bubble_carousel_data');
          window.location.reload();
        }
      });
    }

    // Interactive Theme Switcher logic
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeBtnText = document.getElementById('theme-btn-text');
    const mountElement = document.getElementById('carousel-mount');

    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light');
      mountElement.classList.toggle('light-theme');
      
      const isLight = document.body.classList.contains('light');
      if (isLight) {
        themeToggleBtn.querySelector('.material-symbols-outlined').textContent = 'dark_mode';
        themeBtnText.textContent = 'Dark Mode';
      } else {
        themeToggleBtn.querySelector('.material-symbols-outlined').textContent = 'light_mode';
        themeBtnText.textContent = 'Light Mode';
      }
      
      carousel.render();
    });
});