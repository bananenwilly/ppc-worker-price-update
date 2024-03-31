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
  try {
    const init = {
      headers: {
        'content-type': 'application/json',
        'Authorization': "Basic " + authHeader,
      },
    }
    const response = await fetch(url, init);
    const results = await gatherResponse(response);
    console.log(`Results for ${url}`, results);
    return results;
  } catch (error) {
    console.error(`Error for ${url}`, error);
  }
}

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

  const openExchangeRates = openExchangeResponse['rates'];
  const enabledCurrencies = [
    "AED",
    "AFN",
    "ALL",
    "AMD",
    "ANG",
    "AOA",
    "AUD",
    "AWG",
    "AZN",
    "BAM",
    "BBD",
    "BDT",
    "BGN",
    "BHD",
    "BIF",
    "BMD",
    "BND",
    "BOB",
    "BRL",
    "BSD",
    "BTN",
    "BWP",
    "BYN",
    "BZD",
    "CAD",
    "CDF",
    "CHF",
    "CLF",
    "CLP",
    "CNY",
    "COP",
    "CRC",
    "CUP",
    "CVE",
    "CZK",
    "DJF",
    "DKK",
    "DOP",
    "DZD",
    "EGP",
    "ERN",
    "ETB",
    "EUR",
    "FJD",
    "GBP",
    "GEL",
    "GHS",
    "GIP",
    "GMD",
    "GNF",
    "GTQ",
    "GYD",
    "HKD",
    "HNL",
    "HTG",
    "HUF",
    "IDR",
    "ILS",
    "INR",
    "IQD",
    "IRR",
    "ISK",
    "JMD",
    "JOD",
    "JPY",
    "KES",
    "KGS",
    "KHR",
    "KMF",
    "KPW",
    "KRW",
    "KWD",
    "KYD",
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
    "MMK",
    "MNT",
    "MOP",
    "MRU",
    "MUR",
    "MVR",
    "MWK",
    "MXN",
    "MYR",
    "MZN",
    "NAD",
    "NGN",
    "NIO",
    "NOK",
    "NPR",
    "NZD",
    "OMR",
    "PAB",
    "PEN",
    "PGK",
    "PHP",
    "PKR",
    "PLN",
    "PYG",
    "QAR",
    "RON",
    "RSD",
    "RUB",
    "RWF",
    "SAR",
    "SBD",
    "SCR",
    "SDG",
    "SEK",
    "SGD",
    "SHP",
    "SLL",
    "SOS",
    "SRD",
    "SSP",
    "STN",
    "SVC",
    "SYP",
    "SZL",
    "THB",
    "TJS",
    "TMT",
    "TND",
    "TOP",
    "TRY",
    "TTD",
    "TWD",
    "TZS",
    "UAH",
    "UGX",
    "UYU",
    "UZS",
    "VND",
    "VUV",
    "WST",
    "XAF",
    "XCD",
    "XOF",
    "XPF",
    "YER",
    "ZAR",
    "ZMW",
    "ZWL"
  ];

  const prices = {};
  // loop over enabledCurrencies for prices that are availble on openexchangerates
  for (const currency of enabledCurrencies) {
    prices[currency] = openExchangeRates[currency];
  }

  // add PPC 
  const ppcUsdPrice = paprikaResponse['quotes']['USD']['price'];
  prices['PPC'] = parseFloat(ppcUsdPrice.toFixed(6));

  // add ARS
  const yadioResponse = await getFromApi('https://api.yadio.io/exrates/USD');
  if (yadioResponse) {
    const arsUsdPrice = yadioResponse['USD']['ARS'];
    prices['ARS'] = arsUsdPrice;
  } else {
    console.error('Error: Failed to get ARS price, taking from openexchangerates');
    prices['ARS'] = openExchangeRates['ARS'];
  }

  // sort prices by key
  const sortedPrices = Object.fromEntries(Object.entries(prices).sort());

  //write to KV
  await peercoin_kv.put('prices', JSON.stringify(sortedPrices));
}
