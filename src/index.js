//const Dao = require('./blockcypherDao')
//const txid = 'a580cc76ac9a5eaed45a1fd6118db7def823e847cf321a98d3dfb7d6e24f2b9c'

//const dao = new Dao()

//try{
//	console.log(dao.getTx())
//} catch (e) {
//	console.log(e)
//}

const Txref = require('./txref')
//console.log(Txref.encode('mainnet',0,0))
//console.log(Txref.encode('mainnet',1,0))
//console.log(Txref.encode('mainnet',2097151,1000))
console.log(Txref.decode('tx1:r7ll-lrgl-ql0m-ykh'))

const encode = require('./txrefConverter').txrefEncode
//console.log(encode('mainnet',0,0))
//console.log(encode('mainnet',1,0))
//console.log(encode('mainnet',2097151,1000))

const decode = require('./txrefConverter').txrefDecode
console.log(decode('tx1:r7ll-lrgl-ql0m-ykh'))
