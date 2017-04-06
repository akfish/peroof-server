import { Server, IRouteConfiguration } from 'hapi'
import loadConfig from '../config'
import snakeCase = require('lodash/snakeCase')

interface RouteDescriptor {
    name: string
    path: string
}

let routes: IRouteConfiguration[] = []

let descs: RouteDescriptor[] = []

/**
 * Push a route to register later.
 * Routes structure should be the same as they are in src/routes folder
 * @param server Hapi.Server instance
 * @param name Name for the route
 * @param path Path of route (starting with /). 
 */
export function push(name: string, path: string) {
    console.log(`Push route ${name}: ${path}`)
    let route: IRouteConfiguration = require(`.${path}`)
    route.path = path
    routes.push(route)
    descs.push({
        name,
        path
    })
}

function makeRootRoute(): IRouteConfiguration {
    return {
        path: '/',
        method: 'get',
        handler: (request, reply) => {
            let { uri } = request.connection.info
            reply(buildEndpointList(uri))
        }
    }

    function buildEndpointList(baseUri: string) {
        let endpointList: Object = {}

        descs.forEach(({ name, path }) => {
            endpointList[`${snakeCase(name.toLowerCase())}_url`] =
                `${baseUri}${path}`
        })

        return endpointList
    }
}
export function regsiter(server: Server) {
    // Register each routes
    routes.forEach((r) => {
        console.log(`Register route: ${r.path}`)
        server.route(r)
    })
    // Register root route
    console.log('Register route: /')
    server.route(makeRootRoute())
}