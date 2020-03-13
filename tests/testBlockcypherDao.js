const chai = require('chai')
const expect = chai.expect

const Dao = require('../src/blockcypherDao')

const testnet_txid = 'a580cc76ac9a5eaed45a1fd6118db7def823e847cf321a98d3dfb7d6e24f2b9c'
const testnet_txid_blockhash = '000000007c978d260c15e20bfa8593e904c0ca206600278ecfdd1dd72aeb08c9'
const mainnet_txid = 'ae121ed0b1fd651f57605aebcebbfb6f644c2f5a05a95bb2ff4bb7f860249451'
const mainnet_txid_blockhash = '00000000000000000001c297dd7f7efd115bf9fe3fe54838ccbed38ebc7e68a3'

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

	describe('getTx', () => {

		it('returns a testnet transaction', async () => {
			const dao = new Dao()
			expect(await dao.getTx(testnet_txid)).to.contain(({
				"block_hash": testnet_txid_blockhash
			}))
		})

		it('returns a mainnet transaction', async () => {
			const dao = new Dao(Dao.CHAIN_MAINNET)
			expect(await dao.getTx(mainnet_txid)).to.contain(({
				"block_hash": mainnet_txid_blockhash
			}))
		})

		it('promise rejects on invalid transaction', async () => {
			const dao = new Dao(Dao.CHAIN_MAINNET)
			dao.getTx(testnet_txid)
				.then((resolve) => {
					expect(resolve).to.be.undefined
				})
				.catch((reject) => {
					expect(reject).to.equal('Transaction not found')
				})
		})
	})

	describe('getTxref', () => {

		it('returns a txref',(async ) => {
			return true
		})

	})

})
