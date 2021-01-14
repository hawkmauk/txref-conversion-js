const Txref = require('./txref')
const { DaoType, DaoFactory } = require('./dao/daoFactory')

/**
 *	This class wraps around dao functionality to provide an abstracted
 *	interface that doesn't require as much configuration.
 *
 *	@class
 */
class TxReader{

	/**
     * Create an instance of the txReader
	 * @constructor
     *
	 * @param {DaoType} provider - The provider of the chain interface
     *
	 * @returns {TxReader} reader - An instance of the TxReader class
     *
     * @example
     * const TxReader = require('./txReader')
     * const DaoType = require('./daoFactory')
     * const reader = new TxReader(DaoType.BLOCKCYPHER)
	 */
	constructor(provider){
		
		this.provider = provider

	}


}

/**
 * @description
 * Return a txid from a txref.  Because the txref contains the chain information it
 * doesn't need to be provided to the method in order to resolve the tx on the chain
 *
 * @param {string} txref - The txref encoding the position of the transaction in the chain
 *
 * @returns {string} txid - The transaction id
 *
 * @example
 * const txid = async reader.getTxid('tx1:rzqq-qqqq-qeqc-6sw')
 * // returns '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098'
 *
 * @async
 */
TxReader.prototype.getTxid = async function(txref){

    //get the tx details from the chain
    const txdata = Txref.decode(txref)
    //get a dao from the factory
    const dao = DaoFactory.get(this.provider, txdata.chain)
    //get the txid from the chain
    const tx = await dao.getTxByIndex(txdata.block_height, txdata.block_index)

    return tx.txid
}

/**
 * @description
 * Return a tx from a txref.  Because the txref contains the chain information it
 * doesn't need to be provided to the method in order to resolve the tx on the chain
 *
 * @param {string} txref - The txref encoding the position of the transaction in the chain
 *
 * @return {Object} tx - The transaction
 *
 * @example
 * const txid = async reader.getTx('tx1:rzqq-qqqq-qeqc-6sw')
 * // returns a tx object with the txid '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098'
 *
 * @async
 */
TxReader.prototype.getTx = async function(txref){

    //get the tx details from the chain
    const txdata = Txref.decode(txref)
    //get a dao from the factory
    const dao = DaoFactory.get(this.provider, txdata.chain)
    //get the txid from the chain
    const tx = await dao.getTxByIndex(txdata.block_height, txdata.block_index)

    return tx
}

/**
 * @description
 * Return a txref from a txid.  As the txid doesn't contain any information
 * around which chain it can be found on, this needs to be passed to the method
 *
 * @param {Bech32hrp} chain - The chain that the transaction is recorded in
 * @param {string} txid - The txid to be used to create the txref
 *
 * @returns {string} txref - The txref describing the position of the transaction
 *
 * @example
 * const txref = async reader.getTxref(
 *      Bech32hrp.BTC_MAINNET,
 *      '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098')
 * // returns 'tx1:rzqq-qqqq-qeqc-6sw'
 *
 * @async
 */
// Needs to be defined using the function syntax to access this.
TxReader.prototype.getTxref = async function(chain, txid){
		
    //check that enough arguments are provided as its taken me ages
    //to find out that this was a cause of some failing tests!
    if(txid === undefined){
        throw new Error(`Txid is undefined for chain: ${txid}`)
    }
    //get a Dao from the factory
    const dao = DaoFactory.get(this.provider,chain)
    //get the tx data from dao using the txid
    const tx = await dao.getTxById(txid)
    //convert the tx to a txref
    const txref = Txref.encode(chain, tx.block_height, tx.block_index)

    return txref

}

module.exports = TxReader
