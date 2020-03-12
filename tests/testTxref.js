const expect = require('chai').expect
const assert = require('chai').assert
const Txref = require('../src/txref')

const testData = [
{
	name: 'a mainnet tx with block height 0 and pos 0',
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 0,
	blockIndex: 0,
	txref: 'tx1:rqqq-qqqq-qygr-lgl'
},{
	name: 'a mainnet tx with block height 1 and pos 0',
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 1,
	blockIndex: 0,
	txref: 'tx1:rzqq-qqqq-qhlr-5ct'
},{
	name: 'a mainnet tx with block height 2097151 and pos 1000',
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 2097151,
	blockIndex: 1000,
	txref: 'tx1:r7ll-lrgl-ql0m-ykh'
},{
	name: 'a mainnet tx with block height 2097151 and pos 8191',
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 2097151,
	blockIndex: 8191,
	txref: 'tx1:r7ll-lrll-8e38-mdl'
},{
	name: 'a mainnet tx with block height 2097151 and pos 0',
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 2097151,
	blockIndex: 0,
	txref: 'tx1:r7ll-lrqq-qw4q-a8c'
},{
	name: 'a mainnet tx with block height 0 and pos 8191',
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 0,
	blockIndex: 8191,
	txref: 'tx1:rqqq-qqll-8nvy-ezc'
},{
	name: 'a mainnet tx with block height 467883 and pos 2355',
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 467883,
	blockIndex: 2355,
	txref: 'tx1:rk63-uqnf-z08h-t4q'
},{
	name: 'a mainnet tx with block height 0x1FFFFF and pos 0',
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 0x1FFFFF,
	blockIndex: 0,
	txref: 'tx1:r7ll-lrqq-qw4q-a8c'
},{
	name: 'a mainnet tx with block height 0x71F69 and pos 0x89D',
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 0x71F69,
	blockIndex: 0x89D,
	txref: 'tx1:rjk0-uqay-z0u3-gl8'
},{
	name: 'a mainnet tx with block height 466793 and pos 2205',
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 466793,
	blockIndex: 2205,
	txref: 'tx1:rjk0-uqay-z0u3-gl8'
},{
	name: 'a mainnet tx with block height 0 and pos 0x7FFF',
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 0,
	blockIndex: 0x7FFF,
	txref: 'tx1:rqqq-qqll-lceg-dfk'
},{
	name: 'a mainnet tx with block height 0xFFFFFF and pos 0x7FFF',
	chain: Txref.CHAIN_MAINNET,
	blockHeight: 0xFFFFFF,
	blockIndex: 0x7FFF,
	txref: 'tx1:r7ll-llll-lte5-das'
},{
	name: 'a testnet tx with block height 467883 and pos 2355',
	chain: Txref.CHAIN_TESTNET,
	blockHeight: 467883,
	blockIndex: 2355,
	txref: 'txtest1:xk63-uqnf-zz0k-3h7'
},{
	name: 'a testnet tx with block height 0 and pos 0',
	chain: Txref.CHAIN_TESTNET,
	blockHeight: 0,
	blockIndex: 0,
	txref: 'txtest1:xqqq-qqqq-qfqz-92p'
},{
	name: 'a testnet tx with block height 0xFFFFFF and pos 0x7FFF',
	chain: Txref.CHAIN_TESTNET,
	blockHeight: 0xFFFFFF,
	blockIndex: 0x7FFF,
	txref: 'txtest1:x7ll-llll-lx34-hlw'
},{
	name: 'a testnet tx with block height 1152194 and pos 1',
	chain: Txref.CHAIN_TESTNET,
	blockHeight: 1152194,
	blockIndex: 1,
	txref: 'txtest1:xyv2-xzpq-q63z-7p4'
}]

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

		//Run test data throught the encode function
		testData.forEach((test) => {
				it('encode ' + test.name, () => {
					const txref = Txref.encode(
						test.chain,
						test.blockHeight,
						test.blockIndex,
						test.utxoIndex)
					expect(txref).to.equal(test.txref)
				})
		})

		//Run test data throught the decode function
		testData.forEach((test) => {
				it('decode ' + test.name, () => {
					const data = Txref.decode(test.txref)
					expect(data).to.contain({
						chain: test.chain,
						blockHeight: test.blockHeight,
						blockIndex: test.BlockIndex,
						test: utxoIndex
					})
				})
		})
	})
})

