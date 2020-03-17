const bech32 = require('bech32')
const Blockchain = require('./blockchain')

const TYPE_MAINNET = 0x03
const TYPE_MAINNET_EXT = 0x04
const TYPE_TESTNET = 0x06
const TYPE_TESTNET_EXT=0x07

/**
 * This class provides functions for Txrefs
 */
class Txref{

	/**
	 * Human readable part of bech32 data
	 */
	//static BECH32_HRP_MAINNET = 'tx'
	//static BECH32_HRP_TESTNET = 'txtest'
	static BECH32_HRP_MAINNET = 'bc'
	static BECH32_HRP_TESTNET = 'tb'

	/**
	 * Encode transaction location data into a txref
	 * 
	 * @param {string} chain
	 * 	chain The name of the btc chain mainnet or testnet
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
		if (chain !== Blockchain.BTC_MAINNET && chain !== Blockchain.BTC_TESTNET)
			throw new Error('Invalid chain')

		//check for valid blockHeight
		if (blockHeight > 0xFFFFFF)
			throw new Error('Invalid block height')

		//check for valid blockIndex
		if (blockIndex > 0xFFFFFF)
			throw new Error('Invalid block index')

		//encode the txref
		const bTxref = Txref.binaryEncode(chain,blockHeight,blockIndex,utxoIndex)
		//convert the binary data to a formatted txref
		const txref = Txref.binaryToString(bTxref)

		return txref
	}


	/**
	 * The txref is binary data encoded over a set number of bytes, determined
	 * by whether a utxoIndex is supplied.
	 *
	 * With a utxoIndex the data is 12 bytes long, without it is 9
	 * Bytes 0   : Identifies whether the txref is for mainnet|testnet and
	 *             whether it includes a utxoRef
	 * Bytes 1-5 : Encodes the blockheight
	 * Bytes 6-8 : Encodes the blockIndex
	 * Bytes 9-11: Encodes the utxoIndex
	 *
	 * @param {string} chain
	 * 	chain The name of the btc chain mainnet or testnet
	 * @param {Number} blockHeight
	 * 	The block in which the transaction is found
	 * @param {Number} blockIndex
	 * 	The position in the block where the transaction is found
	 * @param {Number} utxoIndex
	 * 	The position of the utxo in the transaction input
	 *
	 * @return {binary} txref
	 * 	A binary encoded txref
	 */
	static binaryEncode(chain,blockHeight,blockIndex,utxoIndex){

		let type,words

		//Set the txref type and initialise binary data.  This is returned as *words* for the
		//beck32 library so we define it here to keep it consistent
		if(utxoIndex !== undefined){
			type = (chain === Blockchain.BTC_MAINNET) ? TYPE_MAINNET_EXT : TYPE_TESTNET_EXT
			words = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
		} else {
			type = (chain === Blockchain.BTC_MAINNET) ? TYPE_MAINNET : TYPE_TESTNET
			words = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
		}


		//set the type bit in the data
		words[0] = type

		//encode the blockHeight
		words[1] |= ((blockHeight & 0xF) << 1);
		words[2] |= ((blockHeight & 0x1F0) >> 4);
		words[3] |= ((blockHeight & 0x3E00) >> 9);
		words[4] |= ((blockHeight & 0x7C000) >> 14);
		words[5] |= ((blockHeight & 0xF80000) >> 19);

		//encode the blockIndex
		words[6] |= (blockIndex & 0x1F);
		words[7] |= ((blockIndex & 0x3E0) >> 5);
  		words[8] |= ((blockIndex & 0x7C00) >> 10);

		//encode the utxoIndex
		if(utxoIndex != undefined) {
			words[9]  |=  (utxoIndex & 0x1F);
    		words[10] |= ((utxoIndex & 0x3E0) >> 5);
    		words[11] |= ((utxoIndex & 0x7C00) >> 10);
		}

		return words
	}

	/**
	 * Convert binary txref to a bech32 formatted string with
	 * delimiters to make it more human readable.
	 *
	 * The name 'words' is used throughout in keeping with the Bech32
	 * naming in object returned from the Bech32 library:
	 *	`{ prefix: xx, words: xxxxxxx }`
	 *
	 * @param {binary} words
	 *   The binary encoded bech32 txref.
	 * @return {string} txref
	 *   The txref in human readable form
	 */
	static binaryToString(words){

		//determine the chain from the first 'words' byte and set 
		//the 'prefix' which is the human readable part
		const prefix = (words[0] === TYPE_MAINNET || words[0] === TYPE_MAINNET_EXT) ?
			Txref.BECH32_HRP_MAINNET : Txref.BECH32_HRP_TESTNET
		
		//encode the human readable part and data as bech32
		const bech32encoded = bech32.encode(prefix, words)

		//add delimiters to the bech32encoded string
		const splitIndex = 4
		const delimiter = '-'
		
		//Initialise the txref
		const wordsStart = prefix.length + 1
		let txref = bech32encoded.substring(0, wordsStart) + ':'
			+ bech32encoded.substring(wordsStart, wordsStart + splitIndex)
		
		//Add to txref remaining data with delimiter
		//Initialise with wordsStart + splitIndex as we've already added the human
		//readable part (prefix) and the first part of the data in the step above
		for(var i = wordsStart + splitIndex; i < bech32encoded.length + 1; i += splitIndex){
			txref += delimiter + bech32encoded.substring(i, i + splitIndex)
		}

		return txref
	}


	/**
	 * Convert a txref to ttransaction data
	 *
	 * @param {Txref} txref
	 *
	 * @return {{chain, blockHeight, blockIndex, utxoIndex}}
	 * 	The transaction data encoded in the txref
	 */
	static decode(txref){

		let chain, blockHeight, blockIndex, utxoIndex

		//check for valid txref
//		if (! txref.match(/^tx(test)?1:[a-z0-9]{4}(-[a-z0-9]{4}){2}/g)){
//			throw new Error('Invalid txref')
//		}

		if (! txref.match(/^(bc|tb)?1:[a-z0-9]{4}(-[a-z0-9]{4}){2}/g)){
			throw new Error('Invalid txref')
		}

		//strip the delimiter formatting
		const unformattedTxref = txref.replace(/[-:]/g, '')

		//convert the string to binary data
		const bTxref = bech32.decode(unformattedTxref)

		//decode the blockHeight
		blockHeight = (bTxref.words[1] >> 1)
		blockHeight |= (bTxref.words[2] << 4)
		blockHeight |= (bTxref.words[3] << 9)
		blockHeight |= (bTxref.words[4] << 14)
		blockHeight |= (bTxref.words[5] << 19)

		//decode the blockIndex
		blockIndex = bTxref.words[6]
		blockIndex |= (bTxref.words[7] << 5)
		blockIndex |= (bTxref.words[8] << 10)

		//decode the utxoIndex
		if(bTxref.words.length == 12){
			utxoIndex = bTxref.words[9]
			utxoIndex |= (bTxref.words[10] << 5)
			utxoIndex |= (bTxref.words[11] << 10)
		}

		//decode the chain
		(bTxref.prefix === Txref.BECH32_HRP_MAINNET) ?
			chain = Blockchain.BTC_MAINNET : chain = Blockchain.BTC_TESTNET

		return {
			chain,
			blockHeight,
			blockIndex,
			utxoIndex
		}

	}
}

module.exports = Txref
