const chai = require('chai')
const expect = chai.expect

//use a mockDao
const { DaoFactory, DaoType } = require('../src/dao/daoFactory')
const TxReader = require('../src/txReader')

const testData = require('./data')


describe('TxReader tests',() => {

	describe('getTxref', () => {

		//for each tx in testdata
		testData.forEach((test) => {

			//initialise the dao
			const reader = new TxReader(DaoType.MOCK)

			//only run for data with a txid
			if(test.txid !== undefined){

				it('get Txref for '+ test.name, async () => {
					const txref = await reader.getTxref(test.chain, test.txid)
					expect(txref).to.equal(test.txref)
				})

			}
		})
	})

	describe('getTxid', () => {

		//for each tx in testdata
		testData.forEach((test) => {

			const reader = new TxReader(DaoType.MOCK)

			//only run for data with a txid
			if(test.txid !== undefined){

				it('get Txid for '+ test.name, async () => {
					const txid = await reader.getTxid(test.txref)
					expect(txid).to.equal(test.txid)
				})

			}
		})
	})
})
