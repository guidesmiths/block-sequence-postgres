var debug = require('debug')('block-sequence:postgres')
var pg = require('pg')
var _ = require('lodash').runInContext()
var safeParse = require('safe-json-parse/callback')
var async = require('async')
var fs = require('fs')
var path = require('path')
var bigInt = require('big-integer')

module.exports = function init(config, cb) {
    if (typeof Promise === 'undefined') global.Promise = require('promise-polyfill')
    if (Number.MAX_SAFE_INTEGER === undefined) Number.MAX_SAFE_INTEGER = 9007199254740991
    if (arguments.length === 1) return init({}, arguments[0])
    if (!config.url) return cb(new Error('url is required'))

    var pool = new pg.Pool({ connectionString: config.url })
    var scripts = {}

    function ensure(options, cb) {

        if (options.name === null || options.name === undefined) return cb(new Error('name is required'))

        var name = options.name.toLowerCase()
        var value = options.value || 0
        var metadata = options.metadata || {}

        // Despite best efforts to ensure postgres doesn't insert a sequence
        // if it already exists there's a race condition which can occur
        async.retry(2, function(cb) {
            pool.connect(function(err, client, release) {
                if (err) return cb(err)
                client.query(scripts['ensure'], [ name, value, JSON.stringify(metadata) ], function(err, results) {
                    release()
                    cb(err, results)
                })
            })
        }, function(err, results) {
            if (err) return cb(err)
            deserialize(results.rows[0], cb)
        })
    }

    function allocate(options, cb) {

        var size = options.size || 1

        ensure(options, function(err, sequence) {
            if (err) return cb(err)
            pool.connect(function(err, client, release) {
                if (err) return cb(err)
                client.query(scripts['allocate'], [ sequence.name, size ], function(err, results) {
                    release()
                    if (err) return cb(err)
                    deserialize(results.rows[0], function(err, sequence) {
                        if (err) return cb(err)
                        cb(null, _.chain({ next: sequence.value - size + 1, remaining: size })
                                  .defaultsDeep(sequence)
                                  .omit(['value'])
                                  .value()
                        )
                    })
                })
            })
        })
    }

    function remove(options, cb) {
        debug('Removing %s', options.name)
        if (options.name === null || options.name === undefined) return cb(new Error('name is required'))
        pool.connect(function(err, client, release) {
            if (err) return cb(err)
            client.query(scripts['remove'], [options.name.toLowerCase()], function(err) {
                release()
                cb(err)
            })
        })
    }

    function deserialize(record, cb) {
        safeParse(record.metadata, function(err, metadata) {
            // Because value is a BIGINT which could execeed Number.MAX_SAFE_INTEGER postgres returns a string.
            var value = bigInt(record.value)
            if (value.greater(Number.MAX_SAFE_INTEGER)) return cb(new Error('Sequence value exceeds Number.MAX_SAFE_INTEGER'))
            cb(err, { name: record.name, value: value.toJSNumber(), metadata: metadata })
        })
    }

    function close(cb) {
        pool.end(cb)
    }

    function loadScripts(cb) {
        fs.readdir(path.join(__dirname, 'sql'), function(err, files) {
            if (err) return cb(err)
            async.each(files, function(file, cb) {
                debug('Loading %s', file)
                fs.readFile(path.join(__dirname, 'sql', file), { encoding: 'utf-8' }, function(err, script) {
                    if (err) return cb(err)
                    scripts[path.basename(file, '.sql')] = script
                    cb()
                })
            }, cb)
        }, cb)
    }

    function createBlockSequenceTable(cb) {
        debug('Creating gs_block_sequence table')
        pool.connect(function(err, client, release) {
            if (err) return cb(err)
            client.query(scripts['create_gs_block_sequence_table'], [], function(err) {
                release()
                cb(err)
            })
        })
    }

    async.series([
        loadScripts,
        createBlockSequenceTable
    ], function(err) {
        cb(err, {
            remove: remove,
            allocate: allocate,
            ensure: ensure,
            close: close
        })
    })
}

