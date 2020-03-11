const expect = require('chai').expect
const Txref = require('../src/txref')

describe('Txref',() => {

	describe('Txref.encode',() => {
		
		it('should throw an error on invalid chain', () => {
			try{
				Txref.encode('invalid')
			}catch(e){
				expect(e.message).to.equal('Invalid chain')
			}
		})
	})

})
