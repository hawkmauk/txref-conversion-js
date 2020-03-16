const chai = require('chai')
const expect = chai.expect

//use a mockDao
const Dao = require('./mockDao')
//const Dao = require('../src/dao/blockcypherDao')
const BtcrReader = require('../src/btcrReader')

const testData = require('./data')

describe('BtcrReader tests',() => {

	describe('getTxref', () => {

		//for each tx in testdata
		testData.forEach((test) => {

			//initialise the dao
			const dao = new Dao(test.chain)
			const reader = new BtcrReader(dao)

			//only run for data with a txid
			if(test.txid !== undefined){

				it('get Txref for '+ test.name, async () => {
					const txref = await reader.getTxref(test.txid)
					expect(txref).to.equal(test.txref)
				})

			}
		})
	})

})
