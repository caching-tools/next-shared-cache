const { RemoteCacheHandler } = require('handler-redis');

RemoteCacheHandler.connect().then(() => {
    console.log('redis connected');
});

module.exports = RemoteCacheHandler;
