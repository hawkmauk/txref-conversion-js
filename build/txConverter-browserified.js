(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'
var ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

// pre-compute lookup table
var ALPHABET_MAP = {}
for (var z = 0; z < ALPHABET.length; z++) {
  var x = ALPHABET.charAt(z)

  if (ALPHABET_MAP[x] !== undefined) throw new TypeError(x + ' is ambiguous')
  ALPHABET_MAP[x] = z
}

function polymodStep (pre) {
  var b = pre >> 25
  return ((pre & 0x1FFFFFF) << 5) ^
    (-((b >> 0) & 1) & 0x3b6a57b2) ^
    (-((b >> 1) & 1) & 0x26508e6d) ^
    (-((b >> 2) & 1) & 0x1ea119fa) ^
    (-((b >> 3) & 1) & 0x3d4233dd) ^
    (-((b >> 4) & 1) & 0x2a1462b3)
}

function prefixChk (prefix) {
  var chk = 1
  for (var i = 0; i < prefix.length; ++i) {
    var c = prefix.charCodeAt(i)
    if (c < 33 || c > 126) throw new Error('Invalid prefix (' + prefix + ')')

    chk = polymodStep(chk) ^ (c >> 5)
  }
  chk = polymodStep(chk)

  for (i = 0; i < prefix.length; ++i) {
    var v = prefix.charCodeAt(i)
    chk = polymodStep(chk) ^ (v & 0x1f)
  }
  return chk
}

function encode (prefix, words, LIMIT) {
  LIMIT = LIMIT || 90
  if ((prefix.length + 7 + words.length) > LIMIT) throw new TypeError('Exceeds length limit')

  prefix = prefix.toLowerCase()

  // determine chk mod
  var chk = prefixChk(prefix)
  var result = prefix + '1'
  for (var i = 0; i < words.length; ++i) {
    var x = words[i]
    if ((x >> 5) !== 0) throw new Error('Non 5-bit word')

    chk = polymodStep(chk) ^ x
    result += ALPHABET.charAt(x)
  }

  for (i = 0; i < 6; ++i) {
    chk = polymodStep(chk)
  }
  chk ^= 1

  for (i = 0; i < 6; ++i) {
    var v = (chk >> ((5 - i) * 5)) & 0x1f
    result += ALPHABET.charAt(v)
  }

  return result
}

function decode (str, LIMIT) {
  LIMIT = LIMIT || 90
  if (str.length < 8) throw new TypeError(str + ' too short')
  if (str.length > LIMIT) throw new TypeError('Exceeds length limit')

  // don't allow mixed case
  var lowered = str.toLowerCase()
  var uppered = str.toUpperCase()
  if (str !== lowered && str !== uppered) throw new Error('Mixed-case string ' + str)
  str = lowered

  var split = str.lastIndexOf('1')
  if (split === -1) throw new Error('No separator character for ' + str)
  if (split === 0) throw new Error('Missing prefix for ' + str)

  var prefix = str.slice(0, split)
  var wordChars = str.slice(split + 1)
  if (wordChars.length < 6) throw new Error('Data too short')

  var chk = prefixChk(prefix)
  var words = []
  for (var i = 0; i < wordChars.length; ++i) {
    var c = wordChars.charAt(i)
    var v = ALPHABET_MAP[c]
    if (v === undefined) throw new Error('Unknown character ' + c)
    chk = polymodStep(chk) ^ v

    // not in the checksum?
    if (i + 6 >= wordChars.length) continue
    words.push(v)
  }

  if (chk !== 1) throw new Error('Invalid checksum for ' + str)
  return { prefix: prefix, words: words }
}

function convert (data, inBits, outBits, pad) {
  var value = 0
  var bits = 0
  var maxV = (1 << outBits) - 1

  var result = []
  for (var i = 0; i < data.length; ++i) {
    value = (value << inBits) | data[i]
    bits += inBits

    while (bits >= outBits) {
      bits -= outBits
      result.push((value >> bits) & maxV)
    }
  }

  if (pad) {
    if (bits > 0) {
      result.push((value << (outBits - bits)) & maxV)
    }
  } else {
    if (bits >= inBits) throw new Error('Excess padding')
    if ((value << (outBits - bits)) & maxV) throw new Error('Non-zero padding')
  }

  return result
}

function toWords (bytes) {
  return convert(bytes, 8, 5, true)
}

function fromWords (words) {
  return convert(words, 5, 8, false)
}

module.exports = {
  decode: decode,
  encode: encode,
  toWords: toWords,
  fromWords: fromWords
}

},{}],2:[function(require,module,exports){
'use strict'
/* global fetch, btoa, Headers */
const core = require('./core')

class StatusError extends Error {
  constructor (res, ...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StatusError)
    }

    this.message = `Incorrect statusCode: ${res.status}`
    this.statusCode = res.status
    this.res = res
    this.responseBody = res.arrayBuffer()
  }
}

const mkrequest = (statusCodes, method, encoding, headers, baseurl) => async (_url, body, _headers = {}) => {
  _url = baseurl + (_url || '')
  let parsed = new URL(_url)

  if (!headers) headers = {}
  if (parsed.username) {
    headers.Authorization = 'Basic ' + btoa(parsed.username + ':' + parsed.password)
    parsed = new URL(parsed.protocol + '//' + parsed.host + parsed.pathname + parsed.search)
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`Unknown protocol, ${parsed.protocol}`)
  }

  if (body) {
    if (body instanceof ArrayBuffer ||
      ArrayBuffer.isView(body) ||
      typeof body === 'string'
    ) {
      // noop
    } else if (typeof body === 'object') {
      body = JSON.stringify(body)
      headers['Content-Type'] = 'application/json'
    } else {
      throw new Error('Unknown body type.')
    }
  }

  _headers = new Headers({ ...(headers || {}), ..._headers })

  const resp = await fetch(parsed, { method, headers: _headers, body })
  resp.statusCode = resp.status

  if (!statusCodes.has(resp.status)) {
    throw new StatusError(resp)
  }

  if (encoding === 'json') return resp.json()
  else if (encoding === 'buffer') return resp.arrayBuffer()
  else if (encoding === 'string') return resp.text()
  else return resp
}

