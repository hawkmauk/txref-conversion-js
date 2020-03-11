/**
 * AbstractDao describes the Dao interface and implements a set of methods that should be
 * overridden by classes inheriting it.
 *
 * @class
 * @abstract
 */
class AbstractDao{

    static NOT_FOUND_ERROR = 'Transaction not found'

	/**
     * Generic data access object
     * @hideconstructor
     *
	 * @param {Bech32hrp} chain - Bech32hrp that identifies the chain to access.
     *
	 * @return {dao} - An instance of the Dao
	 */
	constructor(chain) {
    	if (new.target === AbstractDao) {
      		throw new TypeError("Cannot construct AbstractDao instances directly");
    	}
  	}
}

/**
 * @abstract
 * @param {Number} block_height - The block that the transaction is recorded in
 *
 * @param {Number} block_index -  The position of the transaction in the block
 *
 * @return {tx} tx - The transaction
 */
AbstractDao.prototype.getTxByIndex = (block_height,block_index) => {
    throw new Error('not implemented')
}

/**
 * @abstract
 * @param {string} txid - A transaction id referring to a tansaction in the data store
 *
 * @return {{object}} - tx The transaction data
 */
AbstractDao.prototype.getTxiById = (txid) => {
	throw new Error('not implemented')
}

module.exports = AbstractDao
