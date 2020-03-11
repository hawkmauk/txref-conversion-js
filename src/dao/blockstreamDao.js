const bent = require('bent')
const Bech32hrp = require('../bech32hrp')
const AbstractDao = require('./abstractDao')

/**
 * This class handles Data Access from the blockcypher API
 *
 * @extends AbstractDao
 */
class BlockstreamDao extends AbstractDao{


        static URL_BASE = 'https://blockstream.info'

        /**
         * Creates an instance of the BlockstreamDao
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
Object.setPrototypeOf(BlockstreamDao.prototype, AbstractDao)

/**
 * Returns a transaction object using the txid
 *
 * @param {string} txid - The transaction id of the transaction to be returned
 *
 * @return {Object} tx - The transaction with the given transactionId
 *
 * @override
 */
BlockstreamDao.prototype.getTxById = async function(txid){

        var url
        // object to make web service request
        const getJson = bent('json')
        // format the URL chain identifier
        const urlChain = getUrlChain( this.chain )

        return new Promise( async (resolve,reject) => {

                var tx

                // get the confirmed, block_height, block_hash and block_time properties
                url = `${BlockstreamDao.URL_BASE}${urlChain}/api/tx/${txid}/status`
                try {
                        tx = await getJson(url)
                        //The block index is still required so we make a second call to return all tx's in
                        //block to determine the index
                        url = `${BlockstreamDao.URL_BASE}${urlChain}/api/block/${tx.block_hash}/txids`

                        try {
                                const block_txs = await getJson(url)
                                const index = block_txs.findIndex((element) => element === txid)
                                // build the result object
                                resolve({
                                        block_height: tx.block_height,
                                        block_index: index
                                })
                        } catch (e) {
                                reject(AbstractDao.NOT_FOUND_ERROR)
                        }
                } catch (e) {
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
BlockstreamDao.prototype.getTxByIndex = async function(block_height, block_index) {

        var url
        // object to make web service request
        const getJson = bent('json')
        const getString = bent('string')
        // format the URL chain identifier
        const urlChain = getUrlChain( this.chain )

        return new Promise( async (resolve,reject) => {

                var blockhash

                //get the blockhash
                url = `${BlockstreamDao.URL_BASE}${urlChain}/api/block-height/${block_height}`
                try {
                        blockhash = await getString(url)
                        //get the block
                        url = `${BlockstreamDao.URL_BASE}${urlChain}/api/block/${blockhash}/txid/${block_index}`
                        try {
                                const tx = await getString(url)
                                resolve({
                                        txid: tx,
                                        block_height,
                                        block_index
                                })
                        } catch (e) {
                                reject(AbstractDao.NOT_FOUND_ERROR)
                        }
                } catch (e) {
                        reject(AbstractDao.NOT_FOUND_ERROR)
                }

        })
}

const getUrlChain = ( chain ) => {
        if (chain === Bech32hrp.BTC_TESTNET) {
                return '/testnet'
        }else{
                return ''
        }
}

module.exports = BlockstreamDao
