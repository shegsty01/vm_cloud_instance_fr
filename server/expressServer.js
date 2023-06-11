const  { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');
const express = require('express')
const {PubSub} = require('graphql-subscriptions')
const nodeCron = require("node-cron")
const defaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
}
const {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  gql,
} = require("@apollo/client");
const link = createHttpLink({
  uri: "http://localhost:4000/graphql",
  credentials: "include",
  //defaultOptions: defaultOptions,
});
const client = new ApolloClient({
link,
cache: new InMemoryCache(),
 defaultOptions : {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
}
});
const {
  // GraphQLUpload,
  graphqlUploadExpress, // A Koa implementation is also exported.
} = require('graphql-upload');
const { createServer } = require('http');
const  { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const  { WebSocketServer } = require('ws');
const  { useServer } = require('graphql-ws/lib/use/ws');
const resolvers = require('../resolver/resolver.js')
const typeDefs = require('../typedefs/typedefs.js')
const app = express()
const { makeExecutableSchema } =  require('@graphql-tools/schema');
const httpServer = createServer(app)
// Creating the WebSocket server
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

let schema = makeExecutableSchema({ typeDefs, resolvers });

const serverCleanup = useServer({ schema,
  
    onConnect:(ctx)=>{
     console.log(ctx,ctx.connectionParams)
     if (!(ctx.connectionParams.authentication)) {
      // You can return false to close the connection  or throw an explicit error
      throw new Error('Auth token missing!');
    }
    }
   }, wsServer);
const models = require('../models/index.js')
//const { ApolloServer, gql } = require('apollo-server-express')
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');

const { expressMiddleware } = require('@apollo/server/express4');
const port = 4000
const session = require('express-session')
let RedisStore = require('connect-redis')(session)
//const redisClient = redis.createClient(6379,'127.0.0.1')
const redisClient = require('./redisClient.js')
const cors = require("cors")
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser')



let server = null
const startServer = async () =>{
   server = new ApolloServer({
        typeDefs,
        resolvers,
         //uploads:false,
        //context: ({req,res})=>({req,res}),
        credentials: 'include',
        plugins: [
         ApolloServerPluginLandingPageGraphQLPlayground({
            // options
          }),

    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
        ]
        
    });
    
    await server.start()
   
    //apolloServer.applyMiddleware({ app ,cors:false});
    app.use(
      '/graphql',
      cors({
        origin:"http://localhost:3000",
       credentials:true
     }),
      expressMiddleware(server, {
        context: ({req,res})=>({req,res}),
      }),
    );
    
}
startServer()

    // apolloServer.applyMiddleware({ app ,cors:false});
    // const { url } = await startStandaloneServer(apolloServer, {
    //    context: ({req,res})=>({req,res}),
    //   listen: { port: 4000 },
    
    // });
   // console.log(`listening at port ${url}`)


app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

// app.use((req,res,next)=>{
//   res.append('Cross-Origin-Opener-Policy','same-origin')
//   res.append('Cross-Origin-Embedder-Policy','require-corp')
//   next()
// })
app.use(
  graphqlUploadExpress({maxFileSize:100000000000000000,maxFiles:10})
)


//app.use()
app.use(
  session({
    name: 'id',
    store: new RedisStore({
      client: redisClient,
      disableTouch: true,
      // host:'localhost',
      // port:6379,
    }),
    cookie: {
      maxAge: 1000000000000000, //long time
      httpOnly: true,
      secure: false,  //cookie only works in https (we are developing)samesite lax vs none
//sameSite: "none"
    },
    saveUninitialized: false,
    secret: 'boomroasted', //you would want to hide this in productionresave false/none lax/true
    resave: true
  })
)





 models.sequelize.authenticate();
 models.sequelize.sync();

// app.get("/rest", function (req, res) {
//   res.json({ data: "api working" });
// });

let svr = httpServer.listen(4000, function () {
  console.log(`Server ready at http://localhost:${port}`)
});

//59 59 23 * * *

const job = nodeCron.schedule("59 59 23 * * *", async function killCheapSkates() {
  // Do whatever you want in here. Send email, Make  database backup or download data.
  await client
  .query({
    query: gql`
      query myQuery {
        leCronJob
      }
      
    `,
  }).then((result)=>{
    console.log(result)
  }).catch((error)=>{
    console.log(error)
  })
  console.log("cronning rn...")
});


//svr.keepAliveTimeout = 72000000
// app.post('/isolateOrigin', function (req, res) {
//   res.send('Using Corp')
// })





