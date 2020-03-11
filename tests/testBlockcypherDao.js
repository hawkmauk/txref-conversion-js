const assert = require('chai').assert
const expect = require('chai').expect

const Dao = require('../src/blockcypherDao')
const txid = 'a580cc76ac9a5eaed45a1fd6118db7def823e847cf321a98d3dfb7d6e24f2b9c'

describe('BlockcypherDao tests', () => {

	describe('constructor', () => {
		it('defaults to testnet', () => {
			const dao = new Dao()
			expect(dao.chain).to.equal(Dao.CHAIN_TESTNET)
		})

		it('can be set to mainnet', () => {
			const dao = new Dao(Dao.CHAIN_MAINNET)
			expect(dao.chain).to.equal(Dao.CHAIN_MAINNET)
		})

		it('can be set to testnet', () => {
			const dao = new Dao(Dao.CHAIN_TESTNET)
			expect(dao.chain).to.equal(Dao.CHAIN_TESTNET)
		})

		it('thows error on invald chain', () => {
			expect(() => new Dao('invalid')).to.throw('Invalid chain: invalid')
		})

	})

})
