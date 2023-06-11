const {
    GraphQLUpload,
    //graphqlUploadExpress, // A Koa implementation is also exported.
  } = require('graphql-upload');
  const models = require("../models/index.js");
  const {PubSub,withFilter} = require('graphql-subscriptions')
  
  const Redis = require("ioredis");
  const sesh = require('../server/redisStore')
  const  Collection = require('./Collections');
  const { v4: uuidv4 } = require('uuid');
  const express = require("express");
  const bcrypt = require("bcrypt");
  const {v4:uuid } = require('uuid');
  const fs = require('fs');
  const Ffmpeg = require('./thumbGenerator')
  const saveFile = require('./fileSave')
  const deleteFile = require('./fileDelete')
  const {Op} = require('sequelize');
  const makePayment = require('./paymentCall')
  let { GraphQLScalarType, Kind } = require('graphql');
  const GraphQLDecimal = require('graphql-type-decimal');






  const dateScalar = new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    serialize(value) {
      if (value instanceof Date) {
        //format logic comes here
        return value.toDateString(); // Convert outgoing Date to integer for JSON
      }
      throw Error('GraphQL Date Scalar serializer expected a `Date` object');
    },
    parseValue(value) {
      if (typeof value === 'number') {
        return new Date(value); // Convert incoming integer to Date
      }
      throw new Error('GraphQL Date Scalar parser expected a `number`');
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        // Convert hard-coded AST string to integer and then to Date
        return new Date(parseInt(ast.value, 10));
      }
      // Invalid hard-coded value (not an integer)
      return null;
    },
  });
  const pubsub = new PubSub()

