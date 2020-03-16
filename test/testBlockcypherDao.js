const chai = require('chai')
const expect = chai.expect

const Blockchain = require('../src/blockchain')
const Dao = require('../src/dao/blockcypherDao')
const testData = require('./data')

describe('BlockcypherDao tests', () => {

	describe('constructor', () => {
		it('defaults to testnet', () => {
			const dao = new Dao()
			expect(dao.chain).to.equal(Blockchain.BTC_TESTNET)
		})

		it('can be set to mainnet', () => {
			const dao = new Dao(Blockchain.BTC_MAINNET)
			expect(dao.chain).to.equal(Blockchain.BTC_MAINNET)
		})

		it('can be set to testnet', () => {
			const dao = new Dao(Blockchain.BTC_TESTNET)
			expect(dao.chain).to.equal(Blockchain.BTC_TESTNET)
		})

		it('thows error on invald chain', () => {
			expect(() => new Dao('invalid')).to.throw('Invalid chain: invalid')
		})
	})

	describe('getTx', () => {

		it('promise rejects on invalid transaction', async () => {
			const dao = new Dao(Blockchain.BTC_MAINNET)
			// find a testnet transaction in the test data
			const testnet_txid = testData.find( tx => tx.chain === Blockchain.BTC_TESTNET )
			dao.getTx(testnet_txid)
				.then((resolve) => {
					expect(resolve).to.be.undefined
				})
				.catch((reject) => {
					expect(reject).to.equal('Transaction not found')
				})
		})

		//for each tx in testdata
		testData.forEach((test) => {

			//initialise the dao
			const dao = new Dao(test.chain)

			//only run for data with a txid
			if(test.txid !== undefined){

				it('get Tx for '+ test.name, async () => {
					dao.getTx(test.txid)
						.then((resolve) => {
							expect(resolve).should.have.keys('block_height','block_index')
						})
						.catch((reject) => {
							expect(reject).to.be.undefined
						})
				})
			}
		})
	})

})
