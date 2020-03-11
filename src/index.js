const Dao = require('./blockcypherDao')
const txid = 'a580cc76ac9a5eaed45a1fd6118db7def823e847cf321a98d3dfb7d6e24f2b9c'

const dao = new Dao()

try{
	console.log(dao.getTx())
} catch (e) {
	console.log(e)
}
