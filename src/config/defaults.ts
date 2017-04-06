import { Config } from './'
const defaults: Partial<Config> = {
    configFile: './config.json',
    port: 3333,
    redis: {
        port: 6379,
        host: 'localhost'
    }
}

export default defaults