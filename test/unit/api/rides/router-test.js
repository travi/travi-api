'use strict';

var path = require('path'),
    any = require(path.join(__dirname, '../../../helpers/any-for-api')),
    Joi = require('joi'),
    deepFreeze = require('deep-freeze'),
    _ = require('lodash'),
    router = require(path.join(__dirname, '../../../../lib/api/router')),
    controller = require(path.join(__dirname, '../../../../lib/api/rides/controller')),
    errorMapper = require(path.join(__dirname, '../../../../lib/api/error-response-mapper'));

suite('ride router', function () {
    const requestNoAuth = deepFreeze({auth: {}});
    var handlers = {},
        prepare,
        server = {route: function () {
            return;
        }};

    setup(function () {
        sinon.stub(server, 'route', function (definition) {
            if (definition.path === '/rides') {
                handlers.list = definition.handler;
                prepare = definition.config.plugins.hal.prepare;
            } else if (definition.path === '/rides/{id}') {
                handlers.ride = definition.handler;
            }
        });
        sinon.stub(errorMapper, 'mapToResponse');
    });

    teardown(function () {
        errorMapper.mapToResponse.restore();
        server.route.restore();
        handlers = {};
        prepare = null;
    });

    suite('list route', function () {
        setup(function () {
            sinon.stub(controller, 'getList');
        });

        teardown(function () {
            controller.getList.restore();
        });

        test('that list route defined correctly', function () {
            var next = sinon.spy();
            router.register(server, null, next);

            assert.calledWith(server.route, sinon.match({
                method: 'GET',
                path: '/rides',
                config: {
                    tags: ['api'],
                    plugins: {
                        hal: {
                            api: 'rides'
                        }
                    }
                }
            }));
            assert.calledOnce(next);
        });

        test('that the list route gets gets data from controller', function () {
            var reply = sinon.spy(),
                data = {foo: 'bar'};
            controller.getList.yields(null, data);
            router.register(server, null, sinon.spy());

            handlers.list(requestNoAuth, reply);

            assert.calledWith(reply, data);
        });

        test('that scopes are passed to controller for request with authorization', function () {
            var reply = sinon.spy(),
                scopes = any.listOf(any.string);
            router.register(server, null, sinon.spy());

            handlers.list({
                auth: {
                    credentials: {scope: scopes}
                }
            }, reply);

            assert.calledWith(controller.getList, scopes);
        });

        test('that list is formatted to meet hal spec', function () {
            var next = sinon.spy(),
                rep = {
                    entity: {
                        rides: [
                            {id: any.int()},
                            {id: any.int()},
                            {id: any.int()}
                        ]
                    },
                    embed: sinon.spy(),
                    ignore: sinon.spy()
                };
            router.register(server, null, sinon.spy());

            prepare(rep, next);

            sinon.assert.callCount(rep.embed, rep.entity.rides.length);
            _.each(rep.entity.rides, function (ride) {
                assert.calledWith(rep.embed, 'rides', './' + ride.id, ride);
            });
            assert.calledWith(rep.ignore, 'rides');
            assert.calledOnce(next);
        });

        test('that error mapped when list request results in error', function () {
            var reply = sinon.spy(),
                err = {};
            router.register(server, null, sinon.spy());
            controller.getList.yields(err);

            handlers.list(requestNoAuth, reply);

            assert.calledWith(errorMapper.mapToResponse, err, reply);
            refute.called(reply);
        });
    });

    suite('ride route', function () {
        setup(function () {
            sinon.stub(controller, 'getRide');
        });

        teardown(function () {
            controller.getRide.restore();
        });

        test('that individual route defined correctly', function () {
            router.register(server, null, sinon.spy());

            assert.calledWith(server.route, sinon.match({
                method: 'GET',
                path: '/rides/{id}',
                config: {
                    tags: ['api'],
                    validate: {
                        params: {
                            id: Joi.string().required()
                        }
                    }
                }
            }));
        });

        test('that ride returned from controller', function () {
            var id = any.int(),
                reply = sinon.spy(),
                ride = {id: id};
            controller.getRide.withArgs(id).yields(null, ride);
            router.register(server, null, sinon.spy());

            handlers.ride({params: {id: id}}, reply);

            assert.calledWith(reply, ride);
        });

        test('that error mapped when ride request results in error', function () {
            var id = any.int(),
                setContentType = sinon.spy(),
                setResponseCode = sinon.stub().returns({type: setContentType}),
                reply = sinon.stub().withArgs().returns({code: setResponseCode}),
                err = {notFound: true};
            controller.getRide.withArgs(id).yields(err, null);
            router.register(server, null, sinon.spy());

            handlers.ride({params: {id: id}}, reply);

            assert.calledWith(errorMapper.mapToResponse, err, reply);
        });
    });
});