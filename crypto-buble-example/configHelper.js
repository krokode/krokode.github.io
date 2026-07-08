// crypto-buble-example/configHelper.js

(function () {
  const COINS = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'tether', symbol: 'USDT', name: 'Tether' },
    { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin' },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' }
  ];

  const CURRENCIES = ['usd', 'eur', 'cny', 'rub', 'aed'];
  const CACHE_KEY = 'crypto_bubble_carousel_cache';
  const CACHE_TIME_KEY = 'crypto_bubble_carousel_cache_time';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Generates 7 HSL colors distributed evenly across the hue spectrum, shuffled randomly
  function generateUniqueColors() {
    const count = COINS.length;
    const startHue = Math.floor(Math.random() * 360);
    const hues = COINS.map((_, i) => (startHue + (i * (360 / count))) % 360);

    // Fisher-Yates Shuffle
    for (let i = hues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hues[i], hues[j]] = [hues[j], hues[i]];
    }

    return hues.map(hue => `hsl(${Math.round(hue)}, 80%, 55%)`);
  }

  // Fetch prices and 30-day dynamics for all 5 currencies
  async function fetchCryptoData() {
    // 1. Check Cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime, 10) < CACHE_DURATION)) {
      try {
        console.log('Loading cryptocurrency data from cache');
        return JSON.parse(cachedData);
      } catch (e) {
        console.error('Failed to parse cached data, fetching fresh.', e);
      }
    }

    console.log('Fetching fresh cryptocurrency data from CoinGecko API...');
    const coinIdsStr = COINS.map(c => c.id).join(',');
    const colors = generateUniqueColors();

    try {
      // Fetch data for all currencies in parallel
      const fetchPromises = CURRENCIES.map(async (currency) => {
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=${coinIdsStr}&price_change_percentage=30d`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error fetching ${currency}: ${res.status}`);
        }
        const data = await res.json();
        return { currency, data };
      });

      const results = await Promise.all(fetchPromises);

      // Structure data by coin
      const coinDataMap = {};
      COINS.forEach((coin, index) => {
        coinDataMap[coin.id] = {
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          color: colors[index],
          units: [...CURRENCIES],
          unit: 'usd',
          dynamics: {},
          goals: {}
        };
      });

      // Populate prices, dynamics, and calculate dynamic goals for sizing
      results.forEach(({ currency, data }) => {
        data.forEach((coinItem) => {
          const coinId = coinItem.id;
          if (coinDataMap[coinId]) {
            const price = coinItem.current_price;
            const change30d = coinItem.price_change_percentage_30d_in_currency || 0;

            // Set the price property, e.g. item.usd = price
            coinDataMap[coinId][currency] = price;
            coinDataMap[coinId].dynamics[currency] = change30d;

            // Calculate dynamic sizing goal based on volatility (dynamics %)
            // We want the size ratio to be: 0.6 + (|30d change| / 50), capped at 1.5.
            const dynamicsAbs = Math.abs(change30d);
            const sizeRatio = Math.max(0.4, Math.min(0.6 + (dynamicsAbs / 50), 1.5));
            
            // Set dynamic goal so carousel calculates this exact ratio: price / goal = sizeRatio
            coinDataMap[coinId].goals[currency] = price > 0 ? (price / sizeRatio) : 1;
          }
        });
      });

      const items = Object.values(coinDataMap);

      // Save to Cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(items));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

      return items;
    } catch (err) {
      console.error('Failed to fetch from CoinGecko API, falling back to expired cache:', err);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      throw err;
    }
  }

  // Export helper globally
  window.CryptoConfigHelper = {
    fetchCryptoData,
    clearCache: () => {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIME_KEY);
    }
  };
})();
