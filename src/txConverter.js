const Txref = require('./txref')
const Bech32hrp = require('./bech32hrp')
const { DaoType, DaoFactory } = require('./dao/daoFactory')

const PROVIDER = DaoType.BLOCKCYPHER

const txrefDecode = (txref) => {
    return Txref.decode(txref)
}

const txrefEncode = (chain, blockHeight, txPos, utxoIndex) => {
    return Txref.encode(chain, blockHeight, txpos, utxoIndex) 
}

const getTxDetails = async (txid, chain, utxoIndex) => {

    const dao = DaoFactory(PROVIDER, chain)
    const tx = await dao.getTxById(txid)

    return tx

}

const txidToTxref = async (txid, chain, utxoIndex) => {

    const tx = txDetailsFromTxid(txid, chain, utxoIndex)
    const txref = Txref.encode(chain, tx.block_height, tx.block_index, utxoIndex)

    return txref

}

const txrefToTxid = (txref) => {

    const tx = txDetailsFromTxref(txref)

    return tx.txid
}

const txDetailsFromTxid = async (txid, chain, utxoIndex) => {

    const dao = DaoFactory(PROVIDER, chain)
    const tx = await dao.getTxById(txid)

    return tx
}

const txDetailsFromTxref = (txref) => {

    const txdata = Txref.decode(txref)
    const dao = DaoFactory(PROVIDER, txdata.chain)
    const tx = dao.getTxByBlock(txdata.block_height, txdata.block_index)

    return tx

}

module.exports = {
  txrefDecode: txrefDecode,
  txrefEncode: txrefEncode,
  txidToTxref: txidToTxref,
  txrefToTxid: txrefToTxid,
  getTxDetails: getTxDetails,
  txDetailsFromTxid: txDetailsFromTxid,
  txDetailsFromTxref: txDetailsFromTxref,
  MAGIC_BTC_MAINNET: Txref.TYPE_MAINNET,
  MAGIC_BTC_TESTNET: Txref.TYPE_TESTNET,
  TXREF_BECH32_HRP_MAINNET: Bech32hrp.BTC_MAINNET,
  TXREF_BECH32_HRP_TESTNET: Bech32hrp.BTC_TESTNET,
  CHAIN_MAINNET: Bech32hrp.BTC_MAINNET,
  CHAIN_TESTNET: Bech32hrp.BTC_TESTNET
};
