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

	async getTx(txid) {

		return new Promise((resolve,reject) => {
			const getJson = bent('json')
			const url = `${BlockcypherDao.URL_BASE}/${this.chain}/txs/${txid}`
			getJson(url)
				.then((tx) => {
					resolve(tx)
			})
			.catch((e) => {
				reject('Transaction not found')
			})
		})
	}

}

module.exports = BlockcypherDao
