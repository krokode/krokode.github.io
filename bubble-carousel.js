// 3DBubbleCarousel/bubble-carousel.js

(() => {
  const DIGITS_TO_SUPERSCRIPT = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻'
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

  class BubbleCarousel {
    constructor(elementOrSelector, options = {}) {
      this.container = typeof elementOrSelector === 'string' ? document.querySelector(elementOrSelector) : elementOrSelector;
      this.configPath = options.configPath || null;
      this.config = options.config || null; // Direct configuration object override
      this.onIndexChange = options.onIndexChange || null;
      this.onItemClick = options.onItemClick || null;
      this.renderBubbleBadge = options.renderBubbleBadge || null;
      this.renderBubbleContent = options.renderBubbleContent || null;
      this.overlayContent = options.overlayContent || null;

      this.persistKey = options.persistKey || null;
      this.autoTitle = options.autoTitle !== undefined ? options.autoTitle : true;
      this.enableDefaultUnitCycling = options.enableDefaultUnitCycling !== undefined ? options.enableDefaultUnitCycling : true;

      // Internal state
      this.currentIndex = 0;
      this.dragOffset = 0;
      this.isDragging = false;
      this.startX = 0;
      this.dragActive = false;
      this.needsRebuild = true; // Flag to rebuild DOM nodes only when data changes

      // Dimensions
      this.containerWidth = 800;
      this.containerHeight = 350;
      this.resizeObserver = null;
      
      // Bound functions for global listener removal
      this.globalMouseMove = null;
      this.globalMouseUp = null;

      // Center bubble foreground pop state
      this.centerBubbleInForeground = false;
      this.foregroundTimeoutId = null;
      this.originalConfigTitle = '';
    }

    async init() {
      if (!this.container) {
        console.error('BubbleCarousel: Container element not found.');
        return;
      }

      // Load configuration from path if config object is not directly supplied
      if (this.configPath && !this.config) {
        try {
          const response = await fetch(this.configPath);
          if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);
          this.config = await response.json();
        } catch (err) {
          console.error('BubbleCarousel: Failed to load config from path:', this.configPath, err);
          return;
        }
      }

      if (!this.config || !this.config.items) {
        console.error('BubbleCarousel: No valid configuration or items provided.');
        return;
      }

      this.originalConfigTitle = this.config.title || '';
      this.loadState();

      this.currentIndex = this.config.defaultIndex !== undefined ? this.config.defaultIndex : 0;
      this.updateAutoTitle();

      this.buildDOM();
      this.setupResizeObserver();
      this.bindEvents();
      
      this.needsRebuild = true;
      this.render();
    }

    buildDOM() {
      this.container.innerHTML = '';
      this.container.classList.add('bubble-carousel-widget-card');

      // Header
      if (this.config.title) {
        const header = document.createElement('div');
        header.className = 'widget-header';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'widget-title';
        titleSpan.textContent = this.config.title;
        header.appendChild(titleSpan);

        this.headerActionsContainer = document.createElement('div');
        this.headerActionsContainer.className = 'header-actions';
        header.appendChild(this.headerActionsContainer);

        this.container.appendChild(header);
      }

      // Bubbles wrapper
      this.bubblesWrapper = document.createElement('div');
      this.bubblesWrapper.className = 'bubble-carousel-container';
      this.container.appendChild(this.bubblesWrapper);

      // Overlay container (for editors, modals, etc.)
      this.overlayContainer = document.createElement('div');
      this.overlayContainer.className = 'overlay-container';
      this.container.appendChild(this.overlayContainer);
    }

    setupResizeObserver() {
      if (!this.bubblesWrapper) return;

      if (!window.ResizeObserver) {
        this.containerWidth = this.bubblesWrapper.clientWidth;
        this.containerHeight = this.bubblesWrapper.clientHeight;
        return;
      }

      this.resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const rect = entry.contentRect;
          this.containerWidth = rect.width || this.bubblesWrapper.clientWidth;
          this.containerHeight = rect.height || this.bubblesWrapper.clientHeight;
          this.needsRebuild = true; // Container size factors changed, recreate DOM elements
          this.render();
        }
      });
      this.resizeObserver.observe(this.bubblesWrapper);
    }

    bindEvents() {
      if (!this.bubblesWrapper) return;

      // Mouse handlers
      this.bubblesWrapper.addEventListener('mousedown', (e) => this.dragStart(e.clientX));
      
      this.globalMouseMove = (e) => this.dragMove(e.clientX);
      this.globalMouseUp = () => this.dragEnd();

      window.addEventListener('mousemove', this.globalMouseMove);
      window.addEventListener('mouseup', this.globalMouseUp);

      // Touch handlers
      this.bubblesWrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) this.dragStart(e.touches[0].clientX);
      }, { passive: true });

      this.bubblesWrapper.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) this.dragMove(e.touches[0].clientX);
      }, { passive: true });

      this.bubblesWrapper.addEventListener('touchend', () => this.dragEnd());
      this.bubblesWrapper.addEventListener('touchcancel', () => this.dragEnd());
    }

    dragStart(clientX) {
      this.isDragging = true;
      this.startX = clientX;
      this.dragActive = false;
      this.dragOffset = 0;
      this.render();
    }

    dragMove(clientX) {
      if (!this.isDragging) return;
      const deltaX = clientX - this.startX;
      if (Math.abs(deltaX) > 10) {
        this.dragActive = true;
      }
      this.dragOffset = -deltaX / 150;
      this.render(); // Style update only
    }

    dragEnd() {
      if (!this.isDragging) return;
      this.isDragging = false;

      const totalOffset = this.dragOffset;
      this.dragOffset = 0;

      if (Math.abs(totalOffset) > 0.2) {
        const snapOffset = Math.round(totalOffset);
        if (snapOffset !== 0) {
          const numItems = this.config.items ? this.config.items.length : 0;
          if (numItems > 0) {
            const targetIndex = (this.currentIndex + snapOffset + numItems * 10) % numItems;
            this.selectIndex(targetIndex);
            return;
          }
        }
      }
      this.render();
    }

    selectIndex(idx) {
      const numItems = this.config.items ? this.config.items.length : 0;
      if (numItems === 0) return;

      this.currentIndex = Math.max(0, Math.min(idx, numItems - 1));
      this.needsRebuild = true; // Focus index changed, recreate badges on the new active bubble
      this.updateAutoTitle();
      if (this.onIndexChange) {
        this.onIndexChange(this.currentIndex);
      }
      this.render();
    }

    handleBubbleClick(item, index) {
      const isFocused = index === this.currentIndex || index === 'center';

      if (index === 'center') {
        // Bring to foreground for 2 seconds
        this.centerBubbleInForeground = true;
        if (this.foregroundTimeoutId) {
          clearTimeout(this.foregroundTimeoutId);
        }
        this.foregroundTimeoutId = setTimeout(() => {
          this.centerBubbleInForeground = false;
          this.updateAutoTitle();
          this.render();
        }, 2000);
        this.updateAutoTitle();
        this.render();
      }

      if (isFocused && this.enableDefaultUnitCycling && !item.isAddButton) {
        this.cycleBubbleUnit(item, index);
      }

      if (this.onItemClick) {
        this.onItemClick(item, index, isFocused);
      } else {
        if (index !== this.currentIndex && index !== 'center') {
          this.selectIndex(index);
        }
      }
    }

    calculateBubbleSize(item) {
      const baseBubbleSize = this.config.baseBubbleSize || 120;
      const maxGrowth = this.config.maxGrowth || 50;

      if (item.isAddButton) {
        return 85;
      }

      const activeUnit = item.unit || '';
      const displayVal = (activeUnit && item[activeUnit] !== undefined) ? item[activeUnit] : (item.value ?? 0);
      
      // Resolve ratio: use goal progress if defined, otherwise fall back to logarithmic scaling
      let ratio;
      const valNum = Math.abs(Number(displayVal)) || 0;
      
      let displayGoal = item.goal;
      if (activeUnit && item.goals && item.goals[activeUnit] !== undefined) {
        displayGoal = item.goals[activeUnit];
      }

      if (displayGoal !== undefined && displayGoal !== null && displayGoal > 0) {
        ratio = valNum / displayGoal;
      } else {
        // Continuous logarithmic scaling fallback: normalizes arbitrary scales monotonically
        if (valNum <= 0) {
          ratio = 0;
        } else {
          ratio = Math.log10(valNum) / 4; // log10(10000) = 4, which equals 100% (1.0 ratio)
        }
      }
      
      if (isNaN(ratio) || !isFinite(ratio)) ratio = 0;
      ratio = Math.max(0, Math.min(ratio, 1.5));

      return Math.round(baseBubbleSize + ratio * maxGrowth);
    }

    rebuildBubbleElements() {
      if (!this.bubblesWrapper || !this.config || !this.config.items) return;

      const items = this.config.items;
      const bubbleScaleFactor = this.config.bubbleScaleFactor ?? Math.min(1.0, Math.max(0.45, this.containerHeight / 350));

      this.bubblesWrapper.innerHTML = '';

      items.forEach((item, index) => {
        const activeUnit = item.unit || '';
        const resolvedVal = (activeUnit && item[activeUnit] !== undefined) ? item[activeUnit] : (item.value ?? 0);
        
        // Inject helper fields for custom render props
        item.resolvedValue = resolvedVal;
        item.resolvedUnit = activeUnit || item.unit || '';

        // Wrapper element
        const bubbleWrapper = document.createElement('div');
        bubbleWrapper.className = 'activity-bubble-wrapper';
        bubbleWrapper.setAttribute('data-index', index);

        // Click handler
        bubbleWrapper.addEventListener('click', (e) => {
          if (this.dragActive) return;
          this.handleBubbleClick(item, index);
        });

        // Label element (rendered below circle)
        const label = document.createElement('div');
        label.className = 'bubble-label';
        label.style.color = item.isAddButton ? 'var(--add-bubble-text)' : (item.labelColor || item.color);
        label.textContent = item.name;

        // Bubble circle element
        const circle = document.createElement('div');
        circle.className = 'bubble-circle';

        const rawSize = this.calculateBubbleSize(item);
        const dynamicSize = Math.round(rawSize * bubbleScaleFactor);

        circle.style.background = item.isAddButton ? 'var(--add-bubble-bg)' : item.color;
        circle.style.border = item.isAddButton ? '1px solid var(--add-bubble-border)' : 'none';
        circle.style.width = `${dynamicSize}px`;
        circle.style.height = `${dynamicSize}px`;
        circle.style.color = item.textColor || (item.isAddButton ? 'var(--add-bubble-text)' : 'inherit');
        circle.style.position = 'relative';

        // Bubble content rendering
        if (this.renderBubbleContent) {
          const customContent = this.renderBubbleContent(item, index === this.currentIndex, dynamicSize);
          if (typeof customContent === 'string') {
            circle.innerHTML = customContent;
          } else if (customContent instanceof HTMLElement) {
            circle.appendChild(customContent);
          }
        } else {
          if (item.isAddButton) {
            const plusSpan = document.createElement('span');
            plusSpan.className = 'bubble-val';
            plusSpan.style.fontSize = `${Math.round(dynamicSize * 0.28)}px`;
            plusSpan.textContent = '+';
            circle.appendChild(plusSpan);
          } else {
            const displayVal = formatScientific(resolvedVal);
            const charCount = displayVal.length;

            let valFontSize;
            if (charCount <= 2) {
              valFontSize = Math.round(dynamicSize * 0.28);
            } else if (charCount <= 4) {
              valFontSize = Math.round(dynamicSize * 0.23);
            } else if (charCount <= 6) {
              valFontSize = Math.round(dynamicSize * 0.18);
            } else {
              valFontSize = Math.round(dynamicSize * 0.14);
            }

            const valSpan = document.createElement('span');
            valSpan.className = 'bubble-val';
            valSpan.style.fontSize = `${valFontSize}px`;
            valSpan.textContent = displayVal;
            circle.appendChild(valSpan);

            const displayUnit = activeUnit || item.unit || '';
            if (displayUnit) {
              const unitSpan = document.createElement('span');
              unitSpan.className = 'bubble-unit';
              unitSpan.style.fontSize = `${Math.round(dynamicSize * 0.11)}px`;
              unitSpan.textContent = displayUnit;
              circle.appendChild(unitSpan);
            }
          }
        }

        // Badge overlay rendering (e.g. edit triggers, climb controls)
        if (this.renderBubbleBadge) {
          const badgeNode = this.renderBubbleBadge(item, index, index === this.currentIndex);
          if (badgeNode) {
            if (typeof badgeNode === 'string') {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = badgeNode;
              circle.appendChild(tempDiv.firstElementChild);
            } else if (badgeNode instanceof HTMLElement) {
              circle.appendChild(badgeNode);
            }
          }
        }

        bubbleWrapper.appendChild(circle);
        bubbleWrapper.appendChild(label);
        this.bubblesWrapper.appendChild(bubbleWrapper);
      });

      // Render center bubble if configured and enabled
      if (this.config.centerBubbleEnabled && this.config.centerBubble) {
        const item = this.config.centerBubble;
        const activeUnit = item.unit || '';
        const resolvedVal = (activeUnit && item[activeUnit] !== undefined) ? item[activeUnit] : (item.value ?? 0);

        item.resolvedValue = resolvedVal;
        item.resolvedUnit = activeUnit || item.unit || '';

        const rawSize = this.calculateBubbleSize(item) * 2;
        const maxCircleSize = Math.max(100, Math.round(this.containerHeight * 0.55));
        const dynamicSize = Math.min(Math.round(rawSize * bubbleScaleFactor), maxCircleSize);

        const bubbleWrapper = document.createElement('div');
        bubbleWrapper.className = 'activity-bubble-wrapper center-bubble';
        bubbleWrapper.setAttribute('data-index', 'center');
        bubbleWrapper.style.width = `${dynamicSize}px`;
        bubbleWrapper.style.height = `${dynamicSize + 30}px`;

        bubbleWrapper.addEventListener('click', (e) => {
          if (this.dragActive) return;
          this.handleBubbleClick(item, 'center');
        });

        const label = document.createElement('div');
        label.className = 'bubble-label';
        label.style.color = item.labelColor || item.color;
        label.textContent = item.name;
        bubbleWrapper.appendChild(label);

        const circle = document.createElement('div');
        circle.className = 'bubble-circle';

        circle.style.background = item.color;
        circle.style.width = `${dynamicSize}px`;
        circle.style.height = `${dynamicSize}px`;
        circle.style.color = item.textColor || 'inherit';
        circle.style.position = 'relative';

        if (this.renderBubbleContent) {
          const customContent = this.renderBubbleContent(item, true, dynamicSize);
          if (typeof customContent === 'string') {
            circle.innerHTML = customContent;
          } else if (customContent instanceof HTMLElement) {
            circle.appendChild(customContent);
          }
        } else {
          const displayVal = formatScientific(resolvedVal);
          const charCount = displayVal.length;

          let valFontSize;
          if (charCount <= 2) {
            valFontSize = Math.round(dynamicSize * 0.28);
          } else if (charCount <= 4) {
            valFontSize = Math.round(dynamicSize * 0.23);
          } else if (charCount <= 6) {
            valFontSize = Math.round(dynamicSize * 0.18);
          } else {
            valFontSize = Math.round(dynamicSize * 0.14);
          }

          const valSpan = document.createElement('span');
          valSpan.className = 'bubble-val';
          valSpan.style.fontSize = `${valFontSize}px`;
          valSpan.textContent = displayVal;
          circle.appendChild(valSpan);

          const displayUnit = activeUnit || item.unit || '';
          if (displayUnit) {
            const unitSpan = document.createElement('span');
            unitSpan.className = 'bubble-unit';
            unitSpan.style.fontSize = `${Math.round(dynamicSize * 0.11)}px`;
            unitSpan.textContent = displayUnit;
            circle.appendChild(unitSpan);
          }
        }

        if (this.renderBubbleBadge) {
          const badgeNode = this.renderBubbleBadge(item, 'center', true);
          if (badgeNode) {
            if (typeof badgeNode === 'string') {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = badgeNode;
              circle.appendChild(tempDiv.firstElementChild);
            } else if (badgeNode instanceof HTMLElement) {
              circle.appendChild(badgeNode);
            }
          }
        }

        bubbleWrapper.appendChild(circle);
        this.bubblesWrapper.appendChild(bubbleWrapper);
      }
    }

    render() {
      if (!this.bubblesWrapper || !this.config || !this.config.items) return;

      const items = this.config.items;
      const numItems = items.length;
      if (numItems === 0) return;

      // 1. Rebuild DOM elements only when data structure or layout changes
      if (this.needsRebuild) {
        this.rebuildBubbleElements();
        this.needsRebuild = false;
      }

      // 2. Perform style updates only (high-performance rendering during drags)
      const radiusX = this.config.radiusX ?? Math.max(130, Math.min(this.containerWidth * 0.36, 750));
      const radiusY = this.config.radiusY ?? Math.max(30, Math.min(this.containerHeight * 0.22, 120));

      const bubbleWrappers = this.bubblesWrapper.querySelectorAll('.activity-bubble-wrapper');

      bubbleWrappers.forEach((bubbleWrapper) => {
        const indexAttr = bubbleWrapper.getAttribute('data-index');
        if (indexAttr === 'center') {
          bubbleWrapper.style.transform = 'translate3d(0, 0, 0) scale(1.1)';
          bubbleWrapper.style.opacity = '1';
          bubbleWrapper.style.zIndex = this.centerBubbleInForeground ? '300' : '100';
          bubbleWrapper.style.cursor = 'pointer';
          bubbleWrapper.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.5s ease';
          return;
        }

        const index = parseInt(indexAttr, 10);
        const offsetIndex = index - (this.currentIndex + this.dragOffset);
        const normalizedOffset = offsetIndex < -numItems / 2 ? offsetIndex + numItems : offsetIndex > numItems / 2 ? offsetIndex - numItems : offsetIndex;

        const angle = (normalizedOffset * (2 * Math.PI)) / numItems;

        // Coordinate calculations
        const x_flat = Math.sin(angle) * radiusX;
        const y_flat = Math.cos(angle) * radiusY;
        const z = Math.cos(angle);

        const tiltAngle = -15 * Math.PI / 180;
        const x = x_flat * Math.cos(tiltAngle) - y_flat * Math.sin(tiltAngle);
        const y = x_flat * Math.sin(tiltAngle) + y_flat * Math.cos(tiltAngle);

        const depthScale = (z + 2) / 3;
        const opacity = (z + 1.8) / 2.8;
        const zIndex = Math.round((z + 1) * 100);

        bubbleWrapper.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${depthScale})`;
        bubbleWrapper.style.opacity = opacity;
        bubbleWrapper.style.zIndex = zIndex;
        bubbleWrapper.style.cursor = this.isDragging ? 'grabbing' : 'pointer';
        
        // Temporarily remove transition styles during mouse/touch drag events for instant visual feedback
        bubbleWrapper.style.transition = this.isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.5s ease';
      });

      this.bubblesWrapper.style.cursor = this.isDragging ? 'grabbing' : 'grab';
      
      // Render Header Actions
      if (this.headerActionsContainer && this.headerActionsNode) {
        if (this.headerActionsContainer.children.length === 0) {
          if (typeof this.headerActionsNode === 'string') {
            this.headerActionsContainer.innerHTML = this.headerActionsNode;
          } else {
            this.headerActionsContainer.appendChild(this.headerActionsNode);
          }
        }
      }

      // Render Overlay Content
      if (this.overlayContainer) {
        if (this.overlayContentNode) {
          if (this.overlayContainer.children.length === 0) {
            if (typeof this.overlayContentNode === 'string') {
              this.overlayContainer.innerHTML = this.overlayContentNode;
            } else {
              this.overlayContainer.appendChild(this.overlayContentNode);
            }
          }
        } else {
          this.overlayContainer.innerHTML = '';
        }
      }
    }

    setHeaderActions(node) {
      this.headerActionsNode = node;
      this.render();
    }

    setOverlayContent(node) {
      this.overlayContentNode = node;
      this.render();
    }

    updateItems(newItems) {
      if (this.config) {
        this.config.items = newItems;
        this.needsRebuild = true; // Signal DOM refresh
        this.updateAutoTitle();
        this.render();
      }
    }

    loadState() {
      if (!this.persistKey) return;
      try {
        const savedData = localStorage.getItem(this.persistKey);
        if (savedData) {
          this.config.items = JSON.parse(savedData);
        }
        
        if (this.config.centerBubbleEnabled && this.config.centerBubble) {
          const savedCenterData = localStorage.getItem(this.persistKey + '_center');
          if (savedCenterData) {
            this.config.centerBubble = JSON.parse(savedCenterData);
          }
        }
      } catch (err) {
        console.error('BubbleCarousel: Failed to load state from localStorage:', err);
      }
    }

    saveState() {
      if (!this.persistKey) return;
      try {
        localStorage.setItem(this.persistKey, JSON.stringify(this.config.items));
        if (this.config.centerBubbleEnabled && this.config.centerBubble) {
          localStorage.setItem(this.persistKey + '_center', JSON.stringify(this.config.centerBubble));
        }
      } catch (err) {
        console.error('BubbleCarousel: Failed to save state to localStorage:', err);
      }
    }

    updateTitle(newTitle) {
      if (this.config) {
        this.config.title = newTitle;
      }
      if (this.container) {
        const titleEl = this.container.querySelector('.widget-title');
        if (titleEl) {
          titleEl.textContent = newTitle;
        }
      }
    }

    updateAutoTitle() {
      if (!this.autoTitle || !this.config) return;
      
      let activeItem;
      if (this.config.centerBubbleEnabled && this.centerBubbleInForeground) {
        activeItem = this.config.centerBubble;
      } else {
        activeItem = this.config.items[this.currentIndex];
      }
      
      if (activeItem && !activeItem.isAddButton) {
        const activeUnit = activeItem.unit || '';
        const uppercaseUnit = activeUnit ? ` (${activeUnit.toUpperCase()})` : '';
        this.updateTitle(`${activeItem.name}${uppercaseUnit}`);
      } else {
        this.updateTitle(this.originalConfigTitle || "Bubbles Summary");
      }
    }

    cycleBubbleUnit(item, index) {
      if (!item.units || item.units.length <= 1) return;

      const currentUnit = item.unit;
      const currentIndex = item.units.indexOf(currentUnit);
      const nextIndex = (currentIndex + 1) % item.units.length;
      const nextUnit = item.units[nextIndex];

      if (index === 'center') {
        this.config.centerBubble = {
          ...this.config.centerBubble,
          unit: nextUnit
        };
      } else {
        this.config.items = this.config.items.map((act, idx) => {
          if (idx === index) {
            return { ...act, unit: nextUnit };
          }
          return act;
        });
      }

      this.saveState();
      this.needsRebuild = true;
      this.updateAutoTitle();
      this.render();
    }

    updateItemValue(index, newValue) {
      if (index === 'center') {
        const item = this.config.centerBubble;
        const activeUnit = item.unit;
        if (activeUnit) {
          this.config.centerBubble = {
            ...this.config.centerBubble,
            [activeUnit]: newValue
          };
        } else {
          this.config.centerBubble = {
            ...this.config.centerBubble,
            value: newValue
          };
        }
      } else {
        this.config.items = this.config.items.map((act, idx) => {
          if (idx === index) {
            const activeUnit = act.unit;
            if (activeUnit) {
              return { ...act, [activeUnit]: newValue };
            } else {
              return { ...act, value: newValue };
            }
          }
          return act;
        });
      }

      this.saveState();
      this.needsRebuild = true;
      this.updateAutoTitle();
      this.render();
    }

    resetDefaults() {
      if (this.persistKey) {
        localStorage.removeItem(this.persistKey);
        localStorage.removeItem(this.persistKey + '_center');
      }
      window.location.reload();
    }

    destroy() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      
      if (this.globalMouseMove) {
        window.removeEventListener('mousemove', this.globalMouseMove);
      }
      if (this.globalMouseUp) {
        window.removeEventListener('mouseup', this.globalMouseUp);
      }
    }
  }

  // Export for ES modules, fallback to global for direct script inclusion
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BubbleCarousel;
  } else if (typeof exports !== 'undefined') {
    exports.BubbleCarousel = BubbleCarousel;
  } else {
    window.BubbleCarousel = BubbleCarousel;
  }
})();
