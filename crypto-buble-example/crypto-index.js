// crypto-buble-example/crypto-index.js

document.addEventListener('DOMContentLoaded', async () => {
  const mountPoint = '#carousel-mount';
  const container = document.querySelector(mountPoint);
  
  if (!container) {
    console.error('Mount point not found');
    return;
  }

  // 1. Show premium loading state
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); font-family: 'Outfit', sans-serif;">
      <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 1rem; animation: spin 1.5s linear infinite;">sync</span>
      <span style="font-size: 1.1rem; font-weight: 500; letter-spacing: 0.05em;">FETCHING MARKET DATA...</span>
    </div>
  `;

  let rawData = [];
  let carousel = null;

  // Helper to format currency values based on asset scale
  function formatCurrency(val, currencyCode) {
    const formatter = new Intl.NumberFormat(navigator.language || 'en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: val < 5 ? 4 : 2,
      maximumFractionDigits: val < 5 ? 4 : 2
    });
    return formatter.format(val);
  }

  try {
    // 2. Fetch data from CoinGecko
    const fetchedItems = await CryptoConfigHelper.fetchCryptoData();
    
    // Apply user's currency preferences from localStorage if present
    const savedUnits = JSON.parse(localStorage.getItem('crypto_bubble_carousel_units') || '{}');
    rawData = fetchedItems.map(item => ({
      ...item,
      unit: savedUnits[item.id] || item.unit
    }));

    // 3. Initialize BubbleCarousel
    carousel = new BubbleCarousel(mountPoint, {
      config: {
        title: 'Crypto Market Summary',
        baseBubbleSize: 120,
        maxGrowth: 50,
        defaultIndex: 0,
        items: rawData
      },
      autoTitle: false,
      enableDefaultUnitCycling: false,

      onIndexChange: (idx) => {
        updateHeaderTitle(idx);
      },

      onItemClick: (item, index, isFocused) => {
        if (isFocused) {
          cycleBubbleUnit(item, index);
        } else {
          carousel.selectIndex(index);
        }
      },

      // Custom HTML renderer inside bubble circles
      renderBubbleContent: (item, isFocused, dynamicSize) => {
        const displayVal = item.resolvedValue ?? 0;
        const formattedPrice = formatCurrency(displayVal, item.resolvedUnit);
        const charCount = formattedPrice.length;

        // Use dynamicSize passed from the root component to calculate absolute pixel font sizes
        // Max font scale is 14.5% of dynamicSize, scaling down for longer text strings
        const fontScale = Math.min(0.145, 1.5 / Math.max(8, charCount));
        
        const symbolFontSize = Math.max(9, Math.round(dynamicSize * 0.095)) + 'px';
        const priceFontSize = Math.max(11, Math.round(dynamicSize * fontScale)) + 'px';
        const dynamicsFontSize = Math.max(9, Math.round(dynamicSize * 0.085)) + 'px';
        const padding = Math.round(dynamicSize * 0.06) + 'px';

        const changePct = item.dynamics ? (item.dynamics[item.resolvedUnit] || 0) : 0;
        const isUp = changePct >= 0;

        return `
          <div class="crypto-bubble-content" style="padding: ${padding};">
            <span class="crypto-symbol" style="font-size: ${symbolFontSize}; margin-bottom: ${Math.round(dynamicSize * 0.02)}px;">${item.symbol}</span>
            <span class="crypto-price" style="font-size: ${priceFontSize};">${formattedPrice}</span>
            <span class="crypto-dynamics ${isUp ? 'up' : 'down'}" style="font-size: ${dynamicsFontSize}; margin-top: ${Math.round(dynamicSize * 0.02)}px;">
              ${isUp ? '▲' : '▼'} ${Math.abs(changePct).toFixed(2)}%
            </span>
          </div>
        `;
      },

      // Disable editing badge
      renderBubbleBadge: () => null
    });

    // Override size calculation to scale up the bubble size to fit long text strings
    carousel.calculateBubbleSize = function(item) {
      if (item.isAddButton) return 85;
      
      const activeUnit = item.unit || 'usd';
      const price = item[activeUnit] ?? 0;
      
      const baseBubbleSize = this.config.baseBubbleSize || 120;
      const maxGrowth = this.config.maxGrowth || 50;
      let ratio = 0.6;
      if (item.goals && item.goals[activeUnit] > 0) {
        ratio = price / item.goals[activeUnit];
      }
      ratio = Math.max(0, Math.min(ratio, 1.5));
      const originalSize = Math.round(baseBubbleSize + ratio * maxGrowth);

      // Re-calculate minimum size based on formatted price string length
      const formattedPrice = formatCurrency(price, activeUnit);
      const charCount = formattedPrice.length;
      const minSizeForText = Math.max(120, charCount * 15.5);

      return Math.round(Math.max(originalSize, minSizeForText));
    };

    await carousel.init();
    updateHeaderTitle(carousel.currentIndex);

    // 4. Configure "Refresh Prices" Button
    const refreshBtn = document.getElementById('reset-defaults-btn');
    if (refreshBtn) {
      // Modify text & icon of original Reset button dynamically
      refreshBtn.querySelector('.material-symbols-outlined').textContent = 'sync';
      refreshBtn.querySelector('span:not(.material-symbols-outlined)').textContent = 'Refresh Prices';
      
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.classList.add('spinning');
        CryptoConfigHelper.clearCache();
        try {
          const freshItems = await CryptoConfigHelper.fetchCryptoData();
          const currentUnits = JSON.parse(localStorage.getItem('crypto_bubble_carousel_units') || '{}');
          rawData = freshItems.map(item => ({
            ...item,
            unit: currentUnits[item.id] || item.unit
          }));
          carousel.updateItems(rawData);
          updateHeaderTitle(carousel.currentIndex);
        } catch (err) {
          alert('Failed to refresh market data: ' + err.message);
        } finally {
          refreshBtn.classList.remove('spinning');
        }
      });
    }

    // 5. Interactive Theme Switcher logic
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeBtnText = document.getElementById('theme-btn-text');

    if (themeToggleBtn && themeBtnText) {
      themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light');
        container.classList.toggle('light-theme');
        
        const isLight = document.body.classList.contains('light');
        if (isLight) {
          themeToggleBtn.querySelector('.material-symbols-outlined').textContent = 'dark_mode';
          themeBtnText.textContent = 'Dark Mode';
        } else {
          themeToggleBtn.querySelector('.material-symbols-outlined').textContent = 'light_mode';
          themeBtnText.textContent = 'Light Mode';
        }
        
        if (carousel) {
          carousel.render();
        }
      });
    }

  } catch (err) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--error); font-family: 'Outfit', sans-serif; text-align: center; padding: 2rem;">
        <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 1rem;">error</span>
        <span style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">FAILED TO LOAD MARKET DATA</span>
        <p style="font-size: 0.9rem; opacity: 0.8; margin: 0;">${err.message || 'Please check your connection.'}</p>
      </div>
    `;
  }

  // Cycle unit for a specific bubble and save preference
  function cycleBubbleUnit(item, index) {
    if (!item.units || item.units.length <= 1) return;

    const currentUnit = item.unit;
    const currentIndex = item.units.indexOf(currentUnit);
    const nextIndex = (currentIndex + 1) % item.units.length;
    const nextUnit = item.units[nextIndex];

    rawData = rawData.map((coin, idx) => {
      if (idx === index) {
        return { ...coin, unit: nextUnit };
      }
      return coin;
    });

    // Save unit preferences
    const savedUnits = JSON.parse(localStorage.getItem('crypto_bubble_carousel_units') || '{}');
    savedUnits[item.id] = nextUnit;
    localStorage.setItem('crypto_bubble_carousel_units', JSON.stringify(savedUnits));

    carousel.updateItems(rawData);
    updateHeaderTitle(index);
  }

  // Dynamic header title update based on focused coin
  function updateHeaderTitle(idx) {
    const activeItem = rawData[idx];
    let titleText = 'Crypto Market Summary';
    if (activeItem) {
      const activeUnit = activeItem.unit || 'usd';
      titleText = `${activeItem.name} (${activeItem.symbol}) in ${activeUnit.toUpperCase()}`;
    }
    
    carousel.config.title = titleText;
    
    // Directly update the DOM title text
    const titleEl = container.querySelector('.widget-title');
    if (titleEl) {
      titleEl.textContent = titleText;
    }
    
    carousel.render();
  }
});
