'use strict';

var api = require(process.cwd() + '/index.js'),
    assert = require('referee').assert,
    formatio = require('formatio');

module.exports = function () {
    var apiResponse;

    this.Given(/^the api contains no resources$/, function (callback) {
        callback();
    });

    this.When(/^the catalog is requested$/, function (callback) {
        var options = {
            method: 'GET',
            url: '/'
        };

        api.inject(options, function (response) {
            apiResponse = response;

            callback();
        });
    });

    this.Then(/^the list of links should be empty$/, function (callback) {
        assert.equals(200, apiResponse.statusCode);
        console.log(formatio.ascii(apiResponse.headers));
        callback();
    });
};
