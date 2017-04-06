import Hapi = require('hapi')

import loadConfig from './config'
import * as Routes from './routes'

const config = loadConfig()

const server = new Hapi.Server()
server.connection({
    host: 'localhost',
    port: config.port,
    routes: {
        cors: true
    }
})

Routes.push('GitHub Access Token', '/oauth/github/access_token')

Routes.regsiter(server)

server.start((err) => {
    if (err) {
        throw err
    }
    console.log(`Server running at: ${server.info.uri}`);
})