module.exports = core(mkrequest)

},{"./core":3}],3:[function(require,module,exports){
'use strict'
const encodings = new Set(['json', 'buffer', 'string'])

module.exports = mkrequest => (...args) => {
  const statusCodes = new Set()
  let method
  let encoding
  let headers
  let baseurl = ''

  args.forEach(arg => {
    if (typeof arg === 'string') {
      if (arg.toUpperCase() === arg) {
        if (method) {
          const msg = `Can't set method to ${arg}, already set to ${method}.`
          throw new Error(msg)
        } else {
          method = arg
        }
      } else if (arg.startsWith('http:') || arg.startsWith('https:')) {
        baseurl = arg
      } else {
        if (encodings.has(arg)) {
          encoding = arg
        } else {
          throw new Error(`Unknown encoding, ${arg}`)
        }
      }
    } else if (typeof arg === 'number') {
      statusCodes.add(arg)
    } else if (typeof arg === 'object') {
      if (headers) {
        throw new Error('Cannot set headers twice.')
      }
      headers = arg
    } else {
      throw new Error(`Unknown type: ${typeof arg}`)
    }
  })

  if (!method) method = 'GET'
  if (statusCodes.size === 0) {
    statusCodes.add(200)
  }

  return mkrequest(statusCodes, method, encoding, headers, baseurl)
}

},{}],4:[function(require,module,exports){
/**
 *  @readonly
 *  @enum {string}
 *	Define standard chain identifiers as per the Bech32Prefix definition
 *	See https://github.com/satoshilabs/slips/blob/master/slip-0173.md
 */
var Bech32Prefix = {

    /**
     * Bech32Prefix for BTC mainnet
     */
	BTC_MAINNET: 'bc',
    /**
     * Bech32Prefix for BTC testnet
     */
	BTC_TESTNET: 'tb',
    /**
     * Bech32Prefix for BTC regtest
     */
	BTC_REGTEST: 'bcrt'

}

module.exports = Bech32Prefix

},{}],5:[function(require,module,exports){
/**
 * AbstractDao describes the Dao interface and implements a set of methods that should be
 * overridden by classes inheriting it.
 *
 * @class
 * @abstract
 */
class AbstractDao{

	/**
     * Generic data access object
     * @hideconstructor
     *
	 * @param {Bech32Prefix} chain - Bech32Prefix that identifies the chain to access.
     *
	 * @return {dao} - An instance of the Dao
	 */
	constructor(chain) {
    	if (new.target === AbstractDao) {
      		throw new TypeError("Cannot construct AbstractDao instances directly");
    	}
  	}
}

/**
 * @abstract
 * @param {Number} block_height - The block that the transaction is recorded in
 *
 * @param {Number} block_index -  The position of the transaction in the block
 *
 * @return {tx} tx - The transaction
 */
AbstractDao.prototype.getTxByIndex = (block_height,block_index) => {
    throw new Error('not implemented')
}

/**
 * @abstract
 * @param {string} txid - A transaction id referring to a tansaction in the data store
 *
 * @return {{object}} - tx The transaction data
 */
AbstractDao.prototype.getTxiById = (txid) => {
	throw new Error('not implemented')
}

module.exports = AbstractDao

},{}],6:[function(require,module,exports){
const bent = require('bent')
const Bech32Prefix = require('../bech32prefix')
const AbstractDao = require('./abstractDao')

/**
 * This class handles Data Access from the blockcypher API
 */
class BlockcypherDao extends AbstractDao{


	static URL_BASE = 'https://api.blockcypher.com/v1/btc'

	/**
	 * Creates an instance of the BlockcypherDao
	 *
	 * @param {Bech32Prefix} chain - The chain should be set using one of the chain variables
	 */
	constructor( chain = Bech32Prefix.BTC_TESTNET ){
		
		// Call the AbstractDao constructor
		super(chain)

		// Test for valid chain
		if (
			chain === Bech32Prefix.BTC_MAINNET ||
			chain === Bech32Prefix.BTC_TESTNET
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
	const tx = await getJson(url)
	return tx

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
    //format the url
	const url = `${BlockcypherDao.URL_BASE}/${urlChain}/blocks/${block_height}?txstart=${block_index}&limit=1`
    //return the json data
    const getJson = bent('json')
    const block = await getJson(url)
    //return the txid
    return block.txids[0]

}

const getUrlChain = ( chain ) => (chain === Bech32Prefix.BTC_MAINNET) ? 'main' : 'test3'

module.exports = BlockcypherDao

},{"../bech32prefix":4,"./abstractDao":5,"bent":2}],7:[function(require,module,exports){
const BlockcypherDao = require('./blockcypherDao')
const MockDao = require('./mockDao')

/**
 *  @readonly
 *  @enum {Number}
 *  Define identifiers for the different supported dao types
 */
var DaoType = {

    /** Identifier for the MockDao */
    MOCK: 0,
    /** Identifier for the BlockcypherDao */
    BLOCKCYPHER: 1,

}

/**
 * Implements factory pattern to return an instance of a dao
 */
class DaoFactory{

}

/**
 *	Cretae an instance of a dao and return it
 *
 *	@param {DaoType} provider - The provider as defined in the static variables of this class
 *
 *	@param {Bech32Prefix} chain - The Bech32 registered prefix used to identify the chain
 *
 *	@return {AbstractDao} dao - An instance of a class extending the AbstractDao subtype
 */
DaoFactory.get = ((provider, chain) => {
		
	if(provider === DaoType.MOCK){
		return new MockDao(chain)
	}else if (provider === DaoType.BLOCKCYPHER){
		return new BlockcypherDao(chain)
	}else{
		throw new Error('Dao not recognised')
	}
})

module.exports = { DaoType, DaoFactory }

},{"./blockcypherDao":6,"./mockDao":8}],8:[function(require,module,exports){
const Bech32Prefix = require('../bech32prefix')
const AbstractDao = require('./abstractDao')
const data = require('../../test/data')

/**
 * Dao for accessing test data.
 */
class MockDao extends AbstractDao {

	/**
	 * Creates a MockDao Instance
	 *
	 * @param {Bech32Prefix} chain - Bech32Prefix describing the chain to access
     *
     * @returns {MockDao} dao - An instance of the dao
	 */
	constructor( chain = Bech32Prefix.BTC_TESTNET ){
		
		//Initialise the parent object 
		super( chain )
		this.chain = chain
	}

}

Object.setPrototypeOf(MockDao.prototype, AbstractDao)

/**
 * Returns a transaction object using the txid
 *
 * @param {string} txid - The transaction id of the transaction to be returned
 *
 * @return {Object} tx - The transaction with the given transactionId
 *
 * @override
 */
MockDao.prototype.getTxById = async (txid) => {

	const tx = await data.find( tx => tx.txid === txid )
	// transform the data to match generic transaction format
	return parse(tx)

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
MockDao.prototype.getTxByIndex = async (block_height, block_index) => {

	const tx = await data.find( tx => tx.block_height === block_height && tx.block_index === block_index )
	return tx
}

parse = (tx) => {
	return tx
}

module.exports = MockDao

},{"../../test/data":11,"../bech32prefix":4,"./abstractDao":5}],9:[function(require,module,exports){
const Txref = require('./txref')
const Bech32Prefix = require('./bech32prefix')
const { DaoType, DaoFactory } = require('./dao/daoFactory')

const PROVIDER = DaoType.BLOCKCYPHER

const txrefDecode = (txref) => {
    return Txref.decode(txref)
}

const txrefEncode = (chain, blockHeight, txPos, utxoIndex) => {
    return Txref.encode(chain, blockHeight, txpos, utxoIndex) 
}

const getTxDetails = async (txid, chain, utxoIndex) => {

    const dao = DaoFactory(PROVIDER, chain)
    const tx = await dao.getTxById(txid)

    return tx

}

const txidToTxref = async (txid, chain, utxoIndex) => {

    const tx = txDetailsFromTxid(txid, chain, utxoIndex)
    const txref = Txref.encode(chain, tx.block_height, tx.block_index, utxoIndex)

    return txref

}

const txrefToTxid = (txref) => {

    const tx = txDetailsFromTxref(txref)

    return tx.txid
}

const txDetailsFromTxid = async (txid, chain, utxoIndex) => {

    const dao = DaoFactory(PROVIDER, chain)
    const tx = await dao.getTxById(txid)

    return tx
}

const txDetailsFromTxref = (txref) => {

    const txdata = Txref.decode(txref)
    const dao = DaoFactory(PROVIDER, txdata.chain)
    const tx = dao.getTxByBlock(txdata.block_height, txdata.block_index)

    return tx

}

module.exports = {
  txrefDecode: txrefDecode,
  txrefEncode: txrefEncode,
  txidToTxref: txidToTxref,
  txrefToTxid: txrefToTxid,
  getTxDetails: getTxDetails,
  txDetailsFromTxid: txDetailsFromTxid,
  txDetailsFromTxref: txDetailsFromTxref,
  MAGIC_BTC_MAINNET: Txref.TYPE_MAINNET,
  MAGIC_BTC_TESTNET: Txref.TYPE_TESTNET,
  TXREF_BECH32_HRP_MAINNET: Bech32Prefix.BTC_MAINNET,
  TXREF_BECH32_HRP_TESTNET: Bech32Prefix.BTC_TESTNET,
  CHAIN_MAINNET: Bech32Prefix.BTC_MAINNET,
  CHAIN_TESTNET: Bech32Prefix.BTC_TESTNET
};

},{"./bech32prefix":4,"./dao/daoFactory":7,"./txref":10}],10:[function(require,module,exports){
const Bech32 = require('bech32')
const Bech32Prefix = require('./bech32prefix')


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
	static BECH32_HRP_MAINNET = Bech32Prefix.BTC_MAINNET
	/**
	 * Human readable part of bech32 data to signify
	 * the bitcoin testnet chain
	 */
	//static BECH32_HRP_TESTNET = 'txtest'
	static BECH32_HRP_TESTNET = Bech32Prefix.BTC_TESTNET
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
		if (chain !== Bech32Prefix.BTC_MAINNET && chain !== Bech32Prefix.BTC_TESTNET)
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

		let type,words

		//Set the txref type and initialise binary data.  This is returned as *words* for the
		//beck32 library so we define it here to keep it consistent
		if(utxo_index !== undefined){
			type = (chain === Bech32Prefix.BTC_MAINNET) ? Txref.TYPE_MAINNET_EXT : Txref.TYPE_TESTNET_EXT
			words = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
		} else {
			type = (chain === Bech32Prefix.BTC_MAINNET) ? Txref.TYPE_MAINNET : Txref.TYPE_TESTNET
			words = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
		}


		//set the type bit in the data
		words[0] = type

		//encode the blockHeight
		words[1] |= ((block_height & 0xF) << 1);
		words[2] |= ((block_height & 0x1F0) >> 4);
		words[3] |= ((block_height & 0x3E00) >> 9);
		words[4] |= ((block_height & 0x7C000) >> 14);
		words[5] |= ((block_height & 0xF80000) >> 19);

		//encode the blockIndex
		words[6] |= (block_index & 0x1F);
		words[7] |= ((block_index & 0x3E0) >> 5);
  		words[8] |= ((block_index & 0x7C00) >> 10);

		//encode the utxoIndex
		if(utxo_index != undefined) {
			words[9]  |=  (utxo_index & 0x1F);
    		words[10] |= ((utxo_index & 0x3E0) >> 5);
    		words[11] |= ((utxo_index & 0x7C00) >> 10);
		}

		return words
	}

	/**
	 * Convert binary txref to a bech32 formatted string with
	 * delimiters to make it more human readable.
	 *
	 * @param {binary} words - The binary encoded bech32 txref.
     *
	 * @return {string} txref - The txref in human readable form
	 */
	// The name 'words' is used throughout in keeping with the Bech32
	// naming in object returned from the Bech32 library:
	//	`{ prefix: xx, words: xxxxxxx }`
	static binaryToString(words){

		//determine the chain from the first 'words' byte and set 
		//the 'prefix' which is the human readable part
		const prefix = (words[0] === Txref.TYPE_MAINNET || words[0] === Txref.TYPE_MAINNET_EXT) ?
			Txref.BECH32_HRP_MAINNET : Txref.BECH32_HRP_TESTNET
		
		//encode the human readable part and data as bech32
		const bech32encoded = Bech32.encode(prefix, words)

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
	 * @param {Txref} txref - The txref encoding the transaction position
	 *
	 * @return {{chain, blockHeight, blockIndex, utxoIndex}} tx - The transaction data encoded in the txref
	 */
	static decode(txref){

		let chain, block_height, block_index, utxo_index

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
		const bTxref = Bech32.decode(unformattedTxref)

		//decode the blockHeight
		block_height = (bTxref.words[1] >> 1)
		block_height |= (bTxref.words[2] << 4)
		block_height |= (bTxref.words[3] << 9)
		block_height |= (bTxref.words[4] << 14)
		block_height |= (bTxref.words[5] << 19)

		//decode the blockIndex
		block_index = bTxref.words[6]
		block_index |= (bTxref.words[7] << 5)
		block_index |= (bTxref.words[8] << 10)

		//decode the utxoIndex
		if(bTxref.words.length == 12){
			utxo_index = bTxref.words[9]
			utxo_index |= (bTxref.words[10] << 5)
			utxo_index |= (bTxref.words[11] << 10)
		}

		//decode the chain
		(bTxref.prefix === Txref.BECH32_HRP_MAINNET) ?
			chain = Bech32Prefix.BTC_MAINNET : chain = Bech32Prefix.BTC_TESTNET

		return {
			chain,
			block_height,
			block_index,
			utxo_index
		}

	}
}

module.exports = Txref

},{"./bech32prefix":4,"bech32":1}],11:[function(require,module,exports){
const Bech32Prefix = require('../src/bech32prefix')
const Dao = require('../src/dao/abstractDao')

const tx = [
{
	name: 'a mainnet tx with block height 0 and pos 0',
	chain: Bech32Prefix.BTC_MAINNET,
	block_height: 0,
	block_index: 0,
	txref: 'bc1:rqqq-qqqq-q2hc-3q6',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 1 and pos 0 and txid of 0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
	chain: Bech32Prefix.BTC_MAINNET,
	block_height: 1,
	block_index: 0,
	txref: 'bc1:rzqq-qqqq-qeqc-6sw', //bc1:rzqq-qqqq-qhlr-5ct',
	txid: '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 2097151 and pos 1000',
	chain: Bech32Prefix.BTC_MAINNET,
	block_height: 2097151,
	block_index: 1000,
	txref: 'bc1:r7ll-lrgl-q3sq-27j', //bc1:r7ll-lrgl-ql0m-ykh',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 2097151 and pos 8191',
	chain: Bech32Prefix.BTC_MAINNET,
	block_height: 2097151,
	block_index: 8191,
	txref: 'bc1:r7ll-lrll-8hwu-496', //bc1:r7ll-lrll-8e38-mdl',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 2097151 and pos 0',
	chain: Bech32Prefix.BTC_MAINNET,
	block_height: 2097151,
	block_index: 0,
	txref: 'bc1:r7ll-lrqq-qq2m-n0a', //bc1:r7ll-lrqq-qw4q-a8c',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0 and pos 8191',
	chain: Bech32Prefix.BTC_MAINNET,
	block_height: 0,
	block_index: 8191,
	txref: 'bc1:rqqq-qqll-8anl-h2a', //bc1:rqqq-qqll-8nvy-ezc',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 467883 and pos 2355 and txid of 016b71d9ec62709656504f1282bb81f7acf998df025e54bd68ea33129d8a425b',
	chain: Bech32Prefix.BTC_MAINNET,
	block_height: 467883,
	block_index: 2355,
	txref: 'bc1:rk63-uqnf-zpcv-9a9', //bc1:rk63-uqnf-z08h-t4q',
	txid: '016b71d9ec62709656504f1282bb81f7acf998df025e54bd68ea33129d8a425b',
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0x1FFFFF and pos 0',
	chain: Bech32Prefix.BTC_MAINNET,
	block_height: 0x1FFFFF,
	block_index: 0,
	txref: 'bc1:r7ll-lrqq-qq2m-n0a', //bc1:r7ll-lrqq-qw4q-a8c',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0x71F69 and pos 0x89D',
	chain: Bech32Prefix.BTC_MAINNET,
	block_height: 0x71F69,
	block_index: 0x89D,
	txref: 'bc1:rjk0-uqay-zpr2-xhz', //bc1:rjk0-uqay-z0u3-gl8',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 466793 and pos 2205',
	chain: Bech32Prefix.BTC_MAINNET,
	block_height: 466793,
	block_index: 2205,
	txref: 'bc1:rjk0-uqay-zpr2-xhz', //bc1:rjk0-uqay-z0u3-gl8',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0 and pos 0x7FFF',
	chain: Bech32Prefix.BTC_MAINNET,
	block_height: 0,
	block_index: 0x7FFF,
	txref: 'bc1:rqqq-qqll-lkxn-rpn', //bc1:rqqq-qqll-lceg-dfk',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0xFFFFFF and pos 0x7FFF',
	chain: Bech32Prefix.BTC_MAINNET,
	block_height: 0xFFFFFF,
	block_index: 0x7FFF,
	txref: 'bc1:r7ll-llll-l9x0-r44', //bc1:r7ll-llll-lte5-das',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a testnet tx with block height 467883 and pos 2355',
	chain: Bech32Prefix.BTC_TESTNET,
	block_height: 467883,
	block_index: 2355,
	txref: 'tb1:xk63-uqnf-ze06-7t2', //tb1:xk63-uqnf-zz0k-3h7',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a testnet tx with block height 0 and pos 0',
	chain: Bech32Prefix.BTC_TESTNET,
	block_height: 0,
	block_index: 0,
	txref: 'tb1:xqqq-qqqq-qjqw-2k4', //tb1:xqqq-qqqq-qfqz-92p',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a testnet tx with block height 0xFFFFFF and pos 0x7FFF',
	chain: Bech32Prefix.BTC_TESTNET,
	block_height: 0xFFFFFF,
	block_index: 0x7FFF,
	txref: 'tb1:x7ll-llll-la3e-cr6', //tb1:x7ll-llll-lx34-hlw',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a testnet tx with block height 1152194 and pos 1 and txid of f8cdaff3ebd9e862ed5885f8975489090595abe1470397f79780ead1c7528107',
	chain: Bech32Prefix.BTC_TESTNET,
	block_height: 1152194,
	block_index: 1,
	txref: 'tb1:xyv2-xzpq-qp3w-3ap', //tb1:xyv2-xzpq-q63z-7p4',
	txid: 'f8cdaff3ebd9e862ed5885f8975489090595abe1470397f79780ead1c7528107',
	utxoIndex: undefined
}]




module.exports = tx

},{"../src/bech32prefix":4,"../src/dao/abstractDao":5}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmVjaDMyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2JlbnQvc3JjL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYmVudC9zcmMvY29yZS5qcyIsInNyYy9iZWNoMzJwcmVmaXguanMiLCJzcmMvZGFvL2Fic3RyYWN0RGFvLmpzIiwic3JjL2Rhby9ibG9ja2N5cGhlckRhby5qcyIsInNyYy9kYW8vZGFvRmFjdG9yeS5qcyIsInNyYy9kYW8vbW9ja0Rhby5qcyIsInNyYy90eENvbnZlcnRlci5qcyIsInNyYy90eHJlZi5qcyIsInRlc3QvZGF0YS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnXG52YXIgQUxQSEFCRVQgPSAncXB6cnk5eDhnZjJ0dmR3MHMzam41NGtoY2U2bXVhN2wnXG5cbi8vIHByZS1jb21wdXRlIGxvb2t1cCB0YWJsZVxudmFyIEFMUEhBQkVUX01BUCA9IHt9XG5mb3IgKHZhciB6ID0gMDsgeiA8IEFMUEhBQkVULmxlbmd0aDsgeisrKSB7XG4gIHZhciB4ID0gQUxQSEFCRVQuY2hhckF0KHopXG5cbiAgaWYgKEFMUEhBQkVUX01BUFt4XSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgVHlwZUVycm9yKHggKyAnIGlzIGFtYmlndW91cycpXG4gIEFMUEhBQkVUX01BUFt4XSA9IHpcbn1cblxuZnVuY3Rpb24gcG9seW1vZFN0ZXAgKHByZSkge1xuICB2YXIgYiA9IHByZSA+PiAyNVxuICByZXR1cm4gKChwcmUgJiAweDFGRkZGRkYpIDw8IDUpIF5cbiAgICAoLSgoYiA+PiAwKSAmIDEpICYgMHgzYjZhNTdiMikgXlxuICAgICgtKChiID4+IDEpICYgMSkgJiAweDI2NTA4ZTZkKSBeXG4gICAgKC0oKGIgPj4gMikgJiAxKSAmIDB4MWVhMTE5ZmEpIF5cbiAgICAoLSgoYiA+PiAzKSAmIDEpICYgMHgzZDQyMzNkZCkgXlxuICAgICgtKChiID4+IDQpICYgMSkgJiAweDJhMTQ2MmIzKVxufVxuXG5mdW5jdGlvbiBwcmVmaXhDaGsgKHByZWZpeCkge1xuICB2YXIgY2hrID0gMVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHByZWZpeC5sZW5ndGg7ICsraSkge1xuICAgIHZhciBjID0gcHJlZml4LmNoYXJDb2RlQXQoaSlcbiAgICBpZiAoYyA8IDMzIHx8IGMgPiAxMjYpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwcmVmaXggKCcgKyBwcmVmaXggKyAnKScpXG5cbiAgICBjaGsgPSBwb2x5bW9kU3RlcChjaGspIF4gKGMgPj4gNSlcbiAgfVxuICBjaGsgPSBwb2x5bW9kU3RlcChjaGspXG5cbiAgZm9yIChpID0gMDsgaSA8IHByZWZpeC5sZW5ndGg7ICsraSkge1xuICAgIHZhciB2ID0gcHJlZml4LmNoYXJDb2RlQXQoaSlcbiAgICBjaGsgPSBwb2x5bW9kU3RlcChjaGspIF4gKHYgJiAweDFmKVxuICB9XG4gIHJldHVybiBjaGtcbn1cblxuZnVuY3Rpb24gZW5jb2RlIChwcmVmaXgsIHdvcmRzLCBMSU1JVCkge1xuICBMSU1JVCA9IExJTUlUIHx8IDkwXG4gIGlmICgocHJlZml4Lmxlbmd0aCArIDcgKyB3b3Jkcy5sZW5ndGgpID4gTElNSVQpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4Y2VlZHMgbGVuZ3RoIGxpbWl0JylcblxuICBwcmVmaXggPSBwcmVmaXgudG9Mb3dlckNhc2UoKVxuXG4gIC8vIGRldGVybWluZSBjaGsgbW9kXG4gIHZhciBjaGsgPSBwcmVmaXhDaGsocHJlZml4KVxuICB2YXIgcmVzdWx0ID0gcHJlZml4ICsgJzEnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgd29yZHMubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgeCA9IHdvcmRzW2ldXG4gICAgaWYgKCh4ID4+IDUpICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ05vbiA1LWJpdCB3b3JkJylcblxuICAgIGNoayA9IHBvbHltb2RTdGVwKGNoaykgXiB4XG4gICAgcmVzdWx0ICs9IEFMUEhBQkVULmNoYXJBdCh4KVxuICB9XG5cbiAgZm9yIChpID0gMDsgaSA8IDY7ICsraSkge1xuICAgIGNoayA9IHBvbHltb2RTdGVwKGNoaylcbiAgfVxuICBjaGsgXj0gMVxuXG4gIGZvciAoaSA9IDA7IGkgPCA2OyArK2kpIHtcbiAgICB2YXIgdiA9IChjaGsgPj4gKCg1IC0gaSkgKiA1KSkgJiAweDFmXG4gICAgcmVzdWx0ICs9IEFMUEhBQkVULmNoYXJBdCh2KVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBkZWNvZGUgKHN0ciwgTElNSVQpIHtcbiAgTElNSVQgPSBMSU1JVCB8fCA5MFxuICBpZiAoc3RyLmxlbmd0aCA8IDgpIHRocm93IG5ldyBUeXBlRXJyb3Ioc3RyICsgJyB0b28gc2hvcnQnKVxuICBpZiAoc3RyLmxlbmd0aCA+IExJTUlUKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeGNlZWRzIGxlbmd0aCBsaW1pdCcpXG5cbiAgLy8gZG9uJ3QgYWxsb3cgbWl4ZWQgY2FzZVxuICB2YXIgbG93ZXJlZCA9IHN0ci50b0xvd2VyQ2FzZSgpXG4gIHZhciB1cHBlcmVkID0gc3RyLnRvVXBwZXJDYXNlKClcbiAgaWYgKHN0ciAhPT0gbG93ZXJlZCAmJiBzdHIgIT09IHVwcGVyZWQpIHRocm93IG5ldyBFcnJvcignTWl4ZWQtY2FzZSBzdHJpbmcgJyArIHN0cilcbiAgc3RyID0gbG93ZXJlZFxuXG4gIHZhciBzcGxpdCA9IHN0ci5sYXN0SW5kZXhPZignMScpXG4gIGlmIChzcGxpdCA9PT0gLTEpIHRocm93IG5ldyBFcnJvcignTm8gc2VwYXJhdG9yIGNoYXJhY3RlciBmb3IgJyArIHN0cilcbiAgaWYgKHNwbGl0ID09PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgcHJlZml4IGZvciAnICsgc3RyKVxuXG4gIHZhciBwcmVmaXggPSBzdHIuc2xpY2UoMCwgc3BsaXQpXG4gIHZhciB3b3JkQ2hhcnMgPSBzdHIuc2xpY2Uoc3BsaXQgKyAxKVxuICBpZiAod29yZENoYXJzLmxlbmd0aCA8IDYpIHRocm93IG5ldyBFcnJvcignRGF0YSB0b28gc2hvcnQnKVxuXG4gIHZhciBjaGsgPSBwcmVmaXhDaGsocHJlZml4KVxuICB2YXIgd29yZHMgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmRDaGFycy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBjID0gd29yZENoYXJzLmNoYXJBdChpKVxuICAgIHZhciB2ID0gQUxQSEFCRVRfTUFQW2NdXG4gICAgaWYgKHYgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGNoYXJhY3RlciAnICsgYylcbiAgICBjaGsgPSBwb2x5bW9kU3RlcChjaGspIF4gdlxuXG4gICAgLy8gbm90IGluIHRoZSBjaGVja3N1bT9cbiAgICBpZiAoaSArIDYgPj0gd29yZENoYXJzLmxlbmd0aCkgY29udGludWVcbiAgICB3b3Jkcy5wdXNoKHYpXG4gIH1cblxuICBpZiAoY2hrICE9PSAxKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2hlY2tzdW0gZm9yICcgKyBzdHIpXG4gIHJldHVybiB7IHByZWZpeDogcHJlZml4LCB3b3Jkczogd29yZHMgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0IChkYXRhLCBpbkJpdHMsIG91dEJpdHMsIHBhZCkge1xuICB2YXIgdmFsdWUgPSAwXG4gIHZhciBiaXRzID0gMFxuICB2YXIgbWF4ViA9ICgxIDw8IG91dEJpdHMpIC0gMVxuXG4gIHZhciByZXN1bHQgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyArK2kpIHtcbiAgICB2YWx1ZSA9ICh2YWx1ZSA8PCBpbkJpdHMpIHwgZGF0YVtpXVxuICAgIGJpdHMgKz0gaW5CaXRzXG5cbiAgICB3aGlsZSAoYml0cyA+PSBvdXRCaXRzKSB7XG4gICAgICBiaXRzIC09IG91dEJpdHNcbiAgICAgIHJlc3VsdC5wdXNoKCh2YWx1ZSA+PiBiaXRzKSAmIG1heFYpXG4gICAgfVxuICB9XG5cbiAgaWYgKHBhZCkge1xuICAgIGlmIChiaXRzID4gMCkge1xuICAgICAgcmVzdWx0LnB1c2goKHZhbHVlIDw8IChvdXRCaXRzIC0gYml0cykpICYgbWF4VilcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGJpdHMgPj0gaW5CaXRzKSB0aHJvdyBuZXcgRXJyb3IoJ0V4Y2VzcyBwYWRkaW5nJylcbiAgICBpZiAoKHZhbHVlIDw8IChvdXRCaXRzIC0gYml0cykpICYgbWF4VikgdGhyb3cgbmV3IEVycm9yKCdOb24temVybyBwYWRkaW5nJylcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gdG9Xb3JkcyAoYnl0ZXMpIHtcbiAgcmV0dXJuIGNvbnZlcnQoYnl0ZXMsIDgsIDUsIHRydWUpXG59XG5cbmZ1bmN0aW9uIGZyb21Xb3JkcyAod29yZHMpIHtcbiAgcmV0dXJuIGNvbnZlcnQod29yZHMsIDUsIDgsIGZhbHNlKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVjb2RlOiBkZWNvZGUsXG4gIGVuY29kZTogZW5jb2RlLFxuICB0b1dvcmRzOiB0b1dvcmRzLFxuICBmcm9tV29yZHM6IGZyb21Xb3Jkc1xufVxuIiwiJ3VzZSBzdHJpY3QnXG4vKiBnbG9iYWwgZmV0Y2gsIGJ0b2EsIEhlYWRlcnMgKi9cbmNvbnN0IGNvcmUgPSByZXF1aXJlKCcuL2NvcmUnKVxuXG5jbGFzcyBTdGF0dXNFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IgKHJlcywgLi4ucGFyYW1zKSB7XG4gICAgc3VwZXIoLi4ucGFyYW1zKVxuXG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBTdGF0dXNFcnJvcilcbiAgICB9XG5cbiAgICB0aGlzLm1lc3NhZ2UgPSBgSW5jb3JyZWN0IHN0YXR1c0NvZGU6ICR7cmVzLnN0YXR1c31gXG4gICAgdGhpcy5zdGF0dXNDb2RlID0gcmVzLnN0YXR1c1xuICAgIHRoaXMucmVzID0gcmVzXG4gICAgdGhpcy5yZXNwb25zZUJvZHkgPSByZXMuYXJyYXlCdWZmZXIoKVxuICB9XG59XG5cbmNvbnN0IG1rcmVxdWVzdCA9IChzdGF0dXNDb2RlcywgbWV0aG9kLCBlbmNvZGluZywgaGVhZGVycywgYmFzZXVybCkgPT4gYXN5bmMgKF91cmwsIGJvZHksIF9oZWFkZXJzID0ge30pID0+IHtcbiAgX3VybCA9IGJhc2V1cmwgKyAoX3VybCB8fCAnJylcbiAgbGV0IHBhcnNlZCA9IG5ldyBVUkwoX3VybClcblxuICBpZiAoIWhlYWRlcnMpIGhlYWRlcnMgPSB7fVxuICBpZiAocGFyc2VkLnVzZXJuYW1lKSB7XG4gICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcgKyBidG9hKHBhcnNlZC51c2VybmFtZSArICc6JyArIHBhcnNlZC5wYXNzd29yZClcbiAgICBwYXJzZWQgPSBuZXcgVVJMKHBhcnNlZC5wcm90b2NvbCArICcvLycgKyBwYXJzZWQuaG9zdCArIHBhcnNlZC5wYXRobmFtZSArIHBhcnNlZC5zZWFyY2gpXG4gIH1cbiAgaWYgKHBhcnNlZC5wcm90b2NvbCAhPT0gJ2h0dHBzOicgJiYgcGFyc2VkLnByb3RvY29sICE9PSAnaHR0cDonKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHByb3RvY29sLCAke3BhcnNlZC5wcm90b2NvbH1gKVxuICB9XG5cbiAgaWYgKGJvZHkpIHtcbiAgICBpZiAoYm9keSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8XG4gICAgICBBcnJheUJ1ZmZlci5pc1ZpZXcoYm9keSkgfHxcbiAgICAgIHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJ1xuICAgICkge1xuICAgICAgLy8gbm9vcFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGJvZHkgPT09ICdvYmplY3QnKSB7XG4gICAgICBib2R5ID0gSlNPTi5zdHJpbmdpZnkoYm9keSlcbiAgICAgIGhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBib2R5IHR5cGUuJylcbiAgICB9XG4gIH1cblxuICBfaGVhZGVycyA9IG5ldyBIZWFkZXJzKHsgLi4uKGhlYWRlcnMgfHwge30pLCAuLi5faGVhZGVycyB9KVxuXG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBmZXRjaChwYXJzZWQsIHsgbWV0aG9kLCBoZWFkZXJzOiBfaGVhZGVycywgYm9keSB9KVxuICByZXNwLnN0YXR1c0NvZGUgPSByZXNwLnN0YXR1c1xuXG4gIGlmICghc3RhdHVzQ29kZXMuaGFzKHJlc3Auc3RhdHVzKSkge1xuICAgIHRocm93IG5ldyBTdGF0dXNFcnJvcihyZXNwKVxuICB9XG5cbiAgaWYgKGVuY29kaW5nID09PSAnanNvbicpIHJldHVybiByZXNwLmpzb24oKVxuICBlbHNlIGlmIChlbmNvZGluZyA9PT0gJ2J1ZmZlcicpIHJldHVybiByZXNwLmFycmF5QnVmZmVyKClcbiAgZWxzZSBpZiAoZW5jb2RpbmcgPT09ICdzdHJpbmcnKSByZXR1cm4gcmVzcC50ZXh0KClcbiAgZWxzZSByZXR1cm4gcmVzcFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvcmUobWtyZXF1ZXN0KVxuIiwiJ3VzZSBzdHJpY3QnXG5jb25zdCBlbmNvZGluZ3MgPSBuZXcgU2V0KFsnanNvbicsICdidWZmZXInLCAnc3RyaW5nJ10pXG5cbm1vZHVsZS5leHBvcnRzID0gbWtyZXF1ZXN0ID0+ICguLi5hcmdzKSA9PiB7XG4gIGNvbnN0IHN0YXR1c0NvZGVzID0gbmV3IFNldCgpXG4gIGxldCBtZXRob2RcbiAgbGV0IGVuY29kaW5nXG4gIGxldCBoZWFkZXJzXG4gIGxldCBiYXNldXJsID0gJydcblxuICBhcmdzLmZvckVhY2goYXJnID0+IHtcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChhcmcudG9VcHBlckNhc2UoKSA9PT0gYXJnKSB7XG4gICAgICAgIGlmIChtZXRob2QpIHtcbiAgICAgICAgICBjb25zdCBtc2cgPSBgQ2FuJ3Qgc2V0IG1ldGhvZCB0byAke2FyZ30sIGFscmVhZHkgc2V0IHRvICR7bWV0aG9kfS5gXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtZXRob2QgPSBhcmdcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhcmcuc3RhcnRzV2l0aCgnaHR0cDonKSB8fCBhcmcuc3RhcnRzV2l0aCgnaHR0cHM6JykpIHtcbiAgICAgICAgYmFzZXVybCA9IGFyZ1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGVuY29kaW5ncy5oYXMoYXJnKSkge1xuICAgICAgICAgIGVuY29kaW5nID0gYXJnXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGVuY29kaW5nLCAke2FyZ31gKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgICAgc3RhdHVzQ29kZXMuYWRkKGFyZylcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAoaGVhZGVycykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBzZXQgaGVhZGVycyB0d2ljZS4nKVxuICAgICAgfVxuICAgICAgaGVhZGVycyA9IGFyZ1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdHlwZTogJHt0eXBlb2YgYXJnfWApXG4gICAgfVxuICB9KVxuXG4gIGlmICghbWV0aG9kKSBtZXRob2QgPSAnR0VUJ1xuICBpZiAoc3RhdHVzQ29kZXMuc2l6ZSA9PT0gMCkge1xuICAgIHN0YXR1c0NvZGVzLmFkZCgyMDApXG4gIH1cblxuICByZXR1cm4gbWtyZXF1ZXN0KHN0YXR1c0NvZGVzLCBtZXRob2QsIGVuY29kaW5nLCBoZWFkZXJzLCBiYXNldXJsKVxufVxuIiwiLyoqXG4gKiAgQHJlYWRvbmx5XG4gKiAgQGVudW0ge3N0cmluZ31cbiAqXHREZWZpbmUgc3RhbmRhcmQgY2hhaW4gaWRlbnRpZmllcnMgYXMgcGVyIHRoZSBCZWNoMzJQcmVmaXggZGVmaW5pdGlvblxuICpcdFNlZSBodHRwczovL2dpdGh1Yi5jb20vc2F0b3NoaWxhYnMvc2xpcHMvYmxvYi9tYXN0ZXIvc2xpcC0wMTczLm1kXG4gKi9cbnZhciBCZWNoMzJQcmVmaXggPSB7XG5cbiAgICAvKipcbiAgICAgKiBCZWNoMzJQcmVmaXggZm9yIEJUQyBtYWlubmV0XG4gICAgICovXG5cdEJUQ19NQUlOTkVUOiAnYmMnLFxuICAgIC8qKlxuICAgICAqIEJlY2gzMlByZWZpeCBmb3IgQlRDIHRlc3RuZXRcbiAgICAgKi9cblx0QlRDX1RFU1RORVQ6ICd0YicsXG4gICAgLyoqXG4gICAgICogQmVjaDMyUHJlZml4IGZvciBCVEMgcmVndGVzdFxuICAgICAqL1xuXHRCVENfUkVHVEVTVDogJ2JjcnQnXG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCZWNoMzJQcmVmaXhcbiIsIi8qKlxuICogQWJzdHJhY3REYW8gZGVzY3JpYmVzIHRoZSBEYW8gaW50ZXJmYWNlIGFuZCBpbXBsZW1lbnRzIGEgc2V0IG9mIG1ldGhvZHMgdGhhdCBzaG91bGQgYmVcbiAqIG92ZXJyaWRkZW4gYnkgY2xhc3NlcyBpbmhlcml0aW5nIGl0LlxuICpcbiAqIEBjbGFzc1xuICogQGFic3RyYWN0XG4gKi9cbmNsYXNzIEFic3RyYWN0RGFve1xuXG5cdC8qKlxuICAgICAqIEdlbmVyaWMgZGF0YSBhY2Nlc3Mgb2JqZWN0XG4gICAgICogQGhpZGVjb25zdHJ1Y3RvclxuICAgICAqXG5cdCAqIEBwYXJhbSB7QmVjaDMyUHJlZml4fSBjaGFpbiAtIEJlY2gzMlByZWZpeCB0aGF0IGlkZW50aWZpZXMgdGhlIGNoYWluIHRvIGFjY2Vzcy5cbiAgICAgKlxuXHQgKiBAcmV0dXJuIHtkYW99IC0gQW4gaW5zdGFuY2Ugb2YgdGhlIERhb1xuXHQgKi9cblx0Y29uc3RydWN0b3IoY2hhaW4pIHtcbiAgICBcdGlmIChuZXcudGFyZ2V0ID09PSBBYnN0cmFjdERhbykge1xuICAgICAgXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY29uc3RydWN0IEFic3RyYWN0RGFvIGluc3RhbmNlcyBkaXJlY3RseVwiKTtcbiAgICBcdH1cbiAgXHR9XG59XG5cbi8qKlxuICogQGFic3RyYWN0XG4gKiBAcGFyYW0ge051bWJlcn0gYmxvY2tfaGVpZ2h0IC0gVGhlIGJsb2NrIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIHJlY29yZGVkIGluXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IGJsb2NrX2luZGV4IC0gIFRoZSBwb3NpdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gaW4gdGhlIGJsb2NrXG4gKlxuICogQHJldHVybiB7dHh9IHR4IC0gVGhlIHRyYW5zYWN0aW9uXG4gKi9cbkFic3RyYWN0RGFvLnByb3RvdHlwZS5nZXRUeEJ5SW5kZXggPSAoYmxvY2tfaGVpZ2h0LGJsb2NrX2luZGV4KSA9PiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdub3QgaW1wbGVtZW50ZWQnKVxufVxuXG4vKipcbiAqIEBhYnN0cmFjdFxuICogQHBhcmFtIHtzdHJpbmd9IHR4aWQgLSBBIHRyYW5zYWN0aW9uIGlkIHJlZmVycmluZyB0byBhIHRhbnNhY3Rpb24gaW4gdGhlIGRhdGEgc3RvcmVcbiAqXG4gKiBAcmV0dXJuIHt7b2JqZWN0fX0gLSB0eCBUaGUgdHJhbnNhY3Rpb24gZGF0YVxuICovXG5BYnN0cmFjdERhby5wcm90b3R5cGUuZ2V0VHhpQnlJZCA9ICh0eGlkKSA9PiB7XG5cdHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkJylcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBYnN0cmFjdERhb1xuIiwiY29uc3QgYmVudCA9IHJlcXVpcmUoJ2JlbnQnKVxuY29uc3QgQmVjaDMyUHJlZml4ID0gcmVxdWlyZSgnLi4vYmVjaDMycHJlZml4JylcbmNvbnN0IEFic3RyYWN0RGFvID0gcmVxdWlyZSgnLi9hYnN0cmFjdERhbycpXG5cbi8qKlxuICogVGhpcyBjbGFzcyBoYW5kbGVzIERhdGEgQWNjZXNzIGZyb20gdGhlIGJsb2NrY3lwaGVyIEFQSVxuICovXG5jbGFzcyBCbG9ja2N5cGhlckRhbyBleHRlbmRzIEFic3RyYWN0RGFve1xuXG5cblx0c3RhdGljIFVSTF9CQVNFID0gJ2h0dHBzOi8vYXBpLmJsb2NrY3lwaGVyLmNvbS92MS9idGMnXG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgdGhlIEJsb2NrY3lwaGVyRGFvXG5cdCAqXG5cdCAqIEBwYXJhbSB7QmVjaDMyUHJlZml4fSBjaGFpbiAtIFRoZSBjaGFpbiBzaG91bGQgYmUgc2V0IHVzaW5nIG9uZSBvZiB0aGUgY2hhaW4gdmFyaWFibGVzXG5cdCAqL1xuXHRjb25zdHJ1Y3RvciggY2hhaW4gPSBCZWNoMzJQcmVmaXguQlRDX1RFU1RORVQgKXtcblx0XHRcblx0XHQvLyBDYWxsIHRoZSBBYnN0cmFjdERhbyBjb25zdHJ1Y3RvclxuXHRcdHN1cGVyKGNoYWluKVxuXG5cdFx0Ly8gVGVzdCBmb3IgdmFsaWQgY2hhaW5cblx0XHRpZiAoXG5cdFx0XHRjaGFpbiA9PT0gQmVjaDMyUHJlZml4LkJUQ19NQUlOTkVUIHx8XG5cdFx0XHRjaGFpbiA9PT0gQmVjaDMyUHJlZml4LkJUQ19URVNUTkVUXG5cdFx0KXtcblx0XHRcdHRoaXMuY2hhaW4gPSBjaGFpblxuXHRcdH1lbHNle1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGNoYWluOiAke2NoYWlufWApXG5cdFx0fVxuXHR9XG5cbn1cblxuLy8gV2l0aG91dCB0aGlzIHRoZSBzdXBlciBhdHRyaWJ1dGVzIGFyZSBub3QgYWNjZXNzYWJsZVxuT2JqZWN0LnNldFByb3RvdHlwZU9mKEJsb2NrY3lwaGVyRGFvLnByb3RvdHlwZSwgQWJzdHJhY3REYW8pXG5cbi8qKlxuICogUmV0dXJucyBhIHRyYW5zYWN0aW9uIG9iamVjdCB1c2luZyB0aGUgdHhpZFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eGlkIC0gVGhlIHRyYW5zYWN0aW9uIGlkIG9mIHRoZSB0cmFuc2FjdGlvbiB0byBiZSByZXR1cm5lZFxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gdHggLSBUaGUgdHJhbnNhY3Rpb24gd2l0aCB0aGUgZ2l2ZW4gdHJhbnNhY3Rpb25JZFxuICpcbiAqIEBvdmVycmlkZVxuICovXG5CbG9ja2N5cGhlckRhby5wcm90b3R5cGUuZ2V0VHhCeUlkID0gYXN5bmMgZnVuY3Rpb24odHhpZCl7XG5cblx0Ly9mb3JtYXQgdGhlIHVybCBjaGFpbiBpZGVudGlmaWVyXG5cdGNvbnN0IHVybENoYWluID0gZ2V0VXJsQ2hhaW4oIHRoaXMuY2hhaW4gKVxuICAgIC8vZm9ybWF0IHRoZSB1cmxcblx0Y29uc3QgdXJsID0gYCR7QmxvY2tjeXBoZXJEYW8uVVJMX0JBU0V9LyR7dXJsQ2hhaW59L3R4cy8ke3R4aWR9YFxuXHQvL3JldHVybiB0aGUganNvbiBkYXRhXG5cdGNvbnN0IGdldEpzb24gPSBiZW50KCdqc29uJylcblx0Y29uc3QgdHggPSBhd2FpdCBnZXRKc29uKHVybClcblx0cmV0dXJuIHR4XG5cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgdHJhbnNhY3Rpb24gb2JqZWN0IHVzaW5nIHRoZSBibG9jayBpbmRleFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBibG9ja19oZWlnaHQgLSBUaGUgYmxvY2sgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgcmVjb3JkZWQgaW5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gYmxvY2tfaW5kZXggLSBUaGUgcG9zaXRpb24gb2YgdGhlIHRyYW5zYWN0aW9uIGluIHRoZSBibG9ja1xuICpcbiAqIEByZXR1cm4ge09iamVjdH0gdHggLSBUaGUgdHJhbnNhY3Rpb24gYXQgdGhlIGdpdmVuIHBvc2l0aW9uXG4gKlxuICogQG92ZXJyaWRlXG4gKi9cbkJsb2NrY3lwaGVyRGFvLnByb3RvdHlwZS5nZXRUeEJ5SW5kZXggPSBhc3luYyBmdW5jdGlvbihibG9ja19oZWlnaHQsIGJsb2NrX2luZGV4KSB7XG5cbiAgICBjb25zdCB1cmxDaGFpbiA9IGdldFVybENoYWluKCB0aGlzLmNoYWluIClcbiAgICAvL2Zvcm1hdCB0aGUgdXJsXG5cdGNvbnN0IHVybCA9IGAke0Jsb2NrY3lwaGVyRGFvLlVSTF9CQVNFfS8ke3VybENoYWlufS9ibG9ja3MvJHtibG9ja19oZWlnaHR9P3R4c3RhcnQ9JHtibG9ja19pbmRleH0mbGltaXQ9MWBcbiAgICAvL3JldHVybiB0aGUganNvbiBkYXRhXG4gICAgY29uc3QgZ2V0SnNvbiA9IGJlbnQoJ2pzb24nKVxuICAgIGNvbnN0IGJsb2NrID0gYXdhaXQgZ2V0SnNvbih1cmwpXG4gICAgLy9yZXR1cm4gdGhlIHR4aWRcbiAgICByZXR1cm4gYmxvY2sudHhpZHNbMF1cblxufVxuXG5jb25zdCBnZXRVcmxDaGFpbiA9ICggY2hhaW4gKSA9PiAoY2hhaW4gPT09IEJlY2gzMlByZWZpeC5CVENfTUFJTk5FVCkgPyAnbWFpbicgOiAndGVzdDMnXG5cbm1vZHVsZS5leHBvcnRzID0gQmxvY2tjeXBoZXJEYW9cbiIsImNvbnN0IEJsb2NrY3lwaGVyRGFvID0gcmVxdWlyZSgnLi9ibG9ja2N5cGhlckRhbycpXG5jb25zdCBNb2NrRGFvID0gcmVxdWlyZSgnLi9tb2NrRGFvJylcblxuLyoqXG4gKiAgQHJlYWRvbmx5XG4gKiAgQGVudW0ge051bWJlcn1cbiAqICBEZWZpbmUgaWRlbnRpZmllcnMgZm9yIHRoZSBkaWZmZXJlbnQgc3VwcG9ydGVkIGRhbyB0eXBlc1xuICovXG52YXIgRGFvVHlwZSA9IHtcblxuICAgIC8qKiBJZGVudGlmaWVyIGZvciB0aGUgTW9ja0RhbyAqL1xuICAgIE1PQ0s6IDAsXG4gICAgLyoqIElkZW50aWZpZXIgZm9yIHRoZSBCbG9ja2N5cGhlckRhbyAqL1xuICAgIEJMT0NLQ1lQSEVSOiAxLFxuXG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBmYWN0b3J5IHBhdHRlcm4gdG8gcmV0dXJuIGFuIGluc3RhbmNlIG9mIGEgZGFvXG4gKi9cbmNsYXNzIERhb0ZhY3Rvcnl7XG5cbn1cblxuLyoqXG4gKlx0Q3JldGFlIGFuIGluc3RhbmNlIG9mIGEgZGFvIGFuZCByZXR1cm4gaXRcbiAqXG4gKlx0QHBhcmFtIHtEYW9UeXBlfSBwcm92aWRlciAtIFRoZSBwcm92aWRlciBhcyBkZWZpbmVkIGluIHRoZSBzdGF0aWMgdmFyaWFibGVzIG9mIHRoaXMgY2xhc3NcbiAqXG4gKlx0QHBhcmFtIHtCZWNoMzJQcmVmaXh9IGNoYWluIC0gVGhlIEJlY2gzMiByZWdpc3RlcmVkIHByZWZpeCB1c2VkIHRvIGlkZW50aWZ5IHRoZSBjaGFpblxuICpcbiAqXHRAcmV0dXJuIHtBYnN0cmFjdERhb30gZGFvIC0gQW4gaW5zdGFuY2Ugb2YgYSBjbGFzcyBleHRlbmRpbmcgdGhlIEFic3RyYWN0RGFvIHN1YnR5cGVcbiAqL1xuRGFvRmFjdG9yeS5nZXQgPSAoKHByb3ZpZGVyLCBjaGFpbikgPT4ge1xuXHRcdFxuXHRpZihwcm92aWRlciA9PT0gRGFvVHlwZS5NT0NLKXtcblx0XHRyZXR1cm4gbmV3IE1vY2tEYW8oY2hhaW4pXG5cdH1lbHNlIGlmIChwcm92aWRlciA9PT0gRGFvVHlwZS5CTE9DS0NZUEhFUil7XG5cdFx0cmV0dXJuIG5ldyBCbG9ja2N5cGhlckRhbyhjaGFpbilcblx0fWVsc2V7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdEYW8gbm90IHJlY29nbmlzZWQnKVxuXHR9XG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgRGFvVHlwZSwgRGFvRmFjdG9yeSB9XG4iLCJjb25zdCBCZWNoMzJQcmVmaXggPSByZXF1aXJlKCcuLi9iZWNoMzJwcmVmaXgnKVxuY29uc3QgQWJzdHJhY3REYW8gPSByZXF1aXJlKCcuL2Fic3RyYWN0RGFvJylcbmNvbnN0IGRhdGEgPSByZXF1aXJlKCcuLi8uLi90ZXN0L2RhdGEnKVxuXG4vKipcbiAqIERhbyBmb3IgYWNjZXNzaW5nIHRlc3QgZGF0YS5cbiAqL1xuY2xhc3MgTW9ja0RhbyBleHRlbmRzIEFic3RyYWN0RGFvIHtcblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIE1vY2tEYW8gSW5zdGFuY2Vcblx0ICpcblx0ICogQHBhcmFtIHtCZWNoMzJQcmVmaXh9IGNoYWluIC0gQmVjaDMyUHJlZml4IGRlc2NyaWJpbmcgdGhlIGNoYWluIHRvIGFjY2Vzc1xuICAgICAqXG4gICAgICogQHJldHVybnMge01vY2tEYW99IGRhbyAtIEFuIGluc3RhbmNlIG9mIHRoZSBkYW9cblx0ICovXG5cdGNvbnN0cnVjdG9yKCBjaGFpbiA9IEJlY2gzMlByZWZpeC5CVENfVEVTVE5FVCApe1xuXHRcdFxuXHRcdC8vSW5pdGlhbGlzZSB0aGUgcGFyZW50IG9iamVjdCBcblx0XHRzdXBlciggY2hhaW4gKVxuXHRcdHRoaXMuY2hhaW4gPSBjaGFpblxuXHR9XG5cbn1cblxuT2JqZWN0LnNldFByb3RvdHlwZU9mKE1vY2tEYW8ucHJvdG90eXBlLCBBYnN0cmFjdERhbylcblxuLyoqXG4gKiBSZXR1cm5zIGEgdHJhbnNhY3Rpb24gb2JqZWN0IHVzaW5nIHRoZSB0eGlkXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR4aWQgLSBUaGUgdHJhbnNhY3Rpb24gaWQgb2YgdGhlIHRyYW5zYWN0aW9uIHRvIGJlIHJldHVybmVkXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSB0eCAtIFRoZSB0cmFuc2FjdGlvbiB3aXRoIHRoZSBnaXZlbiB0cmFuc2FjdGlvbklkXG4gKlxuICogQG92ZXJyaWRlXG4gKi9cbk1vY2tEYW8ucHJvdG90eXBlLmdldFR4QnlJZCA9IGFzeW5jICh0eGlkKSA9PiB7XG5cblx0Y29uc3QgdHggPSBhd2FpdCBkYXRhLmZpbmQoIHR4ID0+IHR4LnR4aWQgPT09IHR4aWQgKVxuXHQvLyB0cmFuc2Zvcm0gdGhlIGRhdGEgdG8gbWF0Y2ggZ2VuZXJpYyB0cmFuc2FjdGlvbiBmb3JtYXRcblx0cmV0dXJuIHBhcnNlKHR4KVxuXG59XG5cbi8qKlxuICogUmV0dXJucyBhIHRyYW5zYWN0aW9uIG9iamVjdCB1c2luZyB0aGUgYmxvY2sgaW5kZXhcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gYmxvY2tfaGVpZ2h0IC0gVGhlIGJsb2NrIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIHJlY29yZGVkIGluXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IGJsb2NrX2luZGV4IC0gVGhlIHBvc2l0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBpbiB0aGUgYmxvY2tcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IHR4IC0gVGhlIHRyYW5zYWN0aW9uIGF0IHRoZSBnaXZlbiBwb3NpdGlvblxuICpcbiAqIEBvdmVycmlkZVxuICovXG5Nb2NrRGFvLnByb3RvdHlwZS5nZXRUeEJ5SW5kZXggPSBhc3luYyAoYmxvY2tfaGVpZ2h0LCBibG9ja19pbmRleCkgPT4ge1xuXG5cdGNvbnN0IHR4ID0gYXdhaXQgZGF0YS5maW5kKCB0eCA9PiB0eC5ibG9ja19oZWlnaHQgPT09IGJsb2NrX2hlaWdodCAmJiB0eC5ibG9ja19pbmRleCA9PT0gYmxvY2tfaW5kZXggKVxuXHRyZXR1cm4gdHhcbn1cblxucGFyc2UgPSAodHgpID0+IHtcblx0cmV0dXJuIHR4XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW9ja0Rhb1xuIiwiY29uc3QgVHhyZWYgPSByZXF1aXJlKCcuL3R4cmVmJylcbmNvbnN0IEJlY2gzMlByZWZpeCA9IHJlcXVpcmUoJy4vYmVjaDMycHJlZml4JylcbmNvbnN0IHsgRGFvVHlwZSwgRGFvRmFjdG9yeSB9ID0gcmVxdWlyZSgnLi9kYW8vZGFvRmFjdG9yeScpXG5cbmNvbnN0IFBST1ZJREVSID0gRGFvVHlwZS5CTE9DS0NZUEhFUlxuXG5jb25zdCB0eHJlZkRlY29kZSA9ICh0eHJlZikgPT4ge1xuICAgIHJldHVybiBUeHJlZi5kZWNvZGUodHhyZWYpXG59XG5cbmNvbnN0IHR4cmVmRW5jb2RlID0gKGNoYWluLCBibG9ja0hlaWdodCwgdHhQb3MsIHV0eG9JbmRleCkgPT4ge1xuICAgIHJldHVybiBUeHJlZi5lbmNvZGUoY2hhaW4sIGJsb2NrSGVpZ2h0LCB0eHBvcywgdXR4b0luZGV4KSBcbn1cblxuY29uc3QgZ2V0VHhEZXRhaWxzID0gYXN5bmMgKHR4aWQsIGNoYWluLCB1dHhvSW5kZXgpID0+IHtcblxuICAgIGNvbnN0IGRhbyA9IERhb0ZhY3RvcnkoUFJPVklERVIsIGNoYWluKVxuICAgIGNvbnN0IHR4ID0gYXdhaXQgZGFvLmdldFR4QnlJZCh0eGlkKVxuXG4gICAgcmV0dXJuIHR4XG5cbn1cblxuY29uc3QgdHhpZFRvVHhyZWYgPSBhc3luYyAodHhpZCwgY2hhaW4sIHV0eG9JbmRleCkgPT4ge1xuXG4gICAgY29uc3QgdHggPSB0eERldGFpbHNGcm9tVHhpZCh0eGlkLCBjaGFpbiwgdXR4b0luZGV4KVxuICAgIGNvbnN0IHR4cmVmID0gVHhyZWYuZW5jb2RlKGNoYWluLCB0eC5ibG9ja19oZWlnaHQsIHR4LmJsb2NrX2luZGV4LCB1dHhvSW5kZXgpXG5cbiAgICByZXR1cm4gdHhyZWZcblxufVxuXG5jb25zdCB0eHJlZlRvVHhpZCA9ICh0eHJlZikgPT4ge1xuXG4gICAgY29uc3QgdHggPSB0eERldGFpbHNGcm9tVHhyZWYodHhyZWYpXG5cbiAgICByZXR1cm4gdHgudHhpZFxufVxuXG5jb25zdCB0eERldGFpbHNGcm9tVHhpZCA9IGFzeW5jICh0eGlkLCBjaGFpbiwgdXR4b0luZGV4KSA9PiB7XG5cbiAgICBjb25zdCBkYW8gPSBEYW9GYWN0b3J5KFBST1ZJREVSLCBjaGFpbilcbiAgICBjb25zdCB0eCA9IGF3YWl0IGRhby5nZXRUeEJ5SWQodHhpZClcblxuICAgIHJldHVybiB0eFxufVxuXG5jb25zdCB0eERldGFpbHNGcm9tVHhyZWYgPSAodHhyZWYpID0+IHtcblxuICAgIGNvbnN0IHR4ZGF0YSA9IFR4cmVmLmRlY29kZSh0eHJlZilcbiAgICBjb25zdCBkYW8gPSBEYW9GYWN0b3J5KFBST1ZJREVSLCB0eGRhdGEuY2hhaW4pXG4gICAgY29uc3QgdHggPSBkYW8uZ2V0VHhCeUJsb2NrKHR4ZGF0YS5ibG9ja19oZWlnaHQsIHR4ZGF0YS5ibG9ja19pbmRleClcblxuICAgIHJldHVybiB0eFxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB0eHJlZkRlY29kZTogdHhyZWZEZWNvZGUsXG4gIHR4cmVmRW5jb2RlOiB0eHJlZkVuY29kZSxcbiAgdHhpZFRvVHhyZWY6IHR4aWRUb1R4cmVmLFxuICB0eHJlZlRvVHhpZDogdHhyZWZUb1R4aWQsXG4gIGdldFR4RGV0YWlsczogZ2V0VHhEZXRhaWxzLFxuICB0eERldGFpbHNGcm9tVHhpZDogdHhEZXRhaWxzRnJvbVR4aWQsXG4gIHR4RGV0YWlsc0Zyb21UeHJlZjogdHhEZXRhaWxzRnJvbVR4cmVmLFxuICBNQUdJQ19CVENfTUFJTk5FVDogVHhyZWYuVFlQRV9NQUlOTkVULFxuICBNQUdJQ19CVENfVEVTVE5FVDogVHhyZWYuVFlQRV9URVNUTkVULFxuICBUWFJFRl9CRUNIMzJfSFJQX01BSU5ORVQ6IEJlY2gzMlByZWZpeC5CVENfTUFJTk5FVCxcbiAgVFhSRUZfQkVDSDMyX0hSUF9URVNUTkVUOiBCZWNoMzJQcmVmaXguQlRDX1RFU1RORVQsXG4gIENIQUlOX01BSU5ORVQ6IEJlY2gzMlByZWZpeC5CVENfTUFJTk5FVCxcbiAgQ0hBSU5fVEVTVE5FVDogQmVjaDMyUHJlZml4LkJUQ19URVNUTkVUXG59O1xuIiwiY29uc3QgQmVjaDMyID0gcmVxdWlyZSgnYmVjaDMyJylcbmNvbnN0IEJlY2gzMlByZWZpeCA9IHJlcXVpcmUoJy4vYmVjaDMycHJlZml4JylcblxuXG4vKipcbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgZnVuY3Rpb25zIGZvciBUeHJlZnMuICBUaGVyZSBpc24ndCBhbnkgbmVlZCB0b1xuICogY3JlYXRlYW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBzbyBvbmx5IHN0YXRpYyBtZXRob2RzIGFyZSBwcm92aWRlZC5cbiAqXG4gKiBAY2xhc3NcbiAqL1xuY2xhc3MgVHhyZWZ7XG5cblx0LyoqXG5cdCAqIEh1bWFuIHJlYWRhYmxlIHBhcnQgb2YgYmVjaDMyIGRhdGEgdG8gc2lnbmlmeVxuXHQgKiB0aGUgYml0Y29pbiBtYWlubmV0IGNoYWluXG5cdCAqL1xuXHQvL3N0YXRpYyBCRUNIMzJfSFJQX01BSU5ORVQgPSAndHgnXG5cdHN0YXRpYyBCRUNIMzJfSFJQX01BSU5ORVQgPSBCZWNoMzJQcmVmaXguQlRDX01BSU5ORVRcblx0LyoqXG5cdCAqIEh1bWFuIHJlYWRhYmxlIHBhcnQgb2YgYmVjaDMyIGRhdGEgdG8gc2lnbmlmeVxuXHQgKiB0aGUgYml0Y29pbiB0ZXN0bmV0IGNoYWluXG5cdCAqL1xuXHQvL3N0YXRpYyBCRUNIMzJfSFJQX1RFU1RORVQgPSAndHh0ZXN0J1xuXHRzdGF0aWMgQkVDSDMyX0hSUF9URVNUTkVUID0gQmVjaDMyUHJlZml4LkJUQ19URVNUTkVUXG5cdC8qKlxuXHQgKiBUaGUgaW5pdGlhbCBieXRlIG9mIHRoZSBiZWNoMzIgZGF0YSB0byBzaWduaWZ5XG5cdCAqIHRoZSBiaXRjb2luIG1haW5uZXQgY2hhaW5cblx0ICovXG5cdHN0YXRpYyBUWVBFX01BSU5ORVQgPSAweDAzXG5cdC8qKlxuXHQgKiBUaGUgaW5pdGlhbCBieXRlIG9mIHRoZSBiZWNoMzIgZGF0YSB0byBzaWduaWZ5XG5cdCAqIHRoZSBiaXRjb2luIG1haW5uZXQgY2hhaW4gd2l0aCB1dHhvSW5kZXggZGF0YVxuXHQgKi9cblx0c3RhdGljIFRZUEVfTUFJTk5FVF9FWFQgPSAweDA0XG5cdC8qKlxuXHQgKiBUaGUgaW5pdGlhbCBieXRlIG9mIHRoZSBiZWNoMzIgZGF0YSB0byBzaWduaWZ5XG5cdCAqIHRoZSBiaXRjb2luIHRlc3RuZXQgY2hhaW5cblx0ICovXG5cdHN0YXRpYyBUWVBFX1RFU1RORVQgPSAweDA2XG5cdC8qKlxuXHQgKiBUaGUgaW5pdGlhbCBieXRlIG9mIHRoZSBiZWNoMzIgZGF0YSB0byBzaWduaWZ5XG5cdCAqIHRoZSBiaXRjb2luIHRlc3RuZXQgY2hhaW4gd2l0aCB1dHhvSW5kZXggZGF0YVxuXHQgKi9cblx0c3RhdGljIFRZUEVfVEVTVE5FVF9FWFQ9MHgwN1xuXG4gICAgLyoqXG4gICAgICogQGhpZGVjb25zdHJ1Y3RvclxuICAgICAqL1xuXG5cdC8qKlxuXHQgKiBFbmNvZGUgdHJhbnNhY3Rpb24gbG9jYXRpb24gZGF0YSBpbnRvIGEgdHhyZWZcblx0ICogXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBjaGFpbiAtIGNoYWluIFRoZSBuYW1lIG9mIHRoZSBidGMgY2hhaW4gbWFpbm5ldCBvciB0ZXN0bmV0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gYmxvY2tIZWlnaHQgLSBUaGUgYmxvY2sgaW4gd2hpY2ggdGhlIHRyYW5zYWN0aW9uIGlzIGZvdW5kXG4gICAgICpcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGJsb2NrSW5kZXggLSBUaGUgcG9zaXRpb24gaW4gdGhlIGJsb2NrIHdoZXJlIHRoZSB0cmFuc2FjdGlvbiBpcyBmb3VuZFxuICAgICAqXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSB1dHhvSW5kZXggLSBUaGUgcG9zaXRpb24gb2YgdGhlIHV0eG8gaW4gdGhlIHRyYW5zYWN0aW9uIGlucHV0XG5cdCAqXG5cdCAqIEByZXR1cm5zIHtzdHJpbmd9IHR4cmVmIC0gVGhlIEJlY2gzMiB0eHJlZlxuXHQgKi9cblx0c3RhdGljIGVuY29kZShjaGFpbiwgYmxvY2tIZWlnaHQsIGJsb2NrSW5kZXgsIHV0eG9JbmRleCl7XG5cdFx0XG5cdFx0Ly9jaGVjayBmb3IgdmFsaWQgY2hhaW5cblx0XHRpZiAoY2hhaW4gIT09IEJlY2gzMlByZWZpeC5CVENfTUFJTk5FVCAmJiBjaGFpbiAhPT0gQmVjaDMyUHJlZml4LkJUQ19URVNUTkVUKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNoYWluJylcblxuXHRcdC8vY2hlY2sgZm9yIHZhbGlkIGJsb2NrSGVpZ2h0XG5cdFx0aWYgKGJsb2NrSGVpZ2h0ID4gMHhGRkZGRkYpXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYmxvY2sgaGVpZ2h0JylcblxuXHRcdC8vY2hlY2sgZm9yIHZhbGlkIGJsb2NrSW5kZXhcblx0XHRpZiAoYmxvY2tJbmRleCA+IDB4RkZGRkZGKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJsb2NrIGluZGV4JylcblxuXHRcdC8vZW5jb2RlIHRoZSB0eHJlZlxuXHRcdGNvbnN0IGJUeHJlZiA9IFR4cmVmLmJpbmFyeUVuY29kZShjaGFpbixibG9ja0hlaWdodCxibG9ja0luZGV4LHV0eG9JbmRleClcblx0XHQvL2NvbnZlcnQgdGhlIGJpbmFyeSBkYXRhIHRvIGEgZm9ybWF0dGVkIHR4cmVmXG5cdFx0Y29uc3QgdHhyZWYgPSBUeHJlZi5iaW5hcnlUb1N0cmluZyhiVHhyZWYpXG5cblx0XHRyZXR1cm4gdHhyZWZcblx0fVxuXG5cblx0LyoqXG5cdCAqIFRoZSB0eHJlZiBpcyBiaW5hcnkgZGF0YSBlbmNvZGVkIG92ZXIgYSBzZXQgbnVtYmVyIG9mIGJ5dGVzLCBkZXRlcm1pbmVkXG5cdCAqIGJ5IHdoZXRoZXIgYSB1dHhvSW5kZXggaXMgc3VwcGxpZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBjaGFpbiAtIGNoYWluIFRoZSBuYW1lIG9mIHRoZSBidGMgY2hhaW4gbWFpbm5ldCBvciB0ZXN0bmV0XG4gICAgICpcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGJsb2NrX2hlaWdodCAtIFRoZSBibG9jayBpbiB3aGljaCB0aGUgdHJhbnNhY3Rpb24gaXMgZm91bmRcbiAgICAgKlxuXHQgKiBAcGFyYW0ge051bWJlcn0gYmxvY2tfaW5kZXggLSBUaGUgcG9zaXRpb24gaW4gdGhlIGJsb2NrIHdoZXJlIHRoZSB0cmFuc2FjdGlvbiBpcyBmb3VuZFxuICAgICAqXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSB1dHhvX2luZGV4IC0gVGhlIHBvc2l0aW9uIG9mIHRoZSB1dHhvIGluIHRoZSB0cmFuc2FjdGlvbiBpbnB1dFxuXHQgKlxuXHQgKiBAcmV0dXJuIHtiaW5hcnl9IHR4cmVmXG5cdCAqIFx0QSBiaW5hcnkgZW5jb2RlZCB0eHJlZlxuXHQgKi9cblx0Ly8gV2l0aCBhIHV0eG9JbmRleCB0aGUgZGF0YSBpcyAxMiBieXRlcyBsb25nLCB3aXRob3V0IGl0IGlzIDlcblx0Ly8gQnl0ZXMgMCAgIDogSWRlbnRpZmllcyB3aGV0aGVyIHRoZSB0eHJlZiBpcyBmb3IgbWFpbm5ldHx0ZXN0bmV0IGFuZFxuXHQvLyAgICAgICAgICAgICB3aGV0aGVyIGl0IGluY2x1ZGVzIGEgdXR4b1JlZlxuXHQvLyBCeXRlcyAxLTUgOiBFbmNvZGVzIHRoZSBibG9ja2hlaWdodFxuXHQvLyBCeXRlcyA2LTggOiBFbmNvZGVzIHRoZSBibG9ja0luZGV4XG5cdC8vIEJ5dGVzIDktMTE6IEVuY29kZXMgdGhlIHV0eG9JbmRleFxuXHRzdGF0aWMgYmluYXJ5RW5jb2RlKGNoYWluLCBibG9ja19oZWlnaHQsIGJsb2NrX2luZGV4LCB1dHhvX2luZGV4KXtcblxuXHRcdGxldCB0eXBlLHdvcmRzXG5cblx0XHQvL1NldCB0aGUgdHhyZWYgdHlwZSBhbmQgaW5pdGlhbGlzZSBiaW5hcnkgZGF0YS4gIFRoaXMgaXMgcmV0dXJuZWQgYXMgKndvcmRzKiBmb3IgdGhlXG5cdFx0Ly9iZWNrMzIgbGlicmFyeSBzbyB3ZSBkZWZpbmUgaXQgaGVyZSB0byBrZWVwIGl0IGNvbnNpc3RlbnRcblx0XHRpZih1dHhvX2luZGV4ICE9PSB1bmRlZmluZWQpe1xuXHRcdFx0dHlwZSA9IChjaGFpbiA9PT0gQmVjaDMyUHJlZml4LkJUQ19NQUlOTkVUKSA/IFR4cmVmLlRZUEVfTUFJTk5FVF9FWFQgOiBUeHJlZi5UWVBFX1RFU1RORVRfRVhUXG5cdFx0XHR3b3JkcyA9IFsweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwXVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0eXBlID0gKGNoYWluID09PSBCZWNoMzJQcmVmaXguQlRDX01BSU5ORVQpID8gVHhyZWYuVFlQRV9NQUlOTkVUIDogVHhyZWYuVFlQRV9URVNUTkVUXG5cdFx0XHR3b3JkcyA9IFsweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwXVxuXHRcdH1cblxuXG5cdFx0Ly9zZXQgdGhlIHR5cGUgYml0IGluIHRoZSBkYXRhXG5cdFx0d29yZHNbMF0gPSB0eXBlXG5cblx0XHQvL2VuY29kZSB0aGUgYmxvY2tIZWlnaHRcblx0XHR3b3Jkc1sxXSB8PSAoKGJsb2NrX2hlaWdodCAmIDB4RikgPDwgMSk7XG5cdFx0d29yZHNbMl0gfD0gKChibG9ja19oZWlnaHQgJiAweDFGMCkgPj4gNCk7XG5cdFx0d29yZHNbM10gfD0gKChibG9ja19oZWlnaHQgJiAweDNFMDApID4+IDkpO1xuXHRcdHdvcmRzWzRdIHw9ICgoYmxvY2tfaGVpZ2h0ICYgMHg3QzAwMCkgPj4gMTQpO1xuXHRcdHdvcmRzWzVdIHw9ICgoYmxvY2tfaGVpZ2h0ICYgMHhGODAwMDApID4+IDE5KTtcblxuXHRcdC8vZW5jb2RlIHRoZSBibG9ja0luZGV4XG5cdFx0d29yZHNbNl0gfD0gKGJsb2NrX2luZGV4ICYgMHgxRik7XG5cdFx0d29yZHNbN10gfD0gKChibG9ja19pbmRleCAmIDB4M0UwKSA+PiA1KTtcbiAgXHRcdHdvcmRzWzhdIHw9ICgoYmxvY2tfaW5kZXggJiAweDdDMDApID4+IDEwKTtcblxuXHRcdC8vZW5jb2RlIHRoZSB1dHhvSW5kZXhcblx0XHRpZih1dHhvX2luZGV4ICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0d29yZHNbOV0gIHw9ICAodXR4b19pbmRleCAmIDB4MUYpO1xuICAgIFx0XHR3b3Jkc1sxMF0gfD0gKCh1dHhvX2luZGV4ICYgMHgzRTApID4+IDUpO1xuICAgIFx0XHR3b3Jkc1sxMV0gfD0gKCh1dHhvX2luZGV4ICYgMHg3QzAwKSA+PiAxMCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHdvcmRzXG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydCBiaW5hcnkgdHhyZWYgdG8gYSBiZWNoMzIgZm9ybWF0dGVkIHN0cmluZyB3aXRoXG5cdCAqIGRlbGltaXRlcnMgdG8gbWFrZSBpdCBtb3JlIGh1bWFuIHJlYWRhYmxlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge2JpbmFyeX0gd29yZHMgLSBUaGUgYmluYXJ5IGVuY29kZWQgYmVjaDMyIHR4cmVmLlxuICAgICAqXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gdHhyZWYgLSBUaGUgdHhyZWYgaW4gaHVtYW4gcmVhZGFibGUgZm9ybVxuXHQgKi9cblx0Ly8gVGhlIG5hbWUgJ3dvcmRzJyBpcyB1c2VkIHRocm91Z2hvdXQgaW4ga2VlcGluZyB3aXRoIHRoZSBCZWNoMzJcblx0Ly8gbmFtaW5nIGluIG9iamVjdCByZXR1cm5lZCBmcm9tIHRoZSBCZWNoMzIgbGlicmFyeTpcblx0Ly9cdGB7IHByZWZpeDogeHgsIHdvcmRzOiB4eHh4eHh4IH1gXG5cdHN0YXRpYyBiaW5hcnlUb1N0cmluZyh3b3Jkcyl7XG5cblx0XHQvL2RldGVybWluZSB0aGUgY2hhaW4gZnJvbSB0aGUgZmlyc3QgJ3dvcmRzJyBieXRlIGFuZCBzZXQgXG5cdFx0Ly90aGUgJ3ByZWZpeCcgd2hpY2ggaXMgdGhlIGh1bWFuIHJlYWRhYmxlIHBhcnRcblx0XHRjb25zdCBwcmVmaXggPSAod29yZHNbMF0gPT09IFR4cmVmLlRZUEVfTUFJTk5FVCB8fCB3b3Jkc1swXSA9PT0gVHhyZWYuVFlQRV9NQUlOTkVUX0VYVCkgP1xuXHRcdFx0VHhyZWYuQkVDSDMyX0hSUF9NQUlOTkVUIDogVHhyZWYuQkVDSDMyX0hSUF9URVNUTkVUXG5cdFx0XG5cdFx0Ly9lbmNvZGUgdGhlIGh1bWFuIHJlYWRhYmxlIHBhcnQgYW5kIGRhdGEgYXMgYmVjaDMyXG5cdFx0Y29uc3QgYmVjaDMyZW5jb2RlZCA9IEJlY2gzMi5lbmNvZGUocHJlZml4LCB3b3JkcylcblxuXHRcdC8vYWRkIGRlbGltaXRlcnMgdG8gdGhlIGJlY2gzMmVuY29kZWQgc3RyaW5nXG5cdFx0Y29uc3Qgc3BsaXRJbmRleCA9IDRcblx0XHRjb25zdCBkZWxpbWl0ZXIgPSAnLSdcblx0XHRcblx0XHQvL0luaXRpYWxpc2UgdGhlIHR4cmVmXG5cdFx0Y29uc3Qgd29yZHNTdGFydCA9IHByZWZpeC5sZW5ndGggKyAxXG5cdFx0bGV0IHR4cmVmID0gYmVjaDMyZW5jb2RlZC5zdWJzdHJpbmcoMCwgd29yZHNTdGFydCkgKyAnOidcblx0XHRcdCsgYmVjaDMyZW5jb2RlZC5zdWJzdHJpbmcod29yZHNTdGFydCwgd29yZHNTdGFydCArIHNwbGl0SW5kZXgpXG5cdFx0XG5cdFx0Ly9BZGQgdG8gdHhyZWYgcmVtYWluaW5nIGRhdGEgd2l0aCBkZWxpbWl0ZXJcblx0XHQvL0luaXRpYWxpc2Ugd2l0aCB3b3Jkc1N0YXJ0ICsgc3BsaXRJbmRleCBhcyB3ZSd2ZSBhbHJlYWR5IGFkZGVkIHRoZSBodW1hblxuXHRcdC8vcmVhZGFibGUgcGFydCAocHJlZml4KSBhbmQgdGhlIGZpcnN0IHBhcnQgb2YgdGhlIGRhdGEgaW4gdGhlIHN0ZXAgYWJvdmVcblx0XHRmb3IodmFyIGkgPSB3b3Jkc1N0YXJ0ICsgc3BsaXRJbmRleDsgaSA8IGJlY2gzMmVuY29kZWQubGVuZ3RoICsgMTsgaSArPSBzcGxpdEluZGV4KXtcblx0XHRcdHR4cmVmICs9IGRlbGltaXRlciArIGJlY2gzMmVuY29kZWQuc3Vic3RyaW5nKGksIGkgKyBzcGxpdEluZGV4KVxuXHRcdH1cblxuXHRcdHJldHVybiB0eHJlZlxuXHR9XG5cblxuXHQvKipcblx0ICogQ29udmVydCBhIHR4cmVmIHRvIHR0cmFuc2FjdGlvbiBkYXRhXG5cdCAqXG5cdCAqIEBwYXJhbSB7VHhyZWZ9IHR4cmVmIC0gVGhlIHR4cmVmIGVuY29kaW5nIHRoZSB0cmFuc2FjdGlvbiBwb3NpdGlvblxuXHQgKlxuXHQgKiBAcmV0dXJuIHt7Y2hhaW4sIGJsb2NrSGVpZ2h0LCBibG9ja0luZGV4LCB1dHhvSW5kZXh9fSB0eCAtIFRoZSB0cmFuc2FjdGlvbiBkYXRhIGVuY29kZWQgaW4gdGhlIHR4cmVmXG5cdCAqL1xuXHRzdGF0aWMgZGVjb2RlKHR4cmVmKXtcblxuXHRcdGxldCBjaGFpbiwgYmxvY2tfaGVpZ2h0LCBibG9ja19pbmRleCwgdXR4b19pbmRleFxuXG5cdFx0Ly9jaGVjayBmb3IgdmFsaWQgdHhyZWZcbi8vXHRcdGlmICghIHR4cmVmLm1hdGNoKC9edHgodGVzdCk/MTpbYS16MC05XXs0fSgtW2EtejAtOV17NH0pezJ9L2cpKXtcbi8vXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHR4cmVmJylcbi8vXHRcdH1cblxuXHRcdGlmICghIHR4cmVmLm1hdGNoKC9eKGJjfHRiKT8xOlthLXowLTldezR9KC1bYS16MC05XXs0fSl7Mn0vZykpe1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHR4cmVmJylcblx0XHR9XG5cblx0XHQvL3N0cmlwIHRoZSBkZWxpbWl0ZXIgZm9ybWF0dGluZ1xuXHRcdGNvbnN0IHVuZm9ybWF0dGVkVHhyZWYgPSB0eHJlZi5yZXBsYWNlKC9bLTpdL2csICcnKVxuXG5cdFx0Ly9jb252ZXJ0IHRoZSBzdHJpbmcgdG8gYmluYXJ5IGRhdGFcblx0XHRjb25zdCBiVHhyZWYgPSBCZWNoMzIuZGVjb2RlKHVuZm9ybWF0dGVkVHhyZWYpXG5cblx0XHQvL2RlY29kZSB0aGUgYmxvY2tIZWlnaHRcblx0XHRibG9ja19oZWlnaHQgPSAoYlR4cmVmLndvcmRzWzFdID4+IDEpXG5cdFx0YmxvY2tfaGVpZ2h0IHw9IChiVHhyZWYud29yZHNbMl0gPDwgNClcblx0XHRibG9ja19oZWlnaHQgfD0gKGJUeHJlZi53b3Jkc1szXSA8PCA5KVxuXHRcdGJsb2NrX2hlaWdodCB8PSAoYlR4cmVmLndvcmRzWzRdIDw8IDE0KVxuXHRcdGJsb2NrX2hlaWdodCB8PSAoYlR4cmVmLndvcmRzWzVdIDw8IDE5KVxuXG5cdFx0Ly9kZWNvZGUgdGhlIGJsb2NrSW5kZXhcblx0XHRibG9ja19pbmRleCA9IGJUeHJlZi53b3Jkc1s2XVxuXHRcdGJsb2NrX2luZGV4IHw9IChiVHhyZWYud29yZHNbN10gPDwgNSlcblx0XHRibG9ja19pbmRleCB8PSAoYlR4cmVmLndvcmRzWzhdIDw8IDEwKVxuXG5cdFx0Ly9kZWNvZGUgdGhlIHV0eG9JbmRleFxuXHRcdGlmKGJUeHJlZi53b3Jkcy5sZW5ndGggPT0gMTIpe1xuXHRcdFx0dXR4b19pbmRleCA9IGJUeHJlZi53b3Jkc1s5XVxuXHRcdFx0dXR4b19pbmRleCB8PSAoYlR4cmVmLndvcmRzWzEwXSA8PCA1KVxuXHRcdFx0dXR4b19pbmRleCB8PSAoYlR4cmVmLndvcmRzWzExXSA8PCAxMClcblx0XHR9XG5cblx0XHQvL2RlY29kZSB0aGUgY2hhaW5cblx0XHQoYlR4cmVmLnByZWZpeCA9PT0gVHhyZWYuQkVDSDMyX0hSUF9NQUlOTkVUKSA/XG5cdFx0XHRjaGFpbiA9IEJlY2gzMlByZWZpeC5CVENfTUFJTk5FVCA6IGNoYWluID0gQmVjaDMyUHJlZml4LkJUQ19URVNUTkVUXG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y2hhaW4sXG5cdFx0XHRibG9ja19oZWlnaHQsXG5cdFx0XHRibG9ja19pbmRleCxcblx0XHRcdHV0eG9faW5kZXhcblx0XHR9XG5cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFR4cmVmXG4iLCJjb25zdCBCZWNoMzJQcmVmaXggPSByZXF1aXJlKCcuLi9zcmMvYmVjaDMycHJlZml4JylcbmNvbnN0IERhbyA9IHJlcXVpcmUoJy4uL3NyYy9kYW8vYWJzdHJhY3REYW8nKVxuXG5jb25zdCB0eCA9IFtcbntcblx0bmFtZTogJ2EgbWFpbm5ldCB0eCB3aXRoIGJsb2NrIGhlaWdodCAwIGFuZCBwb3MgMCcsXG5cdGNoYWluOiBCZWNoMzJQcmVmaXguQlRDX01BSU5ORVQsXG5cdGJsb2NrX2hlaWdodDogMCxcblx0YmxvY2tfaW5kZXg6IDAsXG5cdHR4cmVmOiAnYmMxOnJxcXEtcXFxcS1xMmhjLTNxNicsXG5cdHR4aWQ6IHVuZGVmaW5lZCxcblx0dXR4b0luZGV4OiB1bmRlZmluZWRcbn0se1xuXHRuYW1lOiAnYSBtYWlubmV0IHR4IHdpdGggYmxvY2sgaGVpZ2h0IDEgYW5kIHBvcyAwIGFuZCB0eGlkIG9mIDBlM2UyMzU3ZTgwNmI2Y2RiMWY3MGI1NGMzYTNhMTdiNjcxNGVlMWYwZTY4YmViYjQ0YTc0YjFlZmQ1MTIwOTgnLFxuXHRjaGFpbjogQmVjaDMyUHJlZml4LkJUQ19NQUlOTkVULFxuXHRibG9ja19oZWlnaHQ6IDEsXG5cdGJsb2NrX2luZGV4OiAwLFxuXHR0eHJlZjogJ2JjMTpyenFxLXFxcXEtcWVxYy02c3cnLCAvL2JjMTpyenFxLXFxcXEtcWhsci01Y3QnLFxuXHR0eGlkOiAnMGUzZTIzNTdlODA2YjZjZGIxZjcwYjU0YzNhM2ExN2I2NzE0ZWUxZjBlNjhiZWJiNDRhNzRiMWVmZDUxMjA5OCcsXG5cdHV0eG9JbmRleDogdW5kZWZpbmVkXG59LHtcblx0bmFtZTogJ2EgbWFpbm5ldCB0eCB3aXRoIGJsb2NrIGhlaWdodCAyMDk3MTUxIGFuZCBwb3MgMTAwMCcsXG5cdGNoYWluOiBCZWNoMzJQcmVmaXguQlRDX01BSU5ORVQsXG5cdGJsb2NrX2hlaWdodDogMjA5NzE1MSxcblx0YmxvY2tfaW5kZXg6IDEwMDAsXG5cdHR4cmVmOiAnYmMxOnI3bGwtbHJnbC1xM3NxLTI3aicsIC8vYmMxOnI3bGwtbHJnbC1xbDBtLXlraCcsXG5cdHR4aWQ6IHVuZGVmaW5lZCxcblx0dXR4b0luZGV4OiB1bmRlZmluZWRcbn0se1xuXHRuYW1lOiAnYSBtYWlubmV0IHR4IHdpdGggYmxvY2sgaGVpZ2h0IDIwOTcxNTEgYW5kIHBvcyA4MTkxJyxcblx0Y2hhaW46IEJlY2gzMlByZWZpeC5CVENfTUFJTk5FVCxcblx0YmxvY2tfaGVpZ2h0OiAyMDk3MTUxLFxuXHRibG9ja19pbmRleDogODE5MSxcblx0dHhyZWY6ICdiYzE6cjdsbC1scmxsLThod3UtNDk2JywgLy9iYzE6cjdsbC1scmxsLThlMzgtbWRsJyxcblx0dHhpZDogdW5kZWZpbmVkLFxuXHR1dHhvSW5kZXg6IHVuZGVmaW5lZFxufSx7XG5cdG5hbWU6ICdhIG1haW5uZXQgdHggd2l0aCBibG9jayBoZWlnaHQgMjA5NzE1MSBhbmQgcG9zIDAnLFxuXHRjaGFpbjogQmVjaDMyUHJlZml4LkJUQ19NQUlOTkVULFxuXHRibG9ja19oZWlnaHQ6IDIwOTcxNTEsXG5cdGJsb2NrX2luZGV4OiAwLFxuXHR0eHJlZjogJ2JjMTpyN2xsLWxycXEtcXEybS1uMGEnLCAvL2JjMTpyN2xsLWxycXEtcXc0cS1hOGMnLFxuXHR0eGlkOiB1bmRlZmluZWQsXG5cdHV0eG9JbmRleDogdW5kZWZpbmVkXG59LHtcblx0bmFtZTogJ2EgbWFpbm5ldCB0eCB3aXRoIGJsb2NrIGhlaWdodCAwIGFuZCBwb3MgODE5MScsXG5cdGNoYWluOiBCZWNoMzJQcmVmaXguQlRDX01BSU5ORVQsXG5cdGJsb2NrX2hlaWdodDogMCxcblx0YmxvY2tfaW5kZXg6IDgxOTEsXG5cdHR4cmVmOiAnYmMxOnJxcXEtcXFsbC04YW5sLWgyYScsIC8vYmMxOnJxcXEtcXFsbC04bnZ5LWV6YycsXG5cdHR4aWQ6IHVuZGVmaW5lZCxcblx0dXR4b0luZGV4OiB1bmRlZmluZWRcbn0se1xuXHRuYW1lOiAnYSBtYWlubmV0IHR4IHdpdGggYmxvY2sgaGVpZ2h0IDQ2Nzg4MyBhbmQgcG9zIDIzNTUgYW5kIHR4aWQgb2YgMDE2YjcxZDllYzYyNzA5NjU2NTA0ZjEyODJiYjgxZjdhY2Y5OThkZjAyNWU1NGJkNjhlYTMzMTI5ZDhhNDI1YicsXG5cdGNoYWluOiBCZWNoMzJQcmVmaXguQlRDX01BSU5ORVQsXG5cdGJsb2NrX2hlaWdodDogNDY3ODgzLFxuXHRibG9ja19pbmRleDogMjM1NSxcblx0dHhyZWY6ICdiYzE6cms2My11cW5mLXpwY3YtOWE5JywgLy9iYzE6cms2My11cW5mLXowOGgtdDRxJyxcblx0dHhpZDogJzAxNmI3MWQ5ZWM2MjcwOTY1NjUwNGYxMjgyYmI4MWY3YWNmOTk4ZGYwMjVlNTRiZDY4ZWEzMzEyOWQ4YTQyNWInLFxuXHR1dHhvSW5kZXg6IHVuZGVmaW5lZFxufSx7XG5cdG5hbWU6ICdhIG1haW5uZXQgdHggd2l0aCBibG9jayBoZWlnaHQgMHgxRkZGRkYgYW5kIHBvcyAwJyxcblx0Y2hhaW46IEJlY2gzMlByZWZpeC5CVENfTUFJTk5FVCxcblx0YmxvY2tfaGVpZ2h0OiAweDFGRkZGRixcblx0YmxvY2tfaW5kZXg6IDAsXG5cdHR4cmVmOiAnYmMxOnI3bGwtbHJxcS1xcTJtLW4wYScsIC8vYmMxOnI3bGwtbHJxcS1xdzRxLWE4YycsXG5cdHR4aWQ6IHVuZGVmaW5lZCxcblx0dXR4b0luZGV4OiB1bmRlZmluZWRcbn0se1xuXHRuYW1lOiAnYSBtYWlubmV0IHR4IHdpdGggYmxvY2sgaGVpZ2h0IDB4NzFGNjkgYW5kIHBvcyAweDg5RCcsXG5cdGNoYWluOiBCZWNoMzJQcmVmaXguQlRDX01BSU5ORVQsXG5cdGJsb2NrX2hlaWdodDogMHg3MUY2OSxcblx0YmxvY2tfaW5kZXg6IDB4ODlELFxuXHR0eHJlZjogJ2JjMTpyamswLXVxYXktenByMi14aHonLCAvL2JjMTpyamswLXVxYXktejB1My1nbDgnLFxuXHR0eGlkOiB1bmRlZmluZWQsXG5cdHV0eG9JbmRleDogdW5kZWZpbmVkXG59LHtcblx0bmFtZTogJ2EgbWFpbm5ldCB0eCB3aXRoIGJsb2NrIGhlaWdodCA0NjY3OTMgYW5kIHBvcyAyMjA1Jyxcblx0Y2hhaW46IEJlY2gzMlByZWZpeC5CVENfTUFJTk5FVCxcblx0YmxvY2tfaGVpZ2h0OiA0NjY3OTMsXG5cdGJsb2NrX2luZGV4OiAyMjA1LFxuXHR0eHJlZjogJ2JjMTpyamswLXVxYXktenByMi14aHonLCAvL2JjMTpyamswLXVxYXktejB1My1nbDgnLFxuXHR0eGlkOiB1bmRlZmluZWQsXG5cdHV0eG9JbmRleDogdW5kZWZpbmVkXG59LHtcblx0bmFtZTogJ2EgbWFpbm5ldCB0eCB3aXRoIGJsb2NrIGhlaWdodCAwIGFuZCBwb3MgMHg3RkZGJyxcblx0Y2hhaW46IEJlY2gzMlByZWZpeC5CVENfTUFJTk5FVCxcblx0YmxvY2tfaGVpZ2h0OiAwLFxuXHRibG9ja19pbmRleDogMHg3RkZGLFxuXHR0eHJlZjogJ2JjMTpycXFxLXFxbGwtbGt4bi1ycG4nLCAvL2JjMTpycXFxLXFxbGwtbGNlZy1kZmsnLFxuXHR0eGlkOiB1bmRlZmluZWQsXG5cdHV0eG9JbmRleDogdW5kZWZpbmVkXG59LHtcblx0bmFtZTogJ2EgbWFpbm5ldCB0eCB3aXRoIGJsb2NrIGhlaWdodCAweEZGRkZGRiBhbmQgcG9zIDB4N0ZGRicsXG5cdGNoYWluOiBCZWNoMzJQcmVmaXguQlRDX01BSU5ORVQsXG5cdGJsb2NrX2hlaWdodDogMHhGRkZGRkYsXG5cdGJsb2NrX2luZGV4OiAweDdGRkYsXG5cdHR4cmVmOiAnYmMxOnI3bGwtbGxsbC1sOXgwLXI0NCcsIC8vYmMxOnI3bGwtbGxsbC1sdGU1LWRhcycsXG5cdHR4aWQ6IHVuZGVmaW5lZCxcblx0dXR4b0luZGV4OiB1bmRlZmluZWRcbn0se1xuXHRuYW1lOiAnYSB0ZXN0bmV0IHR4IHdpdGggYmxvY2sgaGVpZ2h0IDQ2Nzg4MyBhbmQgcG9zIDIzNTUnLFxuXHRjaGFpbjogQmVjaDMyUHJlZml4LkJUQ19URVNUTkVULFxuXHRibG9ja19oZWlnaHQ6IDQ2Nzg4Myxcblx0YmxvY2tfaW5kZXg6IDIzNTUsXG5cdHR4cmVmOiAndGIxOnhrNjMtdXFuZi16ZTA2LTd0MicsIC8vdGIxOnhrNjMtdXFuZi16ejBrLTNoNycsXG5cdHR4aWQ6IHVuZGVmaW5lZCxcblx0dXR4b0luZGV4OiB1bmRlZmluZWRcbn0se1xuXHRuYW1lOiAnYSB0ZXN0bmV0IHR4IHdpdGggYmxvY2sgaGVpZ2h0IDAgYW5kIHBvcyAwJyxcblx0Y2hhaW46IEJlY2gzMlByZWZpeC5CVENfVEVTVE5FVCxcblx0YmxvY2tfaGVpZ2h0OiAwLFxuXHRibG9ja19pbmRleDogMCxcblx0dHhyZWY6ICd0YjE6eHFxcS1xcXFxLXFqcXctMms0JywgLy90YjE6eHFxcS1xcXFxLXFmcXotOTJwJyxcblx0dHhpZDogdW5kZWZpbmVkLFxuXHR1dHhvSW5kZXg6IHVuZGVmaW5lZFxufSx7XG5cdG5hbWU6ICdhIHRlc3RuZXQgdHggd2l0aCBibG9jayBoZWlnaHQgMHhGRkZGRkYgYW5kIHBvcyAweDdGRkYnLFxuXHRjaGFpbjogQmVjaDMyUHJlZml4LkJUQ19URVNUTkVULFxuXHRibG9ja19oZWlnaHQ6IDB4RkZGRkZGLFxuXHRibG9ja19pbmRleDogMHg3RkZGLFxuXHR0eHJlZjogJ3RiMTp4N2xsLWxsbGwtbGEzZS1jcjYnLCAvL3RiMTp4N2xsLWxsbGwtbHgzNC1obHcnLFxuXHR0eGlkOiB1bmRlZmluZWQsXG5cdHV0eG9JbmRleDogdW5kZWZpbmVkXG59LHtcblx0bmFtZTogJ2EgdGVzdG5ldCB0eCB3aXRoIGJsb2NrIGhlaWdodCAxMTUyMTk0IGFuZCBwb3MgMSBhbmQgdHhpZCBvZiBmOGNkYWZmM2ViZDllODYyZWQ1ODg1Zjg5NzU0ODkwOTA1OTVhYmUxNDcwMzk3Zjc5NzgwZWFkMWM3NTI4MTA3Jyxcblx0Y2hhaW46IEJlY2gzMlByZWZpeC5CVENfVEVTVE5FVCxcblx0YmxvY2tfaGVpZ2h0OiAxMTUyMTk0LFxuXHRibG9ja19pbmRleDogMSxcblx0dHhyZWY6ICd0YjE6eHl2Mi14enBxLXFwM3ctM2FwJywgLy90YjE6eHl2Mi14enBxLXE2M3otN3A0Jyxcblx0dHhpZDogJ2Y4Y2RhZmYzZWJkOWU4NjJlZDU4ODVmODk3NTQ4OTA5MDU5NWFiZTE0NzAzOTdmNzk3ODBlYWQxYzc1MjgxMDcnLFxuXHR1dHhvSW5kZXg6IHVuZGVmaW5lZFxufV1cblxuXG5cblxubW9kdWxlLmV4cG9ydHMgPSB0eFxuIl19
