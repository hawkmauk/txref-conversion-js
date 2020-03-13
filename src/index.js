const Dao = require('./blockcypherDao')
const testData = require('../test/data')

const mainnet_txid = 'ae121ed0b1fd651f57605aebcebbfb6f644c2f5a05a95bb2ff4bb7f860249451'

const maindao = new Dao(Dao.CHAIN_MAINNET)
const testdao = new Dao(Dao.CHAIN_TESTNET)


//dao.getTx(mainnet_txid)
//	.then((tx) => {
//		console.log(tx)
//	})
//	.catch((e) => {
//		console.log('Error '+e)
//	})

maindao.getTxref('f8cdaff3ebd9e862ed5885f8975489090595abe1470397f79780ead1c7528107')
	.then((res) => {
		console.log(res)
	})
	.catch((e) => {
	    console.log(e)
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
