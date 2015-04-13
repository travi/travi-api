'use strict';

var api = require(process.cwd() + '/index.js'),
    assert = require('referee').assert;

module.exports = function () {
    var apiResponse,
        baseUrl = 'http://' + api.info.host;

    this.Given(/^the api contains no resources$/, function (callback) {
        callback();
    });

    this.When(/^the catalog is requested$/, function (callback) {
        api.inject({
            method: 'GET',
            url: '/'
        }, function (response) {
            apiResponse = response;

            callback();
        });
    });

    this.Then(/^the catalog should include top level links$/, function (callback) {
        assert.equals(200, apiResponse.statusCode);
        assert.equals(
            JSON.parse(apiResponse.payload)._links,
            {
                self: { href: baseUrl + '/' },
                hello: { href: '/hello' }
            }
        );

        callback();
    });
};
