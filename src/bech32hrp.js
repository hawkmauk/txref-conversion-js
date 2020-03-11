/**
 *  @readonly
 *  @enum {string}
 *	Define standard chain identifiers as per the Bech32hrp definition
 *	See https://github.com/satoshilabs/slips/blob/master/slip-0173.md
 */
var Bech32hrp = {

    /**
     * Bech32hrp for BTC mainnet
     */
	BTC_MAINNET: 'tx',
    /**
     * Bech32hrp for BTC testnet
     */
	BTC_TESTNET: 'txtest',

}

module.exports = Bech32hrp
