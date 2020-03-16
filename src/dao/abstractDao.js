class AbstractDao {

	/**
	 * AbstractDao is not to be instanciated.  Instead it
	 * provides an interface for other Dao's to implement
	 *
	 * @param {string} chain
	 * 	This is the chain which the dao will be accessing
	 * 	for the data
	 *
	 * @return {dao}
	 * 	An instance of the Dao
	 */
	constructor(chain) {
    	if (new.target === AbstractDao) {
      		throw new TypeError("Cannot construct AbstractDao instances directly");
    	}
  	}

	/**
	 * getTx returns a transaction given a transaction id
	 *
	 * @param {string} txid
	 * 	 A transaction id referring to a tansaction in the
	 * 	 data store
	 *
	 * @return {{object}}
	 *   The transaction data
	 */
	getTx(txid) {
		throw new Error('not implemented')
	}
	

}

module.exports = AbstractDao
