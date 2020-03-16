const Dao = require('../test/mockDao')
const BtcrReader = require('./btcrReader')
const testData = require('../test/data')

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
testData.forEach(async (test) => {

	//initialise the dao
	const dao = new Dao(test.chain)
	const reader = new BtcrReader(dao)

	//only run for data with a txid
	if(test.txid !== undefined){

		const tx = await dao.getTx(test.txid)
		const txref = await reader.getTxref(test.txid)
	}
})


const Txref = require('./txref')
//console.log(Txref.encode('mainnet',0,0))
//console.log(Txref.encode('mainnet',1,0))
//console.log(Txref.encode('mainnet',2097151,1000))
//console.log(Txref.decode('tx1:r7ll-lrgl-ql0m-ykh'))

const encode = require('./txrefConverter').txrefEncode
//console.log(encode('mainnet',0,0))
//console.log(encode('mainnet',1,0))
//console.log(encode('mainnet',2097151,1000))

const decode = require('./txrefConverter').txrefDecode
//console.log(decode('tx1:r7ll-lrgl-ql0m-ykh'))
