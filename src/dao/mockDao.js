const Bech32hrp = require('../bech32hrp')
const AbstractDao = require('./abstractDao')
const data = require('../../test/data')

/**
 * Dao for accessing test data.
 *
 * @extends AbstractDao
 */
class MockDao extends AbstractDao {

	/**
	 * Creates a MockDao Instance
	 *
	 * @param {Bech32hrp} chain - Bech32hrp describing the chain to access
     *
     * @returns {MockDao} dao - An instance of the dao
	 */
	constructor( chain = Bech32hrp.BTC_TESTNET ){
		
		//Initialise the parent object 
		super( chain )
		this.chain = chain
	}

}

Object.setPrototypeOf(MockDao.prototype, AbstractDao)

/**
 * Returns a transaction object using the txid
 *
 * @param {string} txid - The transaction id of the transaction to be returned
 *
 * @return {Object} tx - The transaction with the given transactionId
 *
 * @override
 */
MockDao.prototype.getTxById = async (txid) => {

	const tx = await data.find( tx => tx.txid === txid )
	// transform the data to match generic transaction format
	return parse(tx)

}

/**
 * Returns a transaction object using the block index
 *
 * @param {Number} block_height - The block that the transaction is recorded in
 *
 * @param {Number} block_index - The position of the transaction in the block
 *
 * @return {Object} tx - The transaction at the given position
 *
 * @override
 */
MockDao.prototype.getTxByIndex = async (block_height, block_index) => {

	const tx = await data.find( tx => tx.block_height === block_height && tx.block_index === block_index )
	return tx
}

parse = (tx) => {
	return tx
}

module.exports = MockDao
