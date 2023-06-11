
 

/* abstract */ class MessageStore {
    saveMessage(message) {}
    findMessagesForUser(userID) {}
  }
const CONVERSATION_TTL = 24 * 60 * 600000000;

class RedisMessageStore extends MessageStore {
  constructor(redisClient) {
    super();
    this.redisClient = redisClient;
  }

  saveMessage(message) {
    console.log("saving!!!!!")
    const value = JSON.stringify(message);
    this.redisClient
      .multi()
      .rpush(`messages:${message.from}`, value)
      .rpush(`messages:${message.to}`, value)
      .expire(`messages:${message.from}`, CONVERSATION_TTL)
      .expire(`messages:${message.to}`, CONVERSATION_TTL)
      .exec();
  }

  findMessagesForUser(userID) {
    console.log("finding messageas",userID)
    return this.redisClient
      .lrange(`messages:${userID}`, 0, -1)
      .then((results) => {
        console.log("RESULTS DAMMIYT",results)
        return results.map((result) => JSON.parse(result));
      }) || [];
      console.log(found,"F O U N D")
      return found
  }
}

module.exports = RedisMessageStore