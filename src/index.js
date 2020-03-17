//const Dao = require('../test/mockDao')
const Dao = require('./dao/blockcypherDao')

const BtcrReader = require('./btcrReader')
const testData = require('../test/data')
const Blockchain = require('./blockchain')
const Txref = require('./txref')


//for each tx in testdata
//testData.forEach(async (test) => {
//
//	//initialise the dao
//	const dao = new Dao(test.chain)
//	//only run for data with a txid
//	if(test.txid !== undefined){
//
//		const tx = await dao.getTx(test.txid)
//		console.log(tx.block_height)
//	}
//})

//for each tx in testdata
//testData.forEach(async (test) => {

	//initialise the dao
//	const dao = new Dao(test.chain)
//    const reader = new BtcrReader(dao)

	//only run for data with a txid
//	if(test.txid !== undefined){

//		const tx = await dao.getTx(test.txid)
//		const txref = await reader.getTxref(test.txid)
//	}
//})

//for each tx in testdata
testData.forEach((test) => {

	console.log(test)
	const txref = Txref.encode(test.chain, test.blockHeight, test.blockIndex)
	console.log(txref)
	const tx = Txref.decode(txref)
	console.log(tx)

})

//const txref = Txref.encode(Blockchain.BTC_TESTNET,1152154,1)
//console.log(Txref.decode(txref))

//console.log(Txref.encode('mainnet',1,0))
console.log(Txref.encode('btc_mainnet',2097151,1000))

//console.log(encode('mainnet',0,0))
//console.log(encode('mainnet',1,0))
//console.log(encode('mainnet',2097151,1000))

//console.log(decode('tx1:r7ll-lrgl-ql0m-ykh'))
