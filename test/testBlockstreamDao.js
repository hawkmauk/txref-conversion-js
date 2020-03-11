const chai = require('chai')
const expect = chai.expect
const assert = chai.assert
const chaiAsPromised = require("chai-as-promised");

const Bech32hrp = require('../src/bech32hrp')
const AbstractDao = require('../src/dao/abstractDao')
const Dao = require('../src/dao/blockstreamDao')
const testData = require('./data')

//select random test start point
const limit=5
const start = Math.floor(Math.random() * (testData.length - limit))

chai.use(chaiAsPromised);

describe('BlockstreamDao tests', () => {

        describe('constructor', () => {
                it('defaults to testnet', () => {
                        const dao = new Dao()
                        expect(dao.chain).to.equal(Bech32hrp.BTC_TESTNET)
                })

                it('can be set to mainnet', () => {
                        const dao = new Dao(Bech32hrp.BTC_MAINNET)
                        expect(dao.chain).to.equal(Bech32hrp.BTC_MAINNET)
                })

                it('can be set to testnet', () => {
                        const dao = new Dao(Bech32hrp.BTC_TESTNET)
                        expect(dao.chain).to.equal(Bech32hrp.BTC_TESTNET)
                })

                it('thows error on invald chain', () => {
                        expect(() => new Dao('invalid')).to.throw('Invalid chain: invalid')
                })
        })

        describe('getTxById', () => {

                it('promise rejects on invalid transaction', (done) => {

                        const dao = new Dao(Bech32hrp.BTC_TESTNET)

                        // find a testnet transaction in the test data
                        expect(dao.getTxById('016b71d9ec62709656504f1282bb81f7acf998df025e54bd68ea33129d8a425b'))
                                .to.eventually.be.rejectedWith(AbstractDao.NOT_FOUND_ERROR)
                                .notify(done)
                })

                //for each tx in testdata
                testData.slice(start,start+limit).forEach((test) => {

                        //initialise the dao
                        const dao = new Dao(test.chain)

                        //only run for data with a txid
                        if(test.txid !== undefined){

                                it(`get ${test.chain} for txid: ${test.txid}`, (done) => {

                                        expect(dao.getTxById(test.txid))
                                                .to.eventually.contain.keys('block_height','block_index')
                                                .notify(done)

                                })
                        }
                })
        })

        describe('getTxByIndex', () => {

                it('promise rejects on invalid transaction', (done) => {

                        const dao = new Dao(Bech32hrp.BTC_TESTNET)

                        expect(dao.getTxByIndex(467883,2355))
                                .to.eventually.be.rejectedWith(AbstractDao.NOT_FOUND_ERROR)
                                .notify(done)
                })

                //for each tx in testdata
                testData.slice(start,start+limit).forEach((test) => {

                        //initialise the dao
                        const dao = new Dao(test.chain)

                        //only run for data with a txid
                        if(test.txid !== undefined){
                                it(`get ${test.chain} for block_height ${test.block_height} and block_index ${test.block_index}`, (done) => {
                                        expect(dao.getTxByIndex(test.block_height,test.block_index))
                                                .to.eventually.contain.keys('block_height','block_index')
                                                .notify(done)
                                })
                        }
                })
        })
})
