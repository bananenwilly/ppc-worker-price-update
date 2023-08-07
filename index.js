async function gatherResponse(response) {
  const { headers } = response;
  const contentType = headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await response.json();
  } else {
    return response.text();
  }
}

async function getFromApi(url, authHeader = "") {
  const init = {
    headers: {
      'content-type': 'application/json',
      'Authorization': "Basic " + authHeader,
    },
  }
  const response = await fetch(url, init);
  const results = await gatherResponse(response);
  return results;
}

addEventListener('fetch', (event) => {
  event.waitUntil(handleSchedule())
  return event.respondWith(new Response());
})

addEventListener('scheduled', (event) => {
  event.waitUntil(handleSchedule());
})

async function handleSchedule() {
  //get coinpaprika ppc/usd price
  const paprikaResponse = await getFromApi(
    'https://paprika.ppc.lol/v1/tickers/ppc-peercoin', PAPRIKA_TOKEN
  );

  //get currency fiat/usd exchange rates
  const openExchangeResponse = await getFromApi(
    `https://openexchangerates.org/api/latest.json?app_id=${CURRCONV_KEY}`,
  );

  const rates = openExchangeResponse['rates'];
  const enabledCurrencies = [
    "AUD",
    "BDT",
    "BRL",
    "CNY",
    "DKK",
    "EUR",
    "GBP",
    "IDR",
    "INR",
    "IRR",
    "JPY",
    "KES",
    "KRW",
    "NOK",
    "PHP",
    "PKR",
    "PLN",
    "RON",
    "RUB",
    "SEK",
    "THB",
    "TRY",
    "TZS",
    "UAH",
    "UGX",
    "VND",
    "AED",
    "ALL",
    "AMD",
    "AOA",
    "AZN",
    "BAM",
    "BDT",
    "BGN",
    "BHD",
    "BIF",
    "BND",
    "BOB",
    "BSD",
    "BTN",
    "BWP",
    "BYN",
    "CAD",
    "CDF",
    "CHF",
    "CLP",
    "COP",
    "CRC",
    "CVE",
    "CZK",
    "DOP",
    "EGP",
    "GEL",
    "GMD",
    "GNF",
    "GTQ",
    "GYD",
    "HKD",
    "HNL",
    "HRK",
    "HUF",
    "ILS",
    "IQD",
    "ISK",
    "JMD",
    "JOD",
    "KGS",
    "KMF",
    "KWD",
    "KZT",
    "LAK",
    "LBP",
    "LKR",
    "LRD",
    "LSL",
    "LYD",
    "MAD",
    "MDL",
    "MGA",
    "MKD",
    "MNT",
    "MOP",
    "MUR",
    "MVR",
    "MWK",
    "MYR",
    "MXN",
    "MZN",
    "NAD",
    "NGN",
    "NZD",
    "OMR",
    "PEN",
    "PYG",
    "QAR",
    "RSD",
    "RWF",
    "SAR",
    "SCR",
    "SDG",
    "SGD",
    "SLL",
    "STD",
    "SZL",
    "TJS",
    "TND",
    "TTD",
    "TWD",
    "UYU",
    "XAF",
    "XOF",
    "XPF",
    "ZAR",
    "ZMK"
  ];

  const prices = {};
  // loop over enabledCurrencies for prices that are availble on openexchangerates
  for (const currency of enabledCurrencies) {
    prices[currency] = rates[currency];
  }

  // add PPC 
  const ppcUsdPrice = paprikaResponse['quotes']['USD']['price'];
  prices['PPC'] = parseFloat(ppcUsdPrice.toFixed(6));

  // add ARS TODO
  const yadioResponse = await getFromApi('https://api.yadio.io/exrates/USD');
  const arsUsdPrice = yadioResponse['USD']['ARS'];
  prices['ARS'] = arsUsdPrice;

  // sort prices by key
  const sortedPrices = Object.fromEntries(Object.entries(prices).sort());

  //write to KV
  await peercoin_kv.put('prices', JSON.stringify(sortedPrices));
}
