const bent = require('bent')


class BlockcypherDao{


	static CHAIN_MAINNET = 'main'
	static CHAIN_TESTNET = 'test3'

	static URL_BASE = 'https://api.blockcypher.com/v1/btc'

	//make the default chain testnet
	constructor( chain = BlockcypherDao.CHAIN_TESTNET ){
		
		// Test for valid chain
		if (
			chain === BlockcypherDao.CHAIN_MAINNET ||
			chain === BlockcypherDao.CHAIN_TESTNET
		){
			this.chain = chain
		}else{
			throw new Error(`Invalid chain: ${chain}`)
		}
	}

	get(txid){
		const getJson = bent('json')
		const url = `${BLOCKCYPHER_URL_BASE}/${this.chain}/txs/${txid}`
		console.log(url)
		try{
			return getJson(url)
		} catch (e) {
			console.log('Error: ', e)
		}
	}

}

module.exports = BlockcypherDao
