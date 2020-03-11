const requests = require('requests')

const BLOCKCYPHER_CHAIN_MAINNET = 'main'
const BLOCKCYPHER_CHAIN_TESTNET = 'test3'
const BLOCKCYPHER_URL_BASE = 'https://api.blockcypher.com/v1/btc'

class BlockcypherDao{

	constructor( chain = BLOCKCYPHER_CHAIN_TESTNET ){
		this.chain = chain
	}

	async get(txid){

		url = `${BLOCKCYPHER_URL_BASE}/${this.chain}/txs/${txid}`
		console.log(url)
		result = await requests.get(url)
		console.log(result)
	}

}

module.exports = BlockcypherDao
