const Blockchain = require('../src/blockchain')
const Dao = require('../src/dao/abstractDao')

const tx = [
{
	name: 'a mainnet tx with block height 0 and pos 0',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 0,
	blockIndex: 0,
	txref: 'bc1:rqqq-qqqq-q2hc-3q6',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 1 and pos 0 and txid of 0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 1,
	blockIndex: 0,
	txref: 'bc1:rzqq-qqqq-qeqc-6sw', //bc1:rzqq-qqqq-qhlr-5ct',
	txid: '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 2097151 and pos 1000',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 2097151,
	blockIndex: 1000,
	txref: 'bc1:r7ll-lrgl-q3sq-27j', //bc1:r7ll-lrgl-ql0m-ykh',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 2097151 and pos 8191',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 2097151,
	blockIndex: 8191,
	txref: 'bc1:r7ll-lrll-8hwu-496', //bc1:r7ll-lrll-8e38-mdl',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 2097151 and pos 0',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 2097151,
	blockIndex: 0,
	txref: 'bc1:r7ll-lrqq-qq2m-n0a', //bc1:r7ll-lrqq-qw4q-a8c',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0 and pos 8191',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 0,
	blockIndex: 8191,
	txref: 'bc1:rqqq-qqll-8anl-h2a', //bc1:rqqq-qqll-8nvy-ezc',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 467883 and pos 2355 and txid of 016b71d9ec62709656504f1282bb81f7acf998df025e54bd68ea33129d8a425b',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 467883,
	blockIndex: 2355,
	txref: 'bc1:rk63-uqnf-zpcv-9a9', //bc1:rk63-uqnf-z08h-t4q',
	txid: '016b71d9ec62709656504f1282bb81f7acf998df025e54bd68ea33129d8a425b',
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0x1FFFFF and pos 0',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 0x1FFFFF,
	blockIndex: 0,
	txref: 'bc1:r7ll-lrqq-qq2m-n0a', //bc1:r7ll-lrqq-qw4q-a8c',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0x71F69 and pos 0x89D',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 0x71F69,
	blockIndex: 0x89D,
	txref: 'bc1:rjk0-uqay-zpr2-xhz', //bc1:rjk0-uqay-z0u3-gl8',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 466793 and pos 2205',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 466793,
	blockIndex: 2205,
	txref: 'bc1:rjk0-uqay-zpr2-xhz', //bc1:rjk0-uqay-z0u3-gl8',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0 and pos 0x7FFF',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 0,
	blockIndex: 0x7FFF,
	txref: 'bc1:rqqq-qqll-lkxn-rpn', //bc1:rqqq-qqll-lceg-dfk',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0xFFFFFF and pos 0x7FFF',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 0xFFFFFF,
	blockIndex: 0x7FFF,
	txref: 'bc1:r7ll-llll-l9x0-r44', //bc1:r7ll-llll-lte5-das',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a testnet tx with block height 467883 and pos 2355',
	chain: Blockchain.BTC_TESTNET,
	blockHeight: 467883,
	blockIndex: 2355,
	txref: 'tb1:xk63-uqnf-ze06-7t2', //tb1:xk63-uqnf-zz0k-3h7',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a testnet tx with block height 0 and pos 0',
	chain: Blockchain.BTC_TESTNET,
	blockHeight: 0,
	blockIndex: 0,
	txref: 'tb1:xqqq-qqqq-qjqw-2k4', //tb1:xqqq-qqqq-qfqz-92p',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a testnet tx with block height 0xFFFFFF and pos 0x7FFF',
	chain: Blockchain.BTC_TESTNET,
	blockHeight: 0xFFFFFF,
	blockIndex: 0x7FFF,
	txref: 'tb1:x7ll-llll-la3e-cr6', //tb1:x7ll-llll-lx34-hlw',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a testnet tx with block height 1152194 and pos 1 and txid of f8cdaff3ebd9e862ed5885f8975489090595abe1470397f79780ead1c7528107',
	chain: Blockchain.BTC_TESTNET,
	blockHeight: 1152194,
	blockIndex: 1,
	txref: 'tb1:xyv2-xzpq-qp3w-3ap', //tb1:xyv2-xzpq-q63z-7p4',
	txid: 'f8cdaff3ebd9e862ed5885f8975489090595abe1470397f79780ead1c7528107',
	utxoIndex: undefined
}]




module.exports = tx
