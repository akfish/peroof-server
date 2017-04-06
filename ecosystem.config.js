var REPO_URL = 'https://github.com/akfish/peroof-server.git'
var HOST = 'do.ak.fish' 
var USER = 'node'
var KEY_FILE = './keys/do_node_private.pem'
var PROD_DEPLOY_PATH = '~/.peroof/production'
var DEV_DEPLOY_PATH = '~/.peroof/development'
var PROD_REF = 'origin/master'
var DEV_REF = 'origin/master'

module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    {
      name      : 'GitHub OAuth Proxy',
      script    : 'lib/index.js',
      env: {
        configFile: '/home/node/.peroof/config.json'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      env_dev: {
        NODE_ENV: 'development'
      }
    }
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      user : USER,
      key  : KEY_FILE,
      host : HOST,
      ref  : PROD_REF,
      repo : REPO_URL,
      path : PROD_DEPLOY_PATH,
      'post-deploy' : 'yarn install && pm2 reload ecosystem.config.js --env production'
    },
    dev : {
      user : USER,
      key  : KEY_FILE,
      host : HOST,
      ref  : DEV_REF,
      repo : REPO_URL,
      path : DEV_DEPLOY_PATH,
      'post-deploy' : 'yarn install && pm2 reload ecosystem.config.js --env dev',
    }
  }
}
