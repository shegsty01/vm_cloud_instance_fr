class SessionStore {
  findSession(id) {}
  saveSession(id, session) {}
  findAllSessions() {}
}
const SESSION_TTL = 24 * 60 * 6000000000000;
const mapSession = ([userID, name, connected]) =>
  userID ? { userID, name, connected: connected === "true" } : undefined;
  
class RedisSessionStore extends SessionStore {
    constructor(redisClient) {
      super();
      this.redisClient = redisClient;
      //SESSION_TTL
    }
  
    findSession(id) {
      console.log("finding the session with the id:",id)
      return this.redisClient
        .hmget(`session:${id}`, "userID", "name", "connected")
        .then(mapSession);
        
    }
  
    saveSession(id, { userID, name, connected }) {
      this.redisClient
        .multi()
        .hset(
          `session:${id}`,
          "userID",
          userID,
          "name",
          name,
          "connected",
          connected
        ).expire(`session:${id}`, SESSION_TTL).exec();
        console.log("session has been saved",userID,name,connected)
    }
  
    async findAllSessions() {
      const keys = new Set();
      let nextIndex = 0;
      do {
        const [nextIndexAsStr, results] = await this.redisClient.scan(
          nextIndex,
          "MATCH",
          "session:*",
          "COUNT",
          "100"
        );
        nextIndex = parseInt(nextIndexAsStr, 10);
        results.forEach((s) => keys.add(s));
      } while (nextIndex !== 0);
      const commands = [];
      keys.forEach((key) => {
        commands.push(["hmget", key, "userID", "name", "connected"]);
      });
      return this.redisClient
        .multi(commands)
        .exec()
        .then((results) => {
          return results
            .map(([err, session]) => (err ? undefined : mapSession(session)))
            .filter((v) => !!v);
        });
    }
  }

  module.exports = RedisSessionStore