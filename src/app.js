const Dao = require('./dao/blockcypherDao')
const BtcrReader = require('./btcrReader')
const BtcrWriter = require('./btcrWriter')

// create a dao instance
const dao = new Dao('testnet')

// create a reader using the dao
const reader = new BtcrReader(dao)

// create a writer using the dao
const writer = new BtcrWriter(dao)
