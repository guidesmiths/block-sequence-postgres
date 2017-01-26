# block-sequence-postgres
A PostgreSQL implementation of [block-sequence](https://www.npmjs.com/package/block-sequence).

[![NPM version](https://img.shields.io/npm/v/block-sequence-postgres.svg?style=flat-square)](https://www.npmjs.com/package/block-sequence-postgres)
[![NPM downloads](https://img.shields.io/npm/dm/block-sequence-postgres.svg?style=flat-square)](https://www.npmjs.com/package/block-sequence-postgres)
[![Build Status](https://img.shields.io/travis/guidesmiths/block-sequence-postgres/master.svg)](https://travis-ci.org/guidesmiths/block-sequence-postgres)
[![Code Climate](https://codeclimate.com/github/guidesmiths/block-sequence-postgres/badges/gpa.svg)](https://codeclimate.com/github/guidesmiths/block-sequence-postgres)
[![Test Coverage](https://codeclimate.com/github/guidesmiths/block-sequence-postgres/badges/coverage.svg)](https://codeclimate.com/github/guidesmiths/block-sequence-postgres/coverage)
[![Code Style](https://img.shields.io/badge/code%20style-imperative-brightgreen.svg)](https://github.com/guidesmiths/eslint-config-imperative)
[![Dependency Status](https://david-dm.org/guidesmiths/block-sequence-postgres.svg)](https://david-dm.org/guidesmiths/block-sequence-postgres)
[![devDependencies Status](https://david-dm.org/guidesmiths/block-sequence-postgres/dev-status.svg)](https://david-dm.org/guidesmiths/block-sequence-postgres?type=dev)

## Usage
```js
var BlockArray = require('block-sequence').BlockArray
var init = require('block-sequence-postgres')

// Initialise the PostgreSQL Block Sequence Driver
init({ url: 'postgres://username:password@localhost/bs_test' }, function(err, driver) {
    if (err) throw err

    // Ensure the sequence exists
    driver.ensure({ name: 'my-sequence' }, function(err, sequence) {
        if (err) throw err

        // Create a block array containing 1000 ids per block (defaults to 2 blocks)
        var idGenerator = new BlockArray({ block: { sequence: sequence, driver: driver, size: 1000 } })

        // Grab the next id
        idGenerator.next(function(err, id) {
            if (err) throw err
            console.log(id)
        })
    })
})
```
See https://www.npmjs.com/package/pg for all connection parameters



