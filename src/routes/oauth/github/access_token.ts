import Hapi = require('hapi')
import Joi = require('joi')
import Boom = require('boom')
import pick = require('lodash/pick')
import { GitHubError, getAccessToken } from './request'
import { OAuthUserPayload, extendPayload } from './payload'

const route: Hapi.IRouteConfiguration = {
    path: '',
    method: 'post',
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
                    console.error(err)
                }
                reply(boom)
            } else {
                console.log(token)
                reply(token)
            }
        })
    }

}

export = route