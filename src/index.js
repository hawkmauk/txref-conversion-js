const testData = require('../test/data')
const TxReader = require('./txReader')
const Bech32hrp = require('../src/bech32hrp')
const {DaoType, DaoFactory} = require('./dao/daoFactory')

const reader = new TxReader(DaoType.BLOCKSTREAM)

//const txid = testData[6].txid
//const txref = testData[6].txref
//const chain = testData[6].chain
//
//console.log(testData[6].chain)
//console.log(testData[6].txref)
//console.log(testData[6].txid)

//reader.getTxref(chain,txid)
//    .then((txref) => {
//        console.log(`getTxref ${txref}`)
//    })
//reader.getTxid(txref)
//    .then((txid) => {
//        console.log(`getTxid ${txid}`)
//    })
//reader.getTx(txref)
//    .then((tx) => {
//        console.log(`getTx ${tx}`)
//    })

const dao = DaoFactory.get(DaoType.BLOCKSTREAM,Bech32hrp.BTC_MAINNET)
dao.getTxByIndex(467883,2355)
    .then((tx) => console.log(`found ${tx}`))
    .catch((error) => console.log(error))
