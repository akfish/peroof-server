import Joi = require('joi')
import nconf = require('nconf')
import { ClientOpts } from 'redis'

import defaults from './defaults'
import cloneDeep = require('lodash/cloneDeep')

export interface APIRateLimit {
    limit: number
    window: number
}

export interface Config {
    configFile?: string
    host?: string
    port: number
    github: {
        client_id: string
        client_secret: string
        timeout: number
    }
    redis: ClientOpts
    rateLimit: APIRateLimit
}

export const CONFIG_SCHEMA = Joi.object().keys({
    port: Joi.number().min(1).max(65535).required(),
    github: Joi.object().keys({
        client_id: Joi.string().min(1).required().not('YOUR_CLIENT_ID'),
        client_secret: Joi.string().min(1).required().not('YOUR_CLIENT_SECRET'),
        timeout: Joi.number()
    }).required(),
    host: Joi.string(),
    redis: Joi.object().keys({
        host: Joi.string().min(1),
        port: Joi.number().min(1).max(65535)
    }),
    rateLimit: Joi.object().keys({
        limit: Joi.number().min(0).required(),
        window: Joi.number().min(0).required(),
    })
})

export function validateConfig(config: Config) {
    let { error } = Joi.validate(config, CONFIG_SCHEMA)
    if (error) throw error
}

let config: Config

export function sanitize(config: Config) {
    let cfg = cloneDeep(config)
    cfg.github.client_secret = '[HIDDEN]'
    return cfg
}

export default function loadConfig() {
    if (!config) {
        nconf.argv()
            .env()
            .defaults(defaults)
            .file({
                file: nconf.get('configFile')
            })

        config = {
            host: nconf.get('host'),
            port: nconf.get('port'),
            github: nconf.get('github'),
            redis: nconf.get('redis'),
            rateLimit: nconf.get('rateLimit')
        }

        console.log('Loaded Config:')

        console.log(JSON.stringify(sanitize(config), null, 2))

        validateConfig(config)
    }

    return config
}

