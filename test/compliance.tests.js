var complianceTests = require('block-sequence-compliance-tests')
var BlockSequence = require('../index')

BlockSequence({ url: 'postgres://postgres@localhost:5432/postgres' }, function(err, blockSequence) {
    if (err) throw err
    complianceTests(blockSequence).onFinish(blockSequence.close)
})
