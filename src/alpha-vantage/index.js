import * as economicIndicators from './economic-indicators/index.js';
import * as exchangeRates from './exchange-rates/index.js';
import * as intelligence from './intelligence/index.js';
import * as stocks from './stocks/index.js';
import * as technicalIndicators from './technical-indicators/index.js';

import { httpClient } from './http-client.js';

export default {
  httpClient,
  requests: {
    economicIndicators,
    exchangeRates,
    intelligence,
    stocks,
    technicalIndicators,
  },
};
