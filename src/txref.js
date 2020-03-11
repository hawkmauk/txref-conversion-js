const Bech32 = require('./bech32')
const Bech32hrp = require('./bech32hrp')
//Bech32.setConstant(1)

/**
 * This class provides functions for Txrefs.  There isn't any need to
 * createan instance of this class so only static methods are provided.
 *
 * @class
 */
class Txref{

	/**
	 * Human readable part of bech32 data to signify
	 * the bitcoin mainnet chain
	 */
	//static BECH32_HRP_MAINNET = 'tx'
	static BECH32_HRP_MAINNET = Bech32hrp.BTC_MAINNET
	/**
	 * Human readable part of bech32 data to signify
	 * the bitcoin testnet chain
	 */
	//static BECH32_HRP_TESTNET = 'txtest'
	static BECH32_HRP_TESTNET = Bech32hrp.BTC_TESTNET
	/**
	 * The initial byte of the bech32 data to signify
	 * the bitcoin mainnet chain
	 */
	static TYPE_MAINNET = 0x03
	/**
	 * The initial byte of the bech32 data to signify
	 * the bitcoin mainnet chain with utxoIndex data
	 */
	static TYPE_MAINNET_EXT = 0x04
	/**
	 * The initial byte of the bech32 data to signify
	 * the bitcoin testnet chain
	 */
	static TYPE_TESTNET = 0x06
	/**
	 * The initial byte of the bech32 data to signify
	 * the bitcoin testnet chain with utxoIndex data
	 */
	static TYPE_TESTNET_EXT=0x07

    /**
     * @hideconstructor
     */

