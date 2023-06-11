
 let redis = require('redis')

const redisClient = redis.createClient(6379,'localhost')

redisClient.on('connect', ()=>{
  console.log("connected to redis")
})

redisClient.on('error', (err) => {
     console.log('error encountered', err.toString())
     
 })

module.exports = redisClient