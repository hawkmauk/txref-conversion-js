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


## Examples

In these examples, note the following:
- Prefixes: mainnet tx refs start with the `bc1` prefix, whereas testnet tx refs start with `tb1`

### Convert a TXID to TX

The transaction data needs to be returned from a blockexplorer or bitcoin node using a data access object (dao)

```
//the blockchain module gives us global constants similar to an enum
const Blockchain = require('./blockchain')
//the blockcypher dao is required here
const Dao = require('./dao/blockcypherDao')

//create an instance of the dao, connecting to the correct chain
const dao = new Dao(Blockchain.BTC_MAINNET)

//get the transaction from the dao
dao.getTx("016b71d9ec62709656504f1282bb81f7acf998df025e54bd68ea33129d8a425b")
	.then((tx) => {
		console.log(tx)
	})
```

### Convert a TX to a TXref

With the TX data, a txref can be created.

```
const Txref = require('./txref')
const tx = {
	chain: Blockchain.MAINNET,
	block_height: 0,
	block_index: 1
}

//convert the tx data 
console.log(Txref.getTxref(tx.chain,tx.block_height,tx.block_index))
  
```

### Convert a TXref to a TXID

```
//TOO
```


## Install

```
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
Code is commented to generate JSDOC that can be found in the [doc](./doc/index.html) directory

```
npm run doc
```
