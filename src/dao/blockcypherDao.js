const bent = require('bent')
const Blockchain = require('../blockchain')
const AbstractDao = require('./abstractDao')

/**
 * This class handles Data Access from the blockcypher API
 */
class BlockcypherDao extends AbstractDao{


	static URL_BASE = 'https://api.blockcypher.com/v1/btc'

	/**
	 * Creates an instance of the BlockcypherDao
	 *
	 * @param {blockchain} chain
	 * 	The chain should be set using one of the chain variables
	 */
	constructor( chain = Blockchain.BTC_TESTNET ){
		
		// Call the AbstractDao constructor
		super(chain)

		// Test for valid chain
		if (
			chain === Blockchain.BTC_MAINNET ||
			chain === Blockchain.BTC_TESTNET
		){
			this.chain = chain
		}else{
			throw new Error(`Invalid chain: ${chain}`)
		}
	}
}

// Without this the super attributes are not accessable
Object.setPrototypeOf(BlockcypherDao.prototype, AbstractDao)

/**
 * Returns a transaction object
 *
 * @param {string} [type='transactionId'] txid
 * 	The transaction id of the transaction to be returned
 *
 * @return {Object}
 * 	The transaction with the given transactionId
 */
BlockcypherDao.prototype.getTx = async function(txid){

		//format the url chain identifier
		let urlChain
		(this.chain === Blockchain.BTC_MAINNET) ? urlChain = 'main' : urlChain = 'test3'
		//format the url
		const url = `${BlockcypherDao.URL_BASE}/${urlChain}/txs/${txid}`
		//return the json data
		const getJson = bent('json')
		const tx = await getJson(url)
		return tx

}

module.exports = BlockcypherDao
