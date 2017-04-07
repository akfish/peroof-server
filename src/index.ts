import Hapi = require('hapi')

import loadConfig from './config'
import * as Routes from './routes'

const config = loadConfig()

const server = new Hapi.Server()
server.connection({
    host: 'localhost',
    port: config.port,
    routes: {
        cors: {
            origin: ['*'],
            additionalExposedHeaders: [
                'X-Rate-Limit-Limit',
                'X-Rate-Limit-Remaining',
                'X-Rate-Limit-Reset',
            ] 
        }
    }
})

// Routes
Routes.push('GitHub Access Token', '/oauth/github/access_token')
Routes.regsiter(server)

// Plugins
server.register([
    require('./plugins/rate-limitter')
])

server.start((err) => {
    if (err) {
        throw err
    }
    console.log(`Server running at: ${server.info.uri}`);
})
