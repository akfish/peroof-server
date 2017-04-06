import request = require('request')
import { OAuthPayload, OAuthUserPayload, extendPayload } from './payload'
import { isGitHubAccessToken, isGitHubErrorResponse, GitHubResponse, GitHubAccessToken, GitHubErrorResponse } from './response'

import loadConfig from '../../../config'
const config = loadConfig()

const GITHUB_OAUTH_BASE_URL = 'github.com'
const GITHUB_OAUTH_ACCESS_TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token'

export class GitHubError extends Error {
    constructor(public raw: GitHubErrorResponse) {
        super(raw.error_description)
    }
}

export function getAccessToken(payload: OAuthPayload, cb: (err: Error, token?: GitHubAccessToken) => void) {
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

