module.exports = {
    apps: [
        {
            name: 'app',
            script: '.next/__instances/3000/server.js',
            instances: 2,
            exec_mode: 'cluster',
            env_production: {
                NODE_ENV: 'production',
                HOSTNAME: 'localhost',
                REDIS_URL: 'redis://localhost:6379',
                SERVER_STARTED: '1',
            },
        },
    ],
};
