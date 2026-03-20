
module.exports = {
  apps: [{
    name: 'relay-api',


    script: 'dist/index.js',


    instances: '4',
    exec_mode: 'cluster',


    autorestart: true,


    max_memory_restart: '500M',


    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      SHARDS: 'shard-0,shard-1,shard-2',
      SHARD_0: 'postgres://postgres:secret@localhost:5435/ReLay',
      SHARD_1: 'postgres://postgres:secret@localhost:5433/ReLay',
      SHARD_2: 'postgres://postgres:secret@localhost:5434/ReLay',
    }
  }]
};