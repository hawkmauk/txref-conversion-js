const bech32 = require('./bech32')

const TYPE_MAINNET = 0x03
const TYPE_MAINNET_EXT = 0x04
const TYPE_TESTNET = 0x06
const TYPE_TESTNET_EXT=0x07

/**
 * This class provides functions for Txrefs
 */
class Txref{

	/**
	 * Chain identifier
	 */
	static CHAIN_MAINNET = 'mainnet'
	static CHAIN_TESTNET = 'testnet'

	/**
	 * Human readable part of bech32 data
	 */
	static BECH32_HRP_MAINNET = 'tx'
	static BECH32_HRP_TESTNET = 'txtest'

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
		if (chain !== Txref.CHAIN_MAINNET && chain !== Txref.CHAIN_TESTNET)
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

		let type,data

		//Set the txref type and initialise binary data
		if(utxoIndex !== undefined){
			type = (chain === Txref.CHAIN_MAINNET) ? TYPE_MAINNET_EXT : TYPE_TESTNET_EXT
			data = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
		} else {
			type = (chain === Txref.CHAIN_MAINNET) ? TYPE_MAINNET : TYPE_TESTNET
			data = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
		}


		//set the type bit in the data
		data[0] = type

		//encode the blockHeight
		data[1] |= ((blockHeight & 0xF) << 1);
		data[2] |= ((blockHeight & 0x1F0) >> 4);
		data[3] |= ((blockHeight & 0x3E00) >> 9);
		data[4] |= ((blockHeight & 0x7C000) >> 14);
		data[5] |= ((blockHeight & 0xF80000) >> 19);

		//encode the blockIndex
		data[6] |= (blockIndex & 0x1F);
		data[7] |= ((blockIndex & 0x3E0) >> 5);
  		data[8] |= ((blockIndex & 0x7C00) >> 10);

		//encode the utxoIndex
		if(utxoIndex != undefined) {
			data[9]  |=  (utxoIndex & 0x1F);
    		data[10] |= ((utxoIndex & 0x3E0) >> 5);
    		data[11] |= ((utxoIndex & 0x7C00) >> 10);
		}

		return data
	}

	/**
	 * Convert binary txref to a bech32 formatted string with
	 * delimiters to make it more human readable
	 *
	 * @param {binary} data
	 *   The binary encoded txref
	 *
	 * @return {string} txref
	 *   The txref in human readable form
	 */
	static binaryToString(data){

		//determine the chain from the first data byte and set 
		//the human readable part
		const bech32hrp = (data[0] === TYPE_MAINNET || data[0] === TYPE_MAINNET_EXT) ?
			Txref.BECH32_HRP_MAINNET : Txref.BECH32_HRP_TESTNET
		
		//encode the human readable part and data as bech32
		const bech32encoded = bech32.encode(bech32hrp, data)

		//add delimiters to the bech32encoded string
		const splitIndex = 4
		const delimiter = '-'
		
		//Initialise the txref
		const dataStart = bech32hrp.length + 1
		let txref = bech32encoded.substring(0, dataStart) + ':'
			+ bech32encoded.substring(dataStart, dataStart + splitIndex)
		
		//Add to txref remaining data with delimiter
		//Initialise with dataStart + splitIndex as we've already added the human
		//readable part and the first part of the data in the step above
		for(var i = dataStart + splitIndex; i < bech32encoded.length + 1; i += splitIndex){
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
		if (! txref.match(/^tx(test)?1:[a-z0-9]{4}(-[a-z0-9]{4}){2}/g)){
			throw new Error('Invalid txref')
		}

		//strip the delimiter formatting
		const unformattedTxref = txref.replace(/[-:]/g, '')

		//convert the string to binary data
		const bTxref = bech32.decode(unformattedTxref)

		//decode the blockHeight
		blockHeight = (bTxref.data[1] >> 1)
		blockHeight |= (bTxref.data[2] << 4)
		blockHeight |= (bTxref.data[3] << 9)
		blockHeight |= (bTxref.data[4] << 14)
		blockHeight |= (bTxref.data[5] << 19)

		//decode the blockIndex
		blockIndex = bTxref.data[6]
		blockIndex |= (bTxref.data[7] << 5)
		blockIndex |= (bTxref.data[8] << 10)

		//decode the utxoIndex
		if(bTxref.data.length == 12){
			utxoIndex = bTxref.data[9]
			utxoIndex |= (bTxref.data[10] << 5)
			utxoIndex |= (bTxref.data[11] << 10)
		}

		//decode the chain
		(bTxref.hrp === Txref.BECH32_HRP_MAINNET) ?
			chain = Txref.CHAIN_MAINNET : chain = Txref.CHAIN_TESTNET

		return {
			chain,
			blockHeight,
			blockIndex,
			utxoIndex
		}

	}
}

module.exports = Txref
