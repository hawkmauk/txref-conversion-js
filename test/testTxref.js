const expect = require('chai').expect
const assert = require('chai').assert

const Bech32hrp = require('../src/bech32hrp')
const Txref = require('../src/txref')
const testData = require('./data')

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
				Txref.encode(Bech32hrp.BTC_TESTNET)
				return false
			}catch(e){
				expect(e.message).to.equal('Invalid block height')
			}
		})

		it('should throw an error on invalid block index', () => {
			try{
				Txref.encode(Bech32hrp.BTC_TESTNET,1000)
				return false
			}catch(e){
				expect(e.message).to.equal('Invalid block index')
			}
		})

		//Run test data throught the encode function
		testData.forEach((test) => {
				it('encode ' + test.name, () => {
					const txref = Txref.encode(
						test.chain,
						test.block_height,
						test.block_index,
						test.utxo_index)
					expect(txref).to.equal(test.txref)
				})
		})


	})

	describe('Txref.decode',() => {

		it('should throw an error on invalid txref', () => {
			try{
				Txref.decode('invalid')
				return false
			}catch(e){
				expect(e.message).to.equal('Invalid txref')
			}
		})
		
		//Run test data throught the decode function
		testData.forEach((test) => {

				it('decode ' + test.txref, () => {

					const data = Txref.decode(test.txref)
					expect(data).to.eql({
						'chain': test.chain
						,'block_height': test.block_height
						,'block_index': test.block_index
						,'utxo_index': test.utxo_index
					})
				})
		})

	})
})

