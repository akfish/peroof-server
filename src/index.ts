import Hapi = require('hapi')
import Joi = require('joi')
import Boom = require('boom')
import defaults = require('lodash/defaults')
import pick = require('lodash/pick')
import querystring = require('querystring')
import request = require('request')

import nconf = require('nconf')

nconf.argv()
    .env()
    .defaults({
        configFile: './config.json',
        port: 3333
    })
    .file({
        file: nconf.get('configFile')
    })

const server = new Hapi.Server()

interface Config {
    port: number
    github: {
        client_id: string
        client_secret: string
        timeout: number
    }
}

const config: Config = {
    port: nconf.get('port'),
    github: nconf.get('github')
}

const CONFIG_SCHEMA = Joi.object().keys({
    port: Joi.number().min(1).max(65535).required(),
    github: Joi.object().keys({
        client_id: Joi.string().min(1).required().not('YOUR_CLIENT_ID'),
        client_secret: Joi.string().min(1).required().not('YOUR_CLIENT_SECRET'),
        timeout: Joi.number()
    }).required()
})

function validateConfig(config: Config) {
    let { error } = Joi.validate(config, CONFIG_SCHEMA)
    if (error) throw error
}

validateConfig(config)

server.connection({
    host: 'localhost',
    port: config.port,
    routes: {
        cors: true
    }
})

interface OAuthUserPayload {
    code: string
    state: string
}

interface OAuthPayload extends OAuthUserPayload {
    client_id: string
    client_secret: string
}

function extendPayload(payload: OAuthUserPayload): OAuthPayload {
    return defaults({}, config.github, payload)
}

const GITHUB_OAUTH_BASE_URL = 'github.com'
const GITHUB_OAUTH_ACCESS_TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token'

interface GitHubAccessToken {
    token_type: string
    scope: string
    access_token: string
}

interface GitHubErrorResponse {
    error: string
    error_description: string
    error_uri: string
}

type GitHubResponse = GitHubAccessToken | GitHubErrorResponse

class GitHubError extends Error {
    constructor(public raw: GitHubErrorResponse) {
        super(raw.error_description)
    }
}

function isGitHubAccessToken(res: any): res is GitHubAccessToken {
    return typeof res === 'object'
        && typeof res.token_type === 'string'
        && typeof res.scope === 'string'
        && typeof res.access_token === 'string'
}

function isGitHubErrorResponse(res: any): res is GitHubErrorResponse {
    return typeof res === 'object'
        && typeof res.error === 'string'
        && typeof res.error_description === 'string'
        && typeof res.error_uri === 'string'
}


function getAccessToken(payload: OAuthPayload, cb: (err: Error, token?: GitHubAccessToken) => void) {
    request.post(GITHUB_OAUTH_ACCESS_TOKEN_ENDPOINT, {
        headers: {
            'Accept': 'application/json'
        },
        timeout: config.github.timeout,
        form: payload
    }, (err, response, body) => {
        console.log('Got response')
        if (err) return cb(err)
        try {
            let ghr: GitHubResponse = JSON.parse(body)
            console.log(ghr)
            if (isGitHubAccessToken(ghr)) {
                cb(null, ghr)
            } else if (isGitHubErrorResponse(ghr)) {
                cb(new GitHubError(ghr))
            } else {
                cb(new TypeError('Invalid server response format'))
            }

        } catch (e) {
            cb(e)
        }
    })
}

server.route({
    method: 'post',
    path: '/oauth/github/access_token',
    config: {
        validate: {
            payload: {
                code: Joi.string().min(1),
                state: Joi.string().min(1)
            }
        }
    },
    handler: (request, reply) => {
        let payload = extendPayload(<OAuthUserPayload>pick(request.payload, 'state', 'code'))
        server.log('info', request.payload)
        console.log(request.payload)
        getAccessToken(payload, (err, token) => {
            if (err) {
                let message = err.message
                let boom: Boom.BoomError
                if (err instanceof GitHubError) {
                    let { raw } = err
                    switch (raw.error) {
                        case 'incorrect_client_credentials':
                            boom = Boom.unauthorized(message, raw)
                            break
                        case 'redirect_uri_mismatch':
                        case 'bad_verification_code':
                            boom = Boom.badRequest(message, raw)
                            break
                    }
                    server.log('error', raw)
                    console.error(raw)
                } else {
                    let t = + new Date()
                    let { code } = <NodeJS.ErrnoException>err
                    switch (code) {
                        case 'ETIMEDOUT':
                        case 'ECONNREFUSED':
                        case 'ECONNRESET':
                            boom = Boom.gatewayTimeout(`Failed to communicate with GitHub API server [${code}]`)
                            break
                        default:
                            boom = Boom.badImplementation('Internal Server Error', { error: 'internal_error', t })
                            break
                    }
                    server.log('error', err, t)
                    console.error(err)
                }
                reply(boom)
            } else {
                server.log('info', token)
                console.log(token)
                reply(token)
            }
        })
    }
})

server.start((err) => {
    if (err) {
        throw err
    }
    console.log(`Server running at: ${server.info.uri}`);
})
