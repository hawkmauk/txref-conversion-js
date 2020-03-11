# TXRef conversion javascript library

## About

Javascript library for Bech32 Encoded TX References, ported from Jonas Schnelli's [reference implementation](https://github.com/jonasschnelli/bitcoin_txref_code) for the Rebooting Web Of Trust's [BTCR Hackathon](https://github.com/WebOfTrustInfo/btcr-hackathon).
It uses Peter Wuille's [Bech32 library](https://github.com/sipa/bech32) for Bech32 encoding and decoding.

For more details, see the [Bech32 Encoded Transaction Position References](https://github.com/bitcoin/bips/blob/master/bip-0136.mediawiki) BIP. 

This implementation works as follows:

- Encoding: 
  - Given a txid and chain (testnet/mainnet), fetch the block height and position from a blockchain explorer
  - Convert to a short id as shown in [btc_txref_encode](https://github.com/jonasschnelli/bitcoin_txref_code/blob/master/ref/c/txref_code.c)

- Decoding: 
  - Decodes the bech32-encoded txref 
  - Extracts the block height and position as shown in [btc_txref_decode](https://github.com/jonasschnelli/bitcoin_txref_code/blob/master/ref/c/txref_code.c)
  - Find the txid corresponding to the blockheight and position from a blockchain explorer

This library is for prototype use only. Some future improvements would include:
- Checking confirmation count from the API results; warn if less than 6 (or some other threshold).
- Compare results from multiple blockchain explorer APIs
- Flexible accessor if a local bitcoin node is available.
- Robust error checking

You can use this as a node package or in a browser. The browserified script is available as `txrefConverter-browserified.js`.

## Preview

You can experiment with this library in the [BTCR TX Playground](https://weboftrustinfo.github.io/btcr-tx-playground.github.io/)

# Developer information
JSDOC is used to generate developer resources that can be found [here](https://hawkmauk.github.io/txref-conversion-js/global.html#Bech32Prefix)

## Install

```
git clone https://github.com/WebOfTrustInfo/tx-conversion-js
cd tx-conversion-js
npm install

```
## Using in a browser

```
\\TODO
```

See the BTCR playground code repository [btcr-tx-playground](https://github.com/WebOfTrustInfo/btcr-tx-playground.github.io) for working code samples. 

## Running tests

```
npm run test
```

## Generate JSDOC
Code is commented to generate JSDOC that can be found in the [docs](./docs/index.html) directory

```
npm run doc
```
