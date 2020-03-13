const bent = require('bent')
const Txref = require('./txref')

/**
 * This class handles Data Access from the blockcypher API
 */
class BlockcypherDao{


	static CHAIN_MAINNET = 'main'
	static CHAIN_TESTNET = 'test3'

	static URL_BASE = 'https://api.blockcypher.com/v1/btc'

	/**
	 * Creates an instance of the BlockcypherDao
	 *
	 * @param {string} chain
	 * 	The chain should be set using one of the class variable
	 * 	CHAIN_MAINNET or CHAIN_TESTNET
	 */
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

	/**
	 * Returns a transaction object
	 *
	 * @param {string} [type='transactionId'] txid
	 * 	The transaction id of the transaction to be returned
	 *
	 * @return {Object}
	 * 	The transaction with the given transactionId
	 */
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

	/**
	 * Return a txref from a txid
	 */
	async getTxref(txid) {
		
		return new Promise((resolve,reject) => {
			
			//get the tx data from dao
			getTx(txid)
				.then((tx) => {
					//convert the tx to a txref
					const txref = Txref.encode(this.chain, tx.block_height, tx.block_Index)
					resolve(txref)
				})
				.catch((e) => {
					reject(e)
				})
		})

	}

}

module.exports = BlockcypherDao
