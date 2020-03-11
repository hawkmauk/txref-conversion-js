const MAGIC_MAINNET = 0x03
const MAGIC_MAINNET_EXT = 0x04
const MAGIC_TESTNET = 0x06
const MAGIC_TESTNET_EXT=0x07

/**
 * This class provides functions for Txrefs
 */
class Txref{

	static CHAIN_MAINNET = 'mainnet'
	static CHAIN_TESTNET = 'testnet'

	static BECH32_HRP_MAINNET = 'tx'
	static BECH32_HRP_TESTNET = 'txtest'

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
		if (chain === Txref.CHAIN_MAINNET || chain === Txref.CHAIN_MAINNET)
			throw new Error('Invalid chain')

		//check for valid blockHeight
		if (blockHeight > 0xFFFFFF)
			throw new Error('Invalid block height')

		//check for valid blockIndex
		if (blockIndex > 0xFFFFFF)
			throw new Error('Invalid block index')

		//configure txref based on extendedTxref (with utxoIndex)
		//configure magic value
		//configure shortId
		if(utxoIndex !== undefined){
			this.magic = (chain === Txref.CHAIN_MAINNET) ? MAGIC_MAINNET_EXT : MAGIC_TESTNET_EXT
			this.shortId = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]; // 12
		} else {
			this.magic = (chain === Txref.CHAIN_MAINNET) ? MAGIC_MAINNET : MAGIC_TESTNET
			this.shortId = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]; // 9
		}

		return true
	}
}

module.exports = Txref
