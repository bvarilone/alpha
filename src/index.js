import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import alphaVantage from './alpha-vantage/index.js';

const toCamelCase = (str) =>
  str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());

const mkdirp = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const download = async ({ path: url, query }, replacementParams = {}) => {
  const params = {
    apikey: process.env.ALPHA_VANTAGE_API_KEY,
  };

  for (let [name, value] of Object.entries(query)) {
    params[name] = replacementParams[value] || value;
  }

  const httpPromise = alphaVantage.httpClient({
    url,
    params,
  });

  // NOTE: throttle to 75 requests per minute
  const throttlePromise = new Promise((resolve) => setTimeout(resolve, 800));

  const [{ status, data }] = await Promise.all([httpPromise, throttlePromise]);

  if (status !== 200) {
    throw new Error(
      `Request to Alpha Vantage failed with status code: ${status}`
    );
  }

  return data;
};

async function main() {
  console.time('download');

  const config = JSON.parse(fs.readFileSync(process.env.CONFIG_PATH));

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const lastDate = new Date();
  const date = lastDate.toISOString().substr(0, 10);

  mkdirp(`${__dirname}/../data`);
  mkdirp(`${__dirname}/../data/alpha-vantage`);
  mkdirp(`${__dirname}/../data/alpha-vantage/${date}`);
  mkdirp(`${__dirname}/../data/alpha-vantage/${date}/economic-indicators`);
  mkdirp(`${__dirname}/../data/alpha-vantage/${date}/exchange-rates`);
  mkdirp(`${__dirname}/../data/alpha-vantage/${date}/intelligence`);
  mkdirp(`${__dirname}/../data/alpha-vantage/${date}/stocks`);
  mkdirp(`${__dirname}/../data/alpha-vantage/${date}/technical-indicators`);

  console.time('economic-indicators');
  for (let name of config.alphaVantage.economicIndicators) {
    console.time(`economic-indicators/${name}`);
    const data = await download(
      alphaVantage.requests.economicIndicators[toCamelCase(name)]
    );
    fs.writeFileSync(
      `${__dirname}/../data/alpha-vantage/${date}/economic-indicators/${name}.json`,
      JSON.stringify(data, null, 2)
    );
    console.timeEnd(`economic-indicators/${name}`);
  }
  console.timeEnd('economic-indicators');

  console.time('exchange-rates');
  for (let name of config.alphaVantage.exchangeRates) {
    console.time(`exchange-rates/${name}`);
    const data = await download(
      alphaVantage.requests.exchangeRates[toCamelCase(name)]
    );
    fs.writeFileSync(
      `${__dirname}/../data/alpha-vantage/${date}/exchange-rates/${name}.json`,
      JSON.stringify(data, null, 2)
    );
    console.timeEnd(`exchange-rates/${name}`);
  }
  console.timeEnd('exchange-rates');

  console.time('stocks');
  for (let ticker of config.tickers) {
    console.time(`stocks/${ticker}`);
    mkdirp(`${__dirname}/../data/alpha-vantage/${date}/stocks/${ticker}`);
    for (let name of config.alphaVantage.stocks) {
      console.time(`stocks/${ticker}/${name}`);
      const data = await download(
        alphaVantage.requests.stocks[toCamelCase(name)],
        { '#symbol': ticker }
      );
      fs.writeFileSync(
        `${__dirname}/../data/alpha-vantage/${date}/stocks/${ticker}/${ticker}-${name}.json`,
        JSON.stringify(data, null, 2)
      );
      console.timeEnd(`stocks/${ticker}/${name}`);
    }
    console.timeEnd(`stocks/${ticker}`);
  }
  console.timeEnd('stocks');

  // // NOTE: News articles are sparsely available or not available at all going back in more than a year
  // for (let ticker of config.tickers) {
  //   mkdirp(`${__dirname}/../data/alpha-vantage/${date}/intelligence/${ticker}`);
  //   for (let name of config.alphaVantage.intelligence) {
  //     const currentDate = new Date(lastDate.getTime() - (86400000 /* milliseconds per day */ * 365 /* 1 year in days */ ));
  //     while (currentDate.getTime() < lastDate.getTime()) {
  //       const timePrefix = currentDate.toISOString().substr(0, 10).replace(/-/g, '');
  //       const from = `${timePrefix}T0000`;
  //       const to = `${timePrefix}T2359`;
  //       const data = await download(
  //         alphaVantage.requests.intelligence[toCamelCase(name)],
  //         { '#symbol': ticker, '#time_from': from, '#time_to': to }
  //       );
  //       fs.writeFileSync(
  //         `${__dirname}/../data/alpha-vantage/${date}/intelligence/${ticker}/${ticker}-${name}-${from}-${to}.json`,
  //         JSON.stringify(data, null, 2)
  //       );
  //       currentDate.setDate(currentDate.getDate() + 1);
  //     }
  //   }
  // }

  console.time('intelligence');
  for (let ticker of config.tickers) {
    console.time(`intelligence/${ticker}`);
    mkdirp(`${__dirname}/../data/alpha-vantage/${date}/intelligence/${ticker}`);
    for (let name of config.alphaVantage.intelligence) {
      console.time(`intelligence/${ticker}/${name}`);
      const data = await download(
        alphaVantage.requests.intelligence[toCamelCase(name)],
        { '#symbol': ticker }
      );
      fs.writeFileSync(
        `${__dirname}/../data/alpha-vantage/${date}/intelligence/${ticker}/${ticker}-${name}.json`,
        JSON.stringify(data, null, 2)
      );
      console.timeEnd(`intelligence/${ticker}/${name}`);
    }
    console.timeEnd(`intelligence/${ticker}`);
  }
  console.timeEnd('intelligence');

  console.time('technical-indicators');
  for (let ticker of config.tickers) {
    console.time(`technical-indicators/${ticker}`);
    mkdirp(
      `${__dirname}/../data/alpha-vantage/${date}/technical-indicators/${ticker}`
    );
    for (let name of config.alphaVantage.technicalIndicators) {
      console.time(`technical-indicators/${ticker}/${name}`);
      const data = await download(
        alphaVantage.requests.technicalIndicators[toCamelCase(name)],
        { '#symbol': ticker }
      );
      fs.writeFileSync(
        `${__dirname}/../data/alpha-vantage/${date}/technical-indicators/${ticker}/${ticker}-${name}.json`,
        JSON.stringify(data, null, 2)
      );
      console.timeEnd(`technical-indicators/${ticker}/${name}`);
    }
    console.timeEnd(`technical-indicators/${ticker}`);
  }
  console.timeEnd('technical-indicators');

  console.timeEnd('download');
}

main();
