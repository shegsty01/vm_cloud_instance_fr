const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
  maxHttpBufferSize: 1e8 // 100 MB.
}).listen(5000);
const fs = require('fs');
//const redisClient = require('./redisClient')
const Redis = require("ioredis");
const redisClient = new Redis(6379, "localhost")
const sesh = require('./redisStore')
const mesh = require('./messageStore')
const sessionStore = new sesh(redisClient)
const messageStore = new mesh(redisClient)

//console.log(sessionStore)

const {v4:uuid } = require('uuid');

const randomId = () =>{
  
  return uuid()
}



//register middleware here
io.use(async (socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  //console.log("sessionID from the client:Middleware",sessionID)
  if (sessionID) {
    const session = await sessionStore.findSession(sessionID);
    if (session) {
      console.log(session,"AFTER SESSION FOUND")
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.name = session.name;
      //clear me in case of redundancy
      let foundMessages = await messageStore.findMessagesForUser(socket.userID)
           socket.emit("msgs", foundMessages);
      return next();
    }
  }

    
     const username = socket.handshake.auth.name;
     console.log(username,"username here",sessionID)
     
    if (!username) {
      return next(new Error("invalid username"));
       console.log(socket.handshake.auth.username)
    }
   
    socket.name = username;
    socket.userID = randomId()
    socket.sessionID = randomId()
  console.log(socket.name,socket.userID,socket.sessionID)
  next();
});

io.on('connection',async (sock)=>{
  console.log(sock.sessionID)
    sessionStore.saveSession(sock.sessionID, {
      userID: sock.userID,
      name: sock.name,
      connected: true,
    });
    ///look at this shit

  sock.join(sock.userID)
  //console.log("SESSION",sock.sessionID)

  sock.on("private message", ({ content,to,name}) => {
    const message = { content,
      from: sock.userID,
      to
    }

    if(typeof content !== 'object'){
    sock.to(to).emit("emitted", {
      content,
      from: sock.userID,
    });
    messageStore.saveMessage(message);
  }
  else{
    //console.log(content)
    let uploadDir = "./public/chat"
    let path =`${uploadDir}/${name}`
    let chatpath = `/chat/${name}`
    if(!fs.existsSync(path)){
        
    let writer = fs.createWriteStream(path,
      {encoding:'base64'
  })

  //console.log(content)
 writer.write(content);
 writer.end();

 writer.on("finish",()=>{
  const message1 = {
    content:chatpath,
      from: sock.userID,
      to
  }
  console.log(path,chatpath,sock.userID)
  sock.to(to).emit("emitted", {
    content:{content},
    from: sock.userID,
  });
  messageStore.saveMessage(message1);
 }
 )
 return
}
  const message1 = {
    content:chatpath,
      from: sock.userID,
      to
  }
  sock.to(to).emit("emitted", {
    content:{content},
    from: sock.userID,
  });

  console.log(path,chatpath,sock.userID)

  messageStore.saveMessage(message1);
    
  }
    //console.log(content ,"from:",to)
  });
     
    sock.on("message",(message) =>{
      console.log(message)
    })

    sock.emit("session", {
      sessionID: sock.sessionID,
      userID: sock.userID,
      target:sock.target
    });

    const users = [];
    const msgs = []
    for (let [id, socket] of io.of("/").sockets) {
      users.push({
        userid: socket.userID,
        sessionID:socket.sessionID,
        userID: id,
        name: socket.name,
      });
    }
    
       //console.log(users)
     
       console.log(sock.userID,"session",sock.target)
        let foundMessages = await messageStore.findMessagesForUser(sock.userID)
     
      
      
      // msgs.concat(messagesPerUser.get(`${sock.userID}`))
       //console.log(messagesPerUser.get(`${sock.target}`))


       //console.log(messagesPerUser.get("87f14ffd-c90e-4f97-b178-a5f631f07be7"),"87f14ffd-c90e-4f97-b178-a5f631f07be7")
       //console.log(messagesPerUser.get("ddabd129-8873-4c42-b3b4-3e0d5183c7e6"),"ddabd129-8873-4c42-b3b4-3e0d5183c7e6",sock.userID)
       //  sessionStore.findAllSessions().forEach((session) => {
      //    users.push({
      //      userID: session.userID,
      //      username: session.username,
      //      connected: session.connected,
      //      messages: messagesPerUser.get(session.userID) || [],
      //    });
      //  });
     sock.emit("msgs", foundMessages);
     //stop emitting and filtering based on friendship

     
    // notify users
    // sock.broadcast.emit("user connected", {
    //   userid: sock.userID,
    //   sessionID:sock.sessionID,
    //   username: sock.name,
    //   userID: sock.id,
    // });
})

// io.on("connection", (socket) => {
//   const users = [];
//   for (let [id, socket] of io.of("/").sockets) {
//     users.push({
//       userID: id,
//       username: socket.username,
//     });
//   }
  
     

//   socket.emit("users", users);
//   // notify users
//   socket.broadcast.emit("user connected", {
//     userID: socket.id,
//     username: socket.username,
//   });
// });




//array of users push new users on connection

//for loop creating separate channels w namespaces for each authenticated user( namespaces will be identified by unique ids assigned at signUp)


//client side gets all profile_user members and their signUp UUIDs and join the appropriate namespaces

//server side alerts client-side as to the profile_users currently online


//or filter users on the frontend instead using no unique namespace ("/" namespace)

// io.on("connection", (socket) => {
//   const users = [];
//   for (let [id, socket] of io.of("/").sockets) {
//     users.push({
//       userID: id,
//       username: socket.username,
//     });
//   }
  
     

//   socket.emit("users", users);
//   // notify users
//   socket.broadcast.emit("user connected", {
//     userID: socket.id,
//     username: socket.username,
//   });
// });