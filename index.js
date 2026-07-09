// index.js

document.addEventListener('DOMContentLoaded', async () => {
    let activeItemIndex = 0;

    // 1. Instantiate the Carousel class
    const carousel = new BubbleCarousel('#carousel-mount', {
      config: BUBBLE_CAROUSEL_CONFIG,
      persistKey: 'bubble_carousel_data',
      autoTitle: true,
      enableDefaultUnitCycling: true,
      
      // Fired when swiped or clicked to another bubble
      onIndexChange: (idx) => {
        activeItemIndex = idx;
      },

      // Fired when any bubble item is clicked
      onItemClick: (item, index, isFocused) => {
        if (item.isAddButton) {
          showAddBubbleOverlay();
          return;
        }
      },

      // Render prop to overlay badge icons
      renderBubbleBadge: (item, index, isFocused) => {
        if (isFocused && !item.isAddButton) {
          const btn = document.createElement('span');
          btn.className = 'material-symbols-outlined custom-edit-trigger';
          if (index === 'center') {
            btn.classList.add('center-edit-trigger');
          }
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
    activeItemIndex = carousel.currentIndex;

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
          // Save callback
          carousel.updateItemValue(index, newVal);
          carousel.setOverlayContent(null);
        },
        () => {
          // Cancel callback
          carousel.setOverlayContent(null);
        },
        index === 'center' ? null : () => {
          // Delete callback
          if (confirm(`Delete the "${item.name}" bubble and all its associated data?`)) {
            // Remove from items
            carousel.config.items = carousel.config.items.filter((_, idx) => idx !== index);
            carousel.saveState();
            carousel.setOverlayContent(null);
            carousel.updateItems(carousel.config.items);
            
            // Select next valid index so carousel focus behaves correctly
            const nextIndex = Math.min(index, carousel.config.items.length - 2); // -2 ignores Add Button at end
            carousel.selectIndex(Math.max(0, nextIndex));
          }
        }
      );

      carousel.setOverlayContent(editorNode);
    }

    // Show Add Bubble Panel in overlay slot
    function showAddBubbleOverlay() {
      const items = carousel.config.items;
      const overlayNode = AddBubble.create(
        items,
        (newBubble) => {
          // Save callback: add new item to items (place it right before the "Add New" button)
          const insertIndex = items.length - 1;
          items.splice(insertIndex, 0, newBubble);

          carousel.saveState();
          carousel.setOverlayContent(null);
          carousel.updateItems(items);
          
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
          carousel.resetDefaults();
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