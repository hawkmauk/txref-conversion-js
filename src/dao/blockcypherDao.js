const bent = require('bent')
const Bech32hrp = require('../bech32hrp')
const AbstractDao = require('./abstractDao')
/**
 * This class handles Data Access from the blockcypher API
 *
 * @extends AbstractDao
 */
class BlockcypherDao extends AbstractDao{


	static URL_BASE = 'https://api.blockcypher.com/v1/btc'

	/**
	 * Creates an instance of the BlockcypherDao
	 *
	 * @param {Bech32hrp} chain - The chain should be set using one of the chain variables
	 */
	constructor( chain = Bech32hrp.BTC_TESTNET ){
		
		// Call the AbstractDao constructor
		super(chain)

		// Test for valid chain
		if (
			chain === Bech32hrp.BTC_MAINNET ||
			chain === Bech32hrp.BTC_TESTNET
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
 * Returns a transaction object using the txid
 *
 * @param {string} txid - The transaction id of the transaction to be returned
 *
 * @return {Object} tx - The transaction with the given transactionId
 *
 * @override
 */
BlockcypherDao.prototype.getTxById = async function(txid){

    //format the url chain identifier
    const urlChain = getUrlChain( this.chain )
    //format the url
    const url = `${BlockcypherDao.URL_BASE}/${urlChain}/txs/${txid}`
    //return the json data
    const getJson = bent('json')

    return new Promise ( async (resolve,reject) => {
        var tx
        try{
                tx = await getJson(url)
                resolve(tx)
        } catch(error) {
                reject(AbstractDao.NOT_FOUND_ERROR)
        }
    })

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
BlockcypherDao.prototype.getTxByIndex = async function(block_height, block_index) {

    const urlChain = getUrlChain( this.chain )
    //return the json data
    const getJson = bent('json')

    return new Promise( async (resolve,reject) => {
        //format the url
        const url = `${BlockcypherDao.URL_BASE}/${urlChain}/blocks/${block_height}?txstart=${block_index}&limit=1`
        console.log(url)
    
        try {
            const block = await getJson(url)
            if (block.txids.length == 0){
                    reject(AbstractDao.NOT_FOUND_ERROR)
            }else{
                    //return the txid
                    resolve({
                            txid: block.txids[0],
                            block_height,
                            block_index
                    })
            }
        } catch (e) {
            reject(AbstractDao.NOT_FOUND_ERROR)
        }
    })

}

const getUrlChain = ( chain ) => (chain === Bech32hrp.BTC_MAINNET) ? 'main' : 'test3'

module.exports = BlockcypherDao
