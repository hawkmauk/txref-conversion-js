const Blockchain = require('../src/blockchain')
const AbstractDao = require('../src/dao/abstractDao')
const data = require('./data')

class MockDao extends AbstractDao {

	/**
	 * Creates a MockDao Instance
	 *
	 * @param
	 */
	constructor( chain = Blockchain.BTC_TESTNET ){
		
		//Initialise the parent object 
		super( chain )
		this.chain = chain
	}

}

Object.setPrototypeOf(MockDao.prototype, AbstractDao)

/**
 * getTx
 *
 * @param {string} txid
 * 	 The unique identifier of the transaction to retrieve
 *
 * @return {{object}}
 * 	 The transaction object
 */
MockDao.prototype.getTx = async (txid) => {

	const tx = await data.find( tx => tx.txid === txid )
	// transform the data to match generic transaction format
	return parse(tx)

}

parse = (tx) => {
	tx.block_height = tx.blockHeight
	tx.block_index = tx.blockIndex
	return tx
}

module.exports = MockDao
