const {
  GraphQLUpload,
  //graphqlUploadExpress, // A Koa implementation is also exported.
} = require('graphql-upload');
const models = require("../models/index.js");
const express = require("express");
const bcrypt = require("bcrypt");
const fs = require('fs');

const resolvers = {
  Upload: GraphQLUpload,
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
    me: async (root, {}, context) => {
      console.log(context.req.session.userId,context.req.session.userid,context.req.session.userID)
      if (!context.req.session) {
        return new Error("user not logged in");
      }
      const user = await models.User.findByPk(context.req.session.userID);
      
      if(!user){
        return new Error("user not found bitch")
      }

      return user;
    },
    getUser: async (root, { id }, { model }) => {
      try {
        return models.User.findByPk(id);
      } catch (er) {
        console.log(er);
      }
    },
    async isFavorited(root,{id},context){
      // let favoriteEntry = await models.Favorites.findOne({where:{UserId:context.req.session.userID,PostId:id}})
      // console.log(favoriteEntry)
      //  return (favoriteEntry)?true:false
    }
  },
  Mutation: {
    async createnewUser(root, { name, email, password, mtn_number }, context) {
      try {
         let user = models.User.create({
          name,
          email,
          password,
          mtn_number,
        });

        if(!user){
          return new Error("An error was encounted")
        }
        
        return  user
      } catch (er) {
        console.log(er);
      }
    },
    createProfile: async (root,{name,description,email,id},context) =>{
      try{
       
        const user = await models.User.findByPk(context.req.session.userID)
        await user.createProfile({
          name,
          description,
          email,
          id
        });

        const profile = await models.Profile.findOne({where:
          {UserId:context.req.session.userID}})

          return profile
      }
      
    

      catch(error){
        console.log(error)
      }
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
    async followUser(root, { profile_id}, context) {
      try {
       
        let user = await models.User.findByPk(context.req.session.userID)
        let profile = await models.Profile.findOne({where:{
          UserId:profile_id
        }})

        await user.addProfile(profile)
        return user

        
        //return user
      } catch (er) {
        console.log(er);
      }
    },
    async newPost(root, {title,caption,image}, context) {
      try{
        const mapScalar = async (img) =>{
          return img.map(async (i) =>  {
            const {createReadStream,filename} = await i
            let stream = createReadStream()
              const fp = await saveFile(stream,filename)
              return fp
          })
        }
        const saveFile = (stream,filename) => {
          const path = `${uploadDir}/${filename}`
          const stringpath = JSON.stringify(path)
          // console.log(path,stringpath)
           return new Promise(async (res,rej)=>{
            stream
              .on('error', error => {
                  if (stream.truncated)
                      // delete the truncated file
                      fs.unlinkSync(path);
                 return rej(error);
              })
              .pipe(fs.createWriteStream(path))
              .on('error', error => rej(error))
              .on('finish', () => res( stringpath))
             })
  
            }
        let user = await models.User.findByPk(context.req.session.userID);
        const uploadDir = '../src/uploads';
        

          const paths = await mapScalar(image)
          //console.log(paths)
          const finalpaths = Promise.all(paths).then((values)=>{
            return values
          })
           let arrpaths = await finalpaths
        
          // const { filename, mimetype, createReadStream } =  await image[0];

          // console.log(filename,image)
          // let stream = createReadStream()
          // const path = await saveFile(stream,filename)

          

          // const {filename, mimetype, createReadStream} = await thumbnail
          // const stream2 = createReadStream()
          // const path2 = await saveFile(stream2,filename)

          await user.createPost({title:title,caption:caption,file:arrpaths[0],thumbnail:arrpaths[1]})
          let post = await  models.Posts.findOne({ where: { title: title } })
          return post
      }
      catch(err){
        console.log(err)
      }
     
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
          //console.log(context.req.session);
        } else return new Error("invalid Password");
      } catch (er) {
        console.log(er);
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
      return "Profile not set yet"
 },
    async togglePost(root, {id} , context){
      // let post = await models.Posts.findByPk(id)
      // console.log(context.req.session.userID)
      // let favoriteEntry = await models.Favorites.findOne({where:{UserId:context.req.session.userID,PostId:id}})
      // if(favoriteEntry){
      //   await favoriteEntry.destroy()
      //   return post
      // }
      // post.createFavorite({UserId:context.req.session.userID})
      // return post
    },
    async viewPost(root,{postId},context){
      let id = context.req.session.userID 
      //fooInstance.addBar()
      let post = await models.Posts.findByPk(postId)
       await post.addUser(id)
       return post
    },
    async createComment(root,{text,PostId},context){
      let post = await models.Posts.findByPk(PostId);
      console.log("post",post,PostId,context.req.session.userId)
      let comment = await post.createComment({text:text,UserId:context.req.session.userID})
      return comment
     
    }
  },
};

module.exports = resolvers;
