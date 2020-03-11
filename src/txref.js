
/**
 * This class provides functions for Txrefs
 */
class Txref{

	static BECH32_HRP_MAINNET = 'tx'
	static BECH32_HRP_TESTNET = 'txtest'

	static MAGIC_MAINNET = 0x03
	static MAGIC_MAINNET_EXT = 0x04
	static MAGIC_TESTNET = 0x06
	static MAGIC_TESTNET_EXT=0x07

	/**
	 * Encode transaction location data into a txref
	 * 
	 * @param {string} [mainnet|testnet]
	 * 	chain The name of the btc chain
	 * @param {Number} blockHeight
	 * 	The block in which the transaction is found
	 * @param {Number} blockIndex
	 * 	The position in the block where the transaction is found
	 * @param {Number} utxoIndex
	 * 	The position of the utxo in the transaction input
	 *
	 * @returns {string}
	 * 	txref The bech32 txref
	 */
	static encode(chain, blockHeight, blockIndex, utxoIndex){
		
		//check for valid chain
		if(chain != 'mainnet' || chain != 'testnet') throw new Error('Invalid chain')
		//check for extendedTxref
		//set the magic number
		return true
	}
}

module.exports = Txref
