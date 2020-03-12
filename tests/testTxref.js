const expect = require('chai').expect
const assert = require('chai').assert
const Txref = require('../src/txref')

const valid_mainnet_1 = {
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 0,
	blockIndex: 0,
	txref: 'tx1:rqqq-qqqq-qygr-lgl'
}

const valid_mainnet_2 = {
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 1,
	blockIndex: 0,
	txref: 'tx1:rzqq-qqqq-qhlr-5ct'
}

const valid_mainnet_3 = {
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 2097151,
	blockIndex: 1000,
	txref: 'tx1:r7ll-lrgl-ql0m-ykh'
}

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

		it('encodes a mainnet tx with block height 0 and pos 0', () => {
			const txref = Txref.encode(
				valid_mainnet_1.chain,
				valid_mainnet_1.blockHeight,
				valid_mainnet_1.blockIndex)
			expect(txref).to.equal(valid_mainnet_1.txref)
		})

		it('encodes a mainnet tx with block height 1 and pos 0', () => {
			const txref = Txref.encode(
				valid_mainnet_2.chain,
				valid_mainnet_2.blockHeight,
				valid_mainnet_2.blockIndex)
			expect(txref).to.equal(valid_mainnet_2.txref)
		})

		it('encodes a mainnet tx with block height 2097151 and pos 1000', () => {
			const txref = Txref.encode(
				valid_mainnet_3.chain,
				valid_mainnet_3.blockHeight,
				valid_mainnet_3.blockIndex)
			expect(txref).to.equal(valid_mainnet_3.txref)
		})

	})
})
