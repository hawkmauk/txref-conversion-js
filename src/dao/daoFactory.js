const BlockcypherDao = require('./blockcypherDao')
const BlockstreamDao = require('./blockstreamDao')
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
    /** Identifier for the BlockcypherDao */
    BLOCKSTREAM: 2,
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
 *	@param {Bech32hrp} chain - The Bech32 registered prefix used to identify the chain
 *
 *	@return {AbstractDao} dao - An instance of a class extending the AbstractDao subtype
 */
DaoFactory.get = ((provider, chain) => {
		
	if(provider === DaoType.MOCK){
		return new MockDao(chain)
	}else if (provider === DaoType.BLOCKCYPHER){
		return new BlockcypherDao(chain)
	}else if (provider === DaoType.BLOCKSTREAM){
		return new BlockstreamDao(chain)
	}else{
		throw new Error('Dao not recognised')
	}
})

module.exports = { DaoType, DaoFactory }
