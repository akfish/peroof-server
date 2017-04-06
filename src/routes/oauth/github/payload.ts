import defaults = require('lodash/defaults')
import loadConfig from '../../../config'
const config = loadConfig()

export interface OAuthUserPayload {
    code: string
    state: string
}

export interface OAuthPayload extends OAuthUserPayload {
    client_id: string
    client_secret: string
}

export function extendPayload(payload: OAuthUserPayload): OAuthPayload {
    return defaults({}, config.github, payload)
}

