import Hapi = require('hapi')
import Redis = require('redis')
import Bluebird = require('bluebird')
import Boom = require('boom')

Bluebird.promisifyAll((<any>Redis).RedisClient.prototype)
Bluebird.promisifyAll((<any>Redis).Multi.prototype)

import loadConfig from '../config'
const config = loadConfig()

const redisClient = Redis.createClient(config.redis)

const plugin = {
    register: require('hapi-rate-limiter'),
    options: {
        redisClient,
        defaultRate: () => config.rateLimit, 
        overLimitError: (rate) => Boom.tooManyRequests(`Too many requests. Retry in ${rate.window} seconds.`),
        rateLimitKey: (request: Hapi.Request) => request.info.remoteAddress
    }
}

export = plugin