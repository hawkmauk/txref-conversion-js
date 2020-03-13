const bent = require('bent')
const Txref = require('./txref')

/**
 * This class handles Data Access from the blockcypher API
 */
class BlockcypherDao{


	static CHAIN_MAINNET = Txref.CHAIN_MAINNET
	static CHAIN_TESTNET = Txref.CHAIN_TESTNET
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

			//format the url chain identifier
			let urlChain
			(this.chain === BlockcypherDao.CHAIN_MAINNET) ? urlChain = 'main' : urlChain = 'test3'
			//format the url
			const url = `${BlockcypherDao.URL_BASE}/${urlChain}/txs/${txid}`
			//return the json data
			const getJson = bent('json')
			const tx = await getJson(url)
			return tx
	
	}

	/**
	 * Return a txref from a txid
	 *
	 * @param {string} txid
	 *
	 * @return {string} txref
	 */
	async getTxref(txid) {
		
			//get the tx data from dao
			const tx = await this.getTx(txid)
			//convert the tx to a txref
			const txref = Txref.encode(this.chain, tx.block_height, tx.block_index)
			return txref

	}

}

module.exports = BlockcypherDao
