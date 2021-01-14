/*
 *  EXAMPLES
 */
const Bech32hrp = require('../src/bech32hrp')
const {DaoType, DaoFactory} = require('./dao/daoFactory')

/**
 *
 * TxReader
 *
 * Create a TxReader to use the blockstream.info site
 * to return 
 */
const TxReader = require('./txReader')
const reader = new TxReader(DaoType.BLOCKSTREAM)

reader.getTxref(Bech32hrp.BTC_MAINNET,'0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098')
    .then((txref) => console.log(txref))
// returns tx1:rzqq-qqqq-qhlr-5ct

reader.getTxid('tx1:rzqq-qqqq-qhlr-5ct')
    .then((txid) => console.log(txid))
// returns 0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098

reader.getTx('tx1:rzqq-qqqq-qhlr-5ct')
    .then((tx) => console.log(tx))
// returns {
//      txid: '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
//      block_height: 1,
//      block_index: 0
// }