	/**
	 * Encode transaction location data into a txref
	 * 
	 * @param {string} chain - chain The name of the btc chain mainnet or testnet
     *
     * @param {Number} blockHeight - The block in which the transaction is found
     *
	 * @param {Number} blockIndex - The position in the block where the transaction is found
     *
	 * @param {Number} utxoIndex - The position of the utxo in the transaction input
	 *
	 * @returns {string} txref - The Bech32 txref
	 */
	static encode(chain, blockHeight, blockIndex, utxoIndex){
		
		//check for valid chain
		if (chain !== Bech32hrp.BTC_MAINNET && chain !== Bech32hrp.BTC_TESTNET)
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
	 * @param {string} chain - chain The name of the btc chain mainnet or testnet
     *
	 * @param {Number} block_height - The block in which the transaction is found
     *
	 * @param {Number} block_index - The position in the block where the transaction is found
     *
	 * @param {Number} utxo_index - The position of the utxo in the transaction input
	 *
	 * @return {binary} txref
	 * 	A binary encoded txref
	 */
	// With a utxoIndex the data is 12 bytes long, without it is 9
	// Bytes 0   : Identifies whether the txref is for mainnet|testnet and
	//             whether it includes a utxoRef
	// Bytes 1-5 : Encodes the blockheight
	// Bytes 6-8 : Encodes the blockIndex
	// Bytes 9-11: Encodes the utxoIndex
	static binaryEncode(chain, block_height, block_index, utxo_index){

		let hrp,data

		//Set the txref type and initialise binary data.  This is returned as *data* for the
		//beck32 library so we define it here to keep it consistent
		if(utxo_index !== undefined){
			hrp = (chain === Bech32hrp.BTC_MAINNET) ? Txref.TYPE_MAINNET_EXT : Txref.TYPE_TESTNET_EXT
			data = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
		} else {
			hrp = (chain === Bech32hrp.BTC_MAINNET) ? Txref.TYPE_MAINNET : Txref.TYPE_TESTNET
			data = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
		}


		//set the type bit in the data
		data[0] = hrp

		//encode the blockHeight
		data[1] |= ((block_height & 0xF) << 1);
		data[2] |= ((block_height & 0x1F0) >> 4);
		data[3] |= ((block_height & 0x3E00) >> 9);
		data[4] |= ((block_height & 0x7C000) >> 14);
		data[5] |= ((block_height & 0xF80000) >> 19);

		//encode the blockIndex
		data[6] |= (block_index & 0x1F);
		data[7] |= ((block_index & 0x3E0) >> 5);
  		data[8] |= ((block_index & 0x7C00) >> 10);

		//encode the utxoIndex
		if(utxo_index != undefined) {
			data[9]  |=  (utxo_index & 0x1F);
    		data[10] |= ((utxo_index & 0x3E0) >> 5);
    		data[11] |= ((utxo_index & 0x7C00) >> 10);
		}

		return data
	}

	/**
	 * Convert binary txref to a bech32 formatted string with
	 * delimiters to make it more human readable.
	 *
	 * @param {binary} data - The binary encoded bech32 txref.
     *
	 * @return {string} txref - The txref in human readable form
	 */
	// The name 'data' is used throughout in keeping with the Bech32
	// naming in object returned from the Bech32 library:
	//	`{ hrp: xx, data: xxxxxxx }`
	static binaryToString(data){

		//determine the chain from the first 'data' byte and set 
		//the 'hrp' which is the human readable part
		const hrp = (data[0] === Txref.TYPE_MAINNET || data[0] === Txref.TYPE_MAINNET_EXT) ?
			Txref.BECH32_HRP_MAINNET : Txref.BECH32_HRP_TESTNET
		
		//encode the human readable part and data as bech32
		const bech32encoded = Bech32.encode(hrp, data)

		//add delimiters to the bech32encoded string
		const splitIndex = 4
		const delimiter = '-'
		
		//Initialise the txref
		const dataStart = hrp.length + 1
		let txref = bech32encoded.substring(0, dataStart) + ':'
			+ bech32encoded.substring(dataStart, dataStart + splitIndex)
		
		//Add to txref remaining data with delimiter
		//Initialise with dataStart + splitIndex as we've already added the human
		//readable part (hrp) and the first part of the data in the step above
		for(var i = dataStart + splitIndex; i < bech32encoded.length + 1; i += splitIndex){
			txref += delimiter + bech32encoded.substring(i, i + splitIndex)
		}

		return txref
	}


	/**
	 * Convert a txref to ttransaction data
	 *
	 * @param {Txref} txref - The txref encoding the transaction position
	 *
	 * @return {{chain, blockHeight, blockIndex, utxoIndex}} tx - The transaction data encoded in the txref
	 */
	static decode(txref){

		let chain, block_height, block_index, utxo_index

        const regexString = '^('+Bech32hrp.BTC_MAINNET+'|'+Bech32hrp.BTC_TESTNET+')?1:[a-z0-9]{4}(-[a-z0-9]{4}){2}'
        const regex = new RegExp(regexString,'g')
		//check for valid txref
		if (! txref.match(regex)){
			throw new Error('Invalid txref')
		}

		//strip the delimiter formatting
		const unformattedTxref = txref.replace(/[-:]/g, '')

		//convert the string to binary data
		const bTxref = Bech32.decode(unformattedTxref)

		//decode the blockHeight
		block_height = (bTxref.data[1] >> 1)
		block_height |= (bTxref.data[2] << 4)
		block_height |= (bTxref.data[3] << 9)
		block_height |= (bTxref.data[4] << 14)
		block_height |= (bTxref.data[5] << 19)

		//decode the blockIndex
		block_index = bTxref.data[6]
		block_index |= (bTxref.data[7] << 5)
		block_index |= (bTxref.data[8] << 10)

		//decode the utxoIndex
		if(bTxref.data.length == 12){
			utxo_index = bTxref.data[9]
			utxo_index |= (bTxref.data[10] << 5)
			utxo_index |= (bTxref.data[11] << 10)
		}

		//decode the chain
		(bTxref.hrp === Txref.BECH32_HRP_MAINNET) ?
			chain = Bech32hrp.BTC_MAINNET : chain = Bech32hrp.BTC_TESTNET

		return {
			chain,
			block_height,
			block_index,
			utxo_index
		}

	}
}

module.exports = Txref