const { join } = require('path');
//const { pubsub } = require('../server/redisClient.js');
  const resolvers = {
    Upload: GraphQLUpload,
    Date: dateScalar,
    Decimal:GraphQLDecimal,
    Subscription:{
     alertAdded:{
      subscribe:withFilter(
        () => pubsub.asyncIterator(['ALERT_ADDED']),
        (payload, variables) => {
          // Only push an update if the comment is on
          // the correct repository for this operation
          console.log(payload.UserId,variables.toUser)
          return (
            payload.UserId === variables.toUser
          );
        },
      ),
      resolve: (payload) => {
        return payload;
  },
     }
    },
    Query: {
      hello: () => "Hello world!",
      getSubscribers: async (root,{},context) => {
        try{
       // get profile_users of req.session.userID
       let user = await models.User.findByPk(context.req.session.userID)
       let subscribers = user.getProfiles()
       return subscribers
        }
        catch(error){
          console.log(error)
        }
      },
      
    getmessageId:async (root,{userId},context)=>{
    let messageId = await models.Message.findOne({where:{UserId:userId}})
      if(messageId) return [messageId.dataValues.messageId,messageId.dataValues.sessionId]
      return []
    
  
    },
    createmessageId: async (root,{userId,messageId,sessionId},context) =>{
      let msg = await models.Message.create({messageId:messageId,UserId:context.req.session.userID,sessionId:sessionId})
      return msg
    }
    ,
    getPpvPrice: async(root,{id},context)=>{
      let post = await models.Posts.findByPk(id)
      if(post){
        let ppv_price = post.price
        return ppv_price
      }
      return new Error("post doesn't exist or has been deleted")
    },
      // async isFavorited(root,{id},context){
      //   let favoriteEntry = await models.Favorites.findOne({where:{UserId:context.req.session.userID,PostId:id}})
      //   console.log(favoriteEntry)
      //    return (favoriteEntry)?true:false
      // },
      async getAllBundles(root,{id},context){
      let user = await models.User.findByPk(id)
      let profile = await user.getProfile()
      let bundles = await profile.getBundles()
      if(bundles){
        return bundles
      }
       return  new Error("an error was encountered")
      }
      ,
      async getAlerts(root,{id},context){
       let auth = await models.User.findByPk(id)
       if(auth){
        let alerts = await auth.getAlerts()
        return alerts
       }
       return new Error("nothing to see here")
      },
      async getPosts(root,{id,limit,offset},context){
        const isFavorited = async (id) =>{
          let favoriteEntry = await models.Favorites.findOne({where:{UserId:context.req.session.userID,PostId:id}})
          //console.log(favoriteEntry)
           return (favoriteEntry)?true:false
        }
        const favoritedCount = async (id)=>{
           let count = await models.Favorites.count({where:{PostId:id}})
           //console.log(count,"ayoooo")
           
           return count
          }
          const getcommentscount = async (id)=>{ 
             let count = await models.Comments.count({where:{PostId:id}})
             return count
          }
        let user = await models.User.findByPk(id)
        let posts = await user.getPosts({limit:limit,offset:offset});
  
        let postwithFavs = await posts.map(post=> {
          //console.log(post.dataValues.id,"yeeeeeeaaaaaaah niggsa")
          let postfav = {
            favorited:isFavorited(post.dataValues.id),
            post:post,
            count:favoritedCount(post.dataValues.id),
            commentscount: getcommentscount(post.dataValues.id)
          }
          return postfav
        }
      
          )
          console.log(postwithFavs)
          return postwithFavs
      },
      // async favoritedCount(root,{id},context){
      //  let count = await models.Posts.findByPk(id).getFavorites().count()
      //  return count
      // },
      me: async (root, {}, context) => {
        if (!context.req.session) {
          return new Error("user not logged in");
        }
        const user = await models.User.findByPk(context.req.session.userID);
        console.log(context.req.session.userID)
        if(!user){
          return new Error("user not found bitch")
        }
        //pubsubshit
        
        // pubsub.publish("ALERT_ADDED",{message:"MARIO",type:"ITS A ME",id:5,UserId:5})
        return user;
      },
      profile: async (root, {}, context) => {
        if (!context.req.session) {
          return new Error("user not logged in");
        }
        const user = await models.User.findByPk(context.req.session.userID);
        console.log(context.req.session.userID)
        if(!user){
          return new Error("user not found bitch")
        }
        const profile = await user.getProfile()
        if(profile){
          return profile;
        }
    
      },
      async payPerView(root,{id,contact},context){
        let payment = new Collection()
        let externalId = uuidv4()
       
        console.log(id)
        const post =  await models.Posts.findByPk(id)
          let ppv_price = post.dataValues.price
          console.log(ppv_price)
          let paymentApiCall =  await payment.requestToPay(externalId,ppv_price,contact,"pay to view this post")
          let msg = await payment.getTransactionStatus()
         // let msg = await makePayment(ppv_price,contact,"pay to view this post")

           console.log(msg)
           let cycleCall = () =>{

            let Blondie =  (ogMsg,index)=>{
               msg = ogMsg
               let idx = index
               idx++
              return new Promise((resolve,reject)=>setTimeout(
                  async () => {
                  msg = await payment.getTransactionStatus()
                  if(msg !== "PENDING") console.log(msg,idx)
                  resolve((msg !== "PENDING" || idx == 6)?msg:Blondie(msg,idx))
              },7000))
            
            }
              
         
              
                              return Blondie(msg,0).then(async(done)=>{
                  if(done == "SUCCESSFUL"){
                  
                    let user = await models.User.findByPk(context.req.session.userID)
                    await post.addUser(user)
                  }
                  
                  console.log(done)
                  return done

                })
           }

            return  cycleCall()
             //console.log("yessss",stat)
          //return "API CALL"

         
           
            //}

          


      },
      async getFeed(root,{limit,offset},context){
      let auth = await models.User.findByPk(context.req.session.userID)
      let profiles = await auth.getProfiles()
      let pushPosts = ()=> {
        profiles.forEach(log1)
        return arr
      }
      let pushPosts2 = async ()=>{
        let array = []
        let params = profiles
        for(let i = 0;i<params.length;i++){
          let user = await params[i].getUser()
          let posts = await user.getPosts({limit:limit,offset:offset})
          //console.log("these are the posts",posts)
          array =  array.concat(posts)
          console.log(array,"pushed into array")
        }
        return array
        // let param = []
        // let log1 = async(a)=>{
        //   let user = await a.getUser()
        //   let posts = await user.getPosts()
        //   console.log(user,posts)
        //   param.concat(posts)
        //   }
        // profiles.forEach(log1)
        // return param
      }

       
    
       // 
      // let users = await profiles.map((p)=>{
      //   return  p.getUser()
      // })
      const hasPaid = async (post)=>{
            let paidStatus  = await post.hasUser(auth)
            console.log("FOUND THE USER OR NOT",paidStatus)
          //   let found = await models.Posts.findOne({
          // include:[{
          //   model:models.User,
          //   required:true,
          //   where:{id:post.dataValues.id},
          //   through:{
          //     where:{
          //       // id:user.dataValues.id,
          //       UserId:context.req.session.userID
          //     }
          //   },
          
          // }

          // ]})
       return paidStatus
      }
        //console.log("users",users,profiles)
        const isFavorited = async (id) =>{
          let favoriteEntry = await models.Favorites.findOne({where:{UserId:context.req.session.userID,PostId:id}})
          //console.log(favoriteEntry)
           return (favoriteEntry)?true:false
        }
        const favoritedCount = async (id)=>{
           let count = await models.Favorites.count({where:{PostId:id}})
           //console.log(count,"ayoooo")
           
           return count
          }
          const getcommentscount = async (id)=>{ 
             let count = await models.Comments.count({where:{PostId:id}})
             return count
          }
          const getPicture = ()=>{
          }
        //let user = await models.User.findByPk(id)
       
         let posts = await pushPosts2()
         console.log(posts,"HERE LIE THE POSTS")
        let postwithFavs = await posts.map(post=> {
          // id: Int!
          // title: String!
          // caption: String
          // thumbnail: String
          // file: String
          // price:Int!
          //let unpaid = {}
          //console.log(post.dataValues.id,"yeeeeeeaaaaaaah niggsa")
          let postfav = {
            //profilepic:??
            favorited:isFavorited(post.dataValues.id),
            post:(hasPaid(post)==true)?post:{
              id:post.dataValues.id,
              title:post.dataValues.title,
              caption:post.dataValues.caption,
              thumbnail:post.dataValues.thumbnail,
              file:"pngsus.png",
              price:post.dataValues.price
           },
            count:favoritedCount(post.dataValues.id),
            commentscount: getcommentscount(post.dataValues.id)
          } 
          return postfav
        
        })
        return postwithFavs
        // let posts = bundleStatus.map((bdl)=>{
        //   bdl.getPosts()
        // })
      },
      async getSinglePost(root,{id},context){
        let auth = context.req.session.userID
        let post =  await models.Posts.findByPk(id)
        if(post){
          let paidStatus  = await post.hasUser(auth)
          if(paidStatus) return post
          return new Error("you haven't paid to view this post")
        }
        return new Error("post doesn't exist or has been deleted")
      },
      async searchUsers(root,{params},context){
        console.log(params)
        
        let users = await models.User.findAll({where:{
          // [Op.substring]:`${params}`
           'name': { [Op.substring]: `${params}` } 
        }})

        let pushPosts2 = async ()=>{
          let array = []
          let params = users
          for(let i = 0;i<params.length;i++){
            let pfls = await params[i].getProfile()
            //let posts = await user.getPosts({limit:limit,offset:offset})
           // console.log("these are the posts",pfls)
            array =  array.concat(pfls)
            //console.log(array,"pushed into array")
          }
          return array
          // let param = []
          // let log1 = async(a)=>{
          //   let user = await a.getUser()
          //   let posts = await user.getPosts()
          //   console.log(user,posts)
          //   param.concat(posts)
          //   }
          // profiles.forEach(log1)
          // return param
        }
        const hasPaid = async (profile)=>{
          console.log(profile,"cartells")
          let subStatus  = await profile.hasUsers(await models.User.findByPk(context.req.session.userID))
          console.log("FOUND THE USER OR NOT",subStatus)
        //   let found = await models.Posts.findOne({
        // include:[{
        //   model:models.User,
        //   required:true,
        //   where:{id:post.dataValues.id},
        //   through:{
        //     where:{
        //       // id:user.dataValues.id,
        //       UserId:context.req.session.userID
        //     }
        //   },
        
        // }

        // ]})
     return subStatus
    }
        let checkSub = async (user)=>{
//let use = await models.User.findByPk(user.dataValues.id) 
        //  let bundleStatus = await models.User.findOne({
        //   include:[{
        //     model:models.Bundles,
        //     required:true,
        //     where:{id:user.dataValues.id},
        //     through:{
        //       where:{
        //         // id:user.dataValues.id,
        //         UserId:context.req.session.userID
        //       }
        //     },
          
        //   }

        //   ]})
        // let pf = await user.getProfile()
        // let check1 = await pf.hasUser(auth)
        console.log(context.req.session.userID,"treeward")
        //let check = user.hasProfile()
        let bundleStatus = await models.User.findOne({
          include:[{
            model:models.Profile,
            required:true,
            where:{id:user.dataValues.id},
            through:{
              where:{
                // id:user.dataValues.id,
                UserId:context.req.session.userID
              }
            },
          
          }

          ]})
         if(bundleStatus){
          return true
         }
         return false
        }

        let mappable = await pushPosts2()
        console.log("ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd,",users,mappable)
        let SearchUsers = mappable.map((user,index)=>{
          return {
           user:users[index],
           subbed:hasPaid(user)
          }
        })
        return SearchUsers
      },
      getUser: async (root, { id }, { model }) => {
        try {
          return models.User.findByPk(id);
        } catch (er) {
          console.log(er);
        }
      },
      getProfileStats:async(root,{id},context)=>{
       try{
        console.log(id,"here it is")
        //await models.Profile.findByPk(id) 
        let profile = await models.Profile.findOne({where:{
         UserId:id
}})
        console.log(profile)
          let user = await profile.getUser()
          let user_id = user.dataValues.id
          let postscount = await models.Posts.count({where:{UserId:user_id}})
          let subcount = await models.User.count({
            include:[{
              model:models.Profile,
              required:true,
              //where:{id:user},
              through:{
                where:{
                  // id:user.dataValues.id,
                  ProfileId:id
                }
              },
            
            }
  
            ]})
           let res = {
            profile:profile,
            posts:postscount,
            subscribers:subcount
          }
          //console.log(profile,postscount,subcount)
          return res
        

       }
       catch(e){
          return new Error("shieeet")
       }
      },
      getComments:async (root,{id},context)=>{
   try{
    let post = await models.Posts.findByPk(id);
    let comments = post.getComments()
    return comments

   }
   catch(error){
    console.log(error)
   }
      },
    },
    Mutation: {
      async createnewUser(root, { name, email, password, mtn_number }, context) {
        try {
          const redisClient = new Redis(6379, "localhost")
            const sessionStore = new sesh(redisClient)
           let user = await models.User.create({
            name,
            email,
            password,
            mtn_number,
          });
          let sessionid = uuid()
          let userid = uuid()
          console.log(sessionid,userid)
          //create chat credentials on creating a new user..it just werks,idk
          let createChatCredentials = (s1,u1,n) =>{
            

            sessionStore.saveSession(s1, {
              userID:u1,
              name: n,
              connected: true,
            });
            
            
          }
          createChatCredentials(sessionid,userid,name)
          redisClient.disconnect()
          let msg = await models.Message.create({messageId:userid,UserId:user.dataValues.id,sessionId:sessionid})
          
          if(!user){
            return new Error("An error was encounted")
          }
          
          return  user
        } catch (er) {
          console.log(er);
        }
      },
      deleteBundle:async(root,{id},context)=>{
      let user = await models.User.findByPk( context.req.session.userID)
      let profile = await user.getProfile()
      let bundle = await models.Bundles.findOne({where:{id:id,ProfileId:profile.dataValues.id}})
       if(bundle){
        await bundle.destroy()
        return true
       }
       return false
      },
      createProfile: async (root,{name,description,email},context) =>{
        try{
          let id = context.req.session.userID
          const user = await models.User.findByPk(id)
          let profile = await user.createProfile({
            name,
            description,
            email,
            UserId:id,
            photo:""
          });
  
          // const profile = await models.Profile.findOne({where:
          //   {UserId:context.req.session.userID}})
  
            return profile
        }
        
      
  
        catch(error){
          console.log(error)
        }
      },
      async tip(root,{id,price,message,contact},context){
        console.log(id)
        let post = await models.Posts.findByPk(id)
        let ownwr = await post.getUser()
        let profile = await ownwr.getProfile()
        //console.log(pfl,post,ownwr,"respite yo")
        // let profile = await models.Profile.findOne({where:{
        //   UserId:id
        // }})
        let payment = new Collection()
              let externalId = uuidv4()
      
              
              let paymentApiCall =  await payment.requestToPay(externalId,price,contact,"tip this user")
              let msg = payment.getTransactionStatus()
      
             
   
                 let cycleCall = () =>{
   
               let Blondie =  (ogMsg,index)=>{
                  msg = ogMsg
                  let idx = index
                  idx++
                 return new Promise((resolve,reject)=>setTimeout(
                     async () => {
                     msg = await payment.getTransactionStatus()
                     if(msg !== "PENDING") console.log(msg,idx)
                     resolve((msg !== "PENDING" || idx == 4)?msg:Blondie(msg,idx))
                 },7000))
               
               }
                 
            
                 
                 //let intv = setInterval(callback,1000)
                   return Blondie(msg,0).then(async(done)=>{
                     if(done == "SUCCESSFUL"){  
                      let alrt = await ownwr.createAlert({message:`${ownwr.dataValues.name} has tipped ${price}`,type:"tip"})                
                       let earnings = parseFloat(profile.dataValues.earnings)
                       let paycut = 0.80*price
                       let transaction = await profile.createTransaction({amount:price,from:user.dataValues.id,type:"tip"})
                       let update_earnings = await profile.update({earnings:(earnings+paycut)})
                       //graphqlsubscriptions
                       pubsub.publish("ALERT_ADDED",{message:alrt.dataValues.message,type:alrt.dataValues.type,id:alrt.dataValues.id,UserId:auth.dataValues.id})
                      }
                     console.log(done)
                     return done
   
                   })
              }
           
           return cycleCall()
      },
      async newBundle(root,{price,endDate},context){
        //createBundle(price:Int,endDate:Int):Bundle!
        let user = await models.User.findByPk(context.req.session.userID)
        let profile = await user.getProfile()
         if(!profile){
          return new Error("profile not found!")
         }

        let bundle = await profile.createBundle({endDate:endDate,price:price})
        return bundle
      },
      async changePass(root, { id, password }, context) {
        try {
          let user = await models.User.findOne({ where: { id: id } });
          await user.update({ password: password });
          await user.save();
          //return user
        } catch (er) {
          console.log(er);
        }
      },
      async changePhoto(root,{photo},context){
      let user = await models.User.findByPk(context.req.session.userID)
      let profile = await user.getProfile()
      if(profile){
        let name = ""
        let filetype = ""
        let paths = await Promise.all(
          photo.map(async (img) =>  {
          const {createReadStream,filename,mimetype} = await img
          let stream = createReadStream()
          //console.log( "Hit this point 2",mimetype)
          filetype = mimetype
           name = filename

          //console.log(stream,"streammmmm")
            const fp =  saveFile(stream,filename)
            console.log("savefile",fp)
            return fp
        })).then((results)=>{
          console.log("resolver function returned :",results[0])
         return results[0]
        })
        await profile.update({photo:paths})

        return paths
      }

       return ""
       
      },
      async followUser(root, { profile_id,contact}, context) {
        try {
           //toggle logic:check if at least one subscription to a bundle exists and proceed
          let user = await models.User.findByPk(context.req.session.userID)
          
           
          console.log(context.req.session.userID,"id")
          let profile = await models.Profile.findOne({where:{
            UserId:profile_id
          }})
          if(profile){
            let creatorProfile = profile
            let price = profile.dataValues.price
            let auth = await creatorProfile.getUser()
            if(price>0){
              let payment = new Collection()
              let externalId = uuidv4()
      
              //let price = bundle.dataValues.price
              let paymentApiCall =  await payment.requestToPay(externalId,price,contact,"subscribe to user")
              let msg = payment.getTransactionStatus()
              //let creatorUserparam = await creatorProfile.getUser().dataValues.id
              //console.log(creatorProfile,price,"reached this point")
             
             
   
                 let cycleCall = () =>{
   
               let Blondie =  (ogMsg,index)=>{
                  msg = ogMsg
                  let idx = index
                  idx++
                 return new Promise((resolve,reject)=>setTimeout(
                     async () => {
                     msg = await payment.getTransactionStatus()
                     if(msg !== "PENDING") console.log(msg,idx)
                     resolve((msg !== "PENDING" || idx == 4)?msg:Blondie(msg,idx))
                 },7000))
               
               }
                 
            
                 
                 //let intv = setInterval(callback,1000)
                   return Blondie(msg,0).then(async(done)=>{
                     if(done == "SUCCESSFUL"){                  
                       let earnings = parseFloat(creatorProfile.dataValues.earnings)
                       let paycut = 0.80*price
                       let alrt = await auth.createAlert({message:`${user.dataValues.name} has subscribed to you`,type:"subscription"})
                       let transaction = await creatorProfile.createTransaction({amount:price,from:user.dataValues.id,type:"subscription"})
                       let update_earnings = await creatorProfile.update({earnings:(earnings+paycut)})
                       pubsub.publish("ALERT_ADDED",{message:alrt.dataValues.message,type:alrt.dataValues.type,id:alrt.dataValues.id,UserId:auth.dataValues.id})
                     }
                     console.log(done)
                     return done
   
                   })
              }
           
           return cycleCall()
            }
            else{
              ///let it default to this since verification hasn't been implemented
              let alrt = await auth.createAlert({message:`${user.dataValues.name} has subscribed to you`,type:"subscription"})
              await user.addProfile(profile)
              console.log(auth.dataValues.id,alrt,"niggnigg")
              pubsub.publish("ALERT_ADDED",{message:alrt.dataValues.message,type:alrt.dataValues.type,id:alrt.dataValues.id,UserId:auth.dataValues.id})
             return "SUCCESSFUL"
            }
          }
          let alrt = await auth.createAlert({message:`${user.dataValues.name} has subscribed to you`,type:"subscription"})
          await user.addProfile(profile)
          return "SUCCESSFUL"
          //user
  
          
          //return user
        } catch (er) {
          console.log(er);
        }
      },
      async toggleBundle(root,{id,contact},context){
      let bundle = await models.Bundles.findByPk(id)
      if(bundle){
        //check if user is already subbed and remove him or create a separate function for that
           let payment = new Collection()
           let creatorProfile = await bundle.getProfile()
           let externalId = uuidv4()
           let price = bundle.dataValues.price
           let paymentApiCall =  await payment.requestToPay(externalId,price,contact,"pay to view this post")
           let msg = payment.getTransactionStatus()
           //let creatorUserparam = await creatorProfile.getUser().dataValues.id
           //console.log(creatorProfile,price,"reached this point")
          
          

              let cycleCall = () =>{

            let Blondie =  (ogMsg,index)=>{
               msg = ogMsg
               let idx = index
               idx++
              return new Promise((resolve,reject)=>setTimeout(
                  async () => {
                  msg = await payment.getTransactionStatus()
                  if(msg !== "PENDING") console.log(msg,idx)
                  resolve((msg !== "PENDING" || idx == 6)?msg:Blondie(msg,idx))
              },7000))
            
            }
              
         
              
              //let intv = setInterval(callback,1000)
                return Blondie(msg,0).then(async(done)=>{
                  if(done == "SUCCESSFUL"){
                    //new transaction ad payment params
                     let user = await models.User.findByPk(context.req.session.userID)
                    // await post.addUser(user)
                    // let user = await models.User.findByPk(context.req.session.userID)
                    let toggle_bundle = await bundle.addUser(user)
                    let  toggled_subscription = await user.addProfile(creatorProfile)
                    ////
                    let earnings = parseFloat(creatorProfile.dataValues.earnings)
                    let paycut = 0.80*price
                    let transaction = await creatorProfile.createTransaction({amount:price,from:user.dataValues.id,type:"subscription"})
                    let update_earnings = await creatorProfile.update({earnings:(earnings+paycut)})
                  }
                  console.log(done)
                  return done

                })
           }
        
        return cycleCall()
        //return bundle
      }
      },
      async newPost(root, {title,caption,image}, context) {
        try{
          //replace with Promise.all
          //thumbnail generator
          console.log("hit this point 1uno")
        let videoExt = {
          "video/mp4":"video/mp4",
          "video/avi":"video/mp4",
          "video/ogg":"video/mp4",
          "video/mov":"video/mp4",
          "video/wmg":"video/mp4",
          "video/3gp":"video/mp4",
          "video/ts":"video/mp4",
          "video/webm":"video/mp4",
          "audio/mpeg":"video/mp4",
        }
        let filetype = ""
        let name = ""  
        const uploadDir = './public/storage';
        //let pathName = `${uploadDir}/${filename}`
        //let paths = //promiseall
        //const { createReadStream, filename, mimetype } = await img;
        //const stream = createReadStream();
        //  = filename
        //filetype = mimetype
        // let fileStream = await fs.createWriteStream(pathName)
        // await stream.pipe(fileStream);
        let paths = await Promise.all(
            image.map(async (img) =>  {
            const {createReadStream,filename,mimetype} = await img
            let stream = createReadStream()
            console.log( "Hit this point 2",mimetype)
            filetype = mimetype
             name = filename
  
            console.log(stream,"streammmmm")
              const fp =  saveFile(stream,filename)
              console.log("savefile",fp)
              return fp
          })).then((results)=>{
            console.log("resolver function returned :",results[0])
           return results[0]
          })
          // const mapScalar = async (img) =>{
          //   ///
          //   return fname
          // }
         
          let user = await models.User.findByPk(context.req.session.userID);
        
          
            let thumb = ""
            //const paths = await mapScalar(image)
         
            
            
           // const finalpaths = paths
             let arrpaths =  paths
             //console.log("craaaasaatdyfuygigiuylllllllllllllll",arrpaths)
                ///thumbnail goes here
            if(videoExt[filetype]){
              console.log("craaaasaatdyfuygigiuylllllllllllllll",arrpaths[0],`./public/storage/${arrpaths[0]}`)
               Ffmpeg(`./public/storage/${arrpaths}`,name)
                thumb = `${name}.png`
             }
            
          
            // const { filename, mimetype, createReadStream } =  await image[0];
  
            // console.log(filename,image)
            // let stream = createReadStream()
            // const path = await saveFile(stream,filename)
  
            
  
            // const {filename, mimetype, createReadStream} = await thumbnail
            // const stream2 = createReadStream()
            // const path2 = await saveFile(stream2,filename)
            //arrpaths[1],caption
  
            await user.createPost({title:title,caption:caption,file:arrpaths,thumbnail:thumb,price:66})
            let post = await  models.Posts.findOne({ where: { title: title } })
            return post
        }
        catch(err){
          console.log(err)
        }
       
      },
       async deletePost(root,{id},context){
       try{
        const post = await models.Posts.findOne({where:{UserId:context.req.session.userID,id:id}})
        //   {UserId:context.req.session.userID}})
        if(post){
         // post.destroy()
         let name = post.dataValues.file
         let data =(post.dataValues.thumbnail == "")?[name]:[name,post.dataValues.thumbnail]
          deleteFile(data)
          await post.destroy()
          return true
        }
        return false
       } 
       catch(error){
        console.log(error)
       }
      },
      async subscriptionPrice(root,{price},context){
        let user = await models.User.findByPk(context.req.session.userID)
        let profile = await user.getProfile()
        if(profile){
         await profile.update({price:price})
         await profile.save()
         return  "Profile Price has been set"
        }
        return "Error"
   },
      async logIn(root, { name, password }, context) {
        try {
          const user = await models.User.findOne({
            where: { name: name },
          });
          if (!user) {
            return new Error("user doesn't exist");
          }
          const validPass = async (pass, hash) => {
            return bcrypt.compare(pass, hash);
          };
  
          if (await validPass(password, user.password)) {
            console.log(await validPass(password, user.password));
  
            console.log(context.req.session);
  
            context.req.session.userID = user.id;
            console.log(context.req.session.userID);
            return user;
            console.log(context.req.session);
          } else return new Error("invalid Password");
        } catch (er) {
          console.log(er);
        }
      },
      async togglePost(root, {id} , context){
        let post = await models.Posts.findByPk(id)
        let auth = await post.getUser()
        let liker = await models.User.findByPk(context.req.session.userID)
        let name = liker.dataValues.name
        console.log(context.req.session.userID)
        let favoriteEntry = await models.Favorites.findOne({where:{UserId:context.req.session.userID,PostId:id}})
        if(favoriteEntry){
          await favoriteEntry.destroy()
          return post
        }
        if(auth.dataValues.id != liker.dataValues.id){
         let alrt = await auth.createAlert({message:`${name} liked a post`,type:"favorited"})
          post.createFavorite({UserId:context.req.session.userID})
          console.log(auth.dataValues.id,alrt,"niggnigg")
          pubsub.publish("ALERT_ADDED",{message:alrt.dataValues.message,type:alrt.dataValues.type,id:alrt.dataValues.id,UserId:auth.dataValues.id})
        }

        return post
      },
     // async favoritePost(root,{id},context){
        //let post = await models.Posts.findByPk(id)
        
        //post.createFavorite({UserId:context.req.session.userId,PostId:id})
     // },
      //async unfavoritePost(){
       
      //},
      async viewPost(root,{postId},context){
        let id = context.req.session.userID 
        //fooInstance.addBar()
        let post = await models.Posts.findByPk(postId)
         await post.addUser(id)
         return post
      },
      async deleteAlert(root,{id},context){
        let alert = await models.Alert.findByPk(id)
        if(alert){
          await alert.destroy()
            return true
        }
          return false
      
      },
      async createComment(root,{text,PostId},context){
        let post = await models.Posts.findByPk(PostId);
        console.log("post the postid is this noewwhdjhdh",PostId)
        let comment = await post.createComment({text:text,UserId:context.req.session.userID})
        return comment
       
      }
    },
  };
  
  module.exports = resolvers;
  