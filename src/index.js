const dao = require('./blockcypherDao')
const txid = 'a580cc76ac9a5eaed45a1fd6118db7def823e847cf321a98d3dfb7d6e24f2b9c'

console.log(dao.chain)

dao.getTx(txid).then( (tx) => {
	console.log(tx)
})
