const expect = require('chai').expect
const assert = require('chai').assert
const Txref = require('../src/txref')

describe('Txref',() => {

	describe('Txref.encode',() => {
		
		it('should throw an error on invalid chain', () => {
			try{
				Txref.encode('invalid')
				return false
			}catch(e){
				expect(e.message).to.equal('Invalid chain')
			}
		})

		it('should throw an error on invalid block height', () => {
			try{
				Txref.encode(Txref.CHAIN_TESTNET)
				return false
			}catch(e){
				expect(e.message).to.equal('Invalid block height')
			}
		})

		it('should throw an error on invalid block index', () => {
			try{
				Txref.encode(Txref.CHAIN_TESTNET,1000)
				return false
			}catch(e){
				expect(e.message).to.equal('Invalid block index')
			}
		})

		it('should return a testnet txref', () => {
			const txref = Txref.encode(Txref.CHAIN_TESTNET,1201739,2)
			expect(txref).to.equal('8kyt-fzzq-qqqq-ase0-d8')
		})

	})
})
