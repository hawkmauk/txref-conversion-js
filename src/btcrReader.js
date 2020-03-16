const Txref = require('./txref')

class BtcrReader{

	/**
	 *	Initialise an instace of the reader by passing in a
	 *	dao object
	 *
	 *	@params {dao} dao
	 *		A class implementing methods from the AbstractDao
	 *		class that will be used to access the chain
	 *
	 *	@returns {BtcrReader}
	 *		An instance of the BtcrReader class
	 */
	constructor(dao){
		
		this.dao = dao

	}

	/**
	 * Return a txref from a txid
	 *
	 * @param {string} txid
	 *
	 * @return {string} txref
	 */
	// Needs to be defined using the function syntax to access this.
	getTxref = async function(txid){
		
			//get the tx data from dao
			const tx = await this.dao.getTx(txid)
			//convert the tx to a txref
			const txref = Txref.encode(this.dao.chain, tx.block_height, tx.block_index)
			return txref

	}

	/**
	 * Return a txid from a txref
	 *
	 * @param {string} txref
	 *
	 * @return {string} txid
	 */
	getTxid = function(txref){

		return false
	}

}

module.exports = BtcrReader
