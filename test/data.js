const Blockchain = require('../src/blockchain')
const Dao = require('../src/dao/abstractDao')

const tx = [
{
	name: 'a mainnet tx with block height 0 and pos 0',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 0,
	blockIndex: 0,
	txref: 'tx1:rqqq-qqqq-qygr-lgl',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 1 and pos 0 and txid of 0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 1,
	blockIndex: 0,
	txref: 'tx1:rzqq-qqqq-qhlr-5ct',
	txid: '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 2097151 and pos 1000',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 2097151,
	blockIndex: 1000,
	txref: 'tx1:r7ll-lrgl-ql0m-ykh',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 2097151 and pos 8191',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 2097151,
	blockIndex: 8191,
	txref: 'tx1:r7ll-lrll-8e38-mdl',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 2097151 and pos 0',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 2097151,
	blockIndex: 0,
	txref: 'tx1:r7ll-lrqq-qw4q-a8c',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0 and pos 8191',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 0,
	blockIndex: 8191,
	txref: 'tx1:rqqq-qqll-8nvy-ezc',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 467883 and pos 2355 and txid of 016b71d9ec62709656504f1282bb81f7acf998df025e54bd68ea33129d8a425b',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 467883,
	blockIndex: 2355,
	txref: 'tx1:rk63-uqnf-z08h-t4q',
	txid: '016b71d9ec62709656504f1282bb81f7acf998df025e54bd68ea33129d8a425b',
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0x1FFFFF and pos 0',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 0x1FFFFF,
	blockIndex: 0,
	txref: 'tx1:r7ll-lrqq-qw4q-a8c',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0x71F69 and pos 0x89D',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 0x71F69,
	blockIndex: 0x89D,
	txref: 'tx1:rjk0-uqay-z0u3-gl8',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 466793 and pos 2205',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 466793,
	blockIndex: 2205,
	txref: 'tx1:rjk0-uqay-z0u3-gl8',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0 and pos 0x7FFF',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 0,
	blockIndex: 0x7FFF,
	txref: 'tx1:rqqq-qqll-lceg-dfk',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a mainnet tx with block height 0xFFFFFF and pos 0x7FFF',
	chain: Blockchain.BTC_MAINNET,
	blockHeight: 0xFFFFFF,
	blockIndex: 0x7FFF,
	txref: 'tx1:r7ll-llll-lte5-das',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a testnet tx with block height 467883 and pos 2355',
	chain: Blockchain.BTC_TESTNET,
	blockHeight: 467883,
	blockIndex: 2355,
	txref: 'txtest1:xk63-uqnf-zz0k-3h7',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a testnet tx with block height 0 and pos 0',
	chain: Blockchain.BTC_TESTNET,
	blockHeight: 0,
	blockIndex: 0,
	txref: 'txtest1:xqqq-qqqq-qfqz-92p',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a testnet tx with block height 0xFFFFFF and pos 0x7FFF',
	chain: Blockchain.BTC_TESTNET,
	blockHeight: 0xFFFFFF,
	blockIndex: 0x7FFF,
	txref: 'txtest1:x7ll-llll-lx34-hlw',
	txid: undefined,
	utxoIndex: undefined
},{
	name: 'a testnet tx with block height 1152194 and pos 1 and txid of f8cdaff3ebd9e862ed5885f8975489090595abe1470397f79780ead1c7528107',
	chain: Blockchain.BTC_TESTNET,
	blockHeight: 1152194,
	blockIndex: 1,
	txref: 'txtest1:xyv2-xzpq-q63z-7p4',
	txid: 'f8cdaff3ebd9e862ed5885f8975489090595abe1470397f79780ead1c7528107',
	utxoIndex: undefined
}]

module.exports = tx
