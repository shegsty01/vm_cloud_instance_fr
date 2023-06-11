const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Upload
  scalar Date
  scalar Decimal

  type Query {
    hello: String
  }
  type Query {
    me: User
  } 
  type Query{
    profile: Profile
  }

  type Query {
    getSubscribers:[Profile]
  }
  type UserProfile{
    createdAt: Date!
    updatedAt: Date!,
    ProfileId: Int!
    UserId: Int!

  }
  type User {
    id: Int!
    name: String!
    email: String!
    createdAt:Date!
    mtn_number: String!
    user_profile:UserProfile
  }
  type Comment{
    id:Int!
    text:String
    UserId:Int!
    PostId:Int!
    createdAt:Date!
  }
  type Favorites{
    id:Int!
    UserID:Int!
    PostID:Int!

  }
  type PostFav{
    post:Post!
    favorited:Boolean!
    count:Int!
    commentscount:Int!
  }
  type Mutation{
   deletePost(id:Int!):Boolean!
  }
  type Query{
    getFavoritesCount(id:Int):Int!
  }
  type Query{
    payPerView(id:Int!,contact:String!):String!
  }
  type Query {
    getPosts(id:Int!,offset:Int!,limit:Int!):[PostFav]
  }
  type SearchUser{
    user:User!
    subbed:Boolean!
  }
  type Query {
    searchUsers(
     params:String!
    ):[SearchUser]
   }
  type Mutation{
    togglePost(id:Int):Post
  }
  type Query {
    isFavorited(id:Int):Boolean!
  }
  type Query {
    getUser(id: Int): User
  }
  type Bundle{
    id:Int!
    profileId:Int!
    endDate:Int!
    price:Int!
  }
  type Mutation{
    toggleBundle(id:Int!,contact:String!):String!
  }
  type MessageParam{
    id:Int!
    userId:Int!
    messageId:String!
    sessionId:String!
  }
  type Mutation{
    newBundle(price:Int,endDate:Int):Bundle!
  }
  type Mutation{
    deleteBundle(id:Int):Boolean!
  }
  type Query{
    getAllBundles(id:Int!):[Bundle]
  }
  type Query{
    getmessageId(userId:Int!):[String]
  }
  type Query{
    createmessageId(userId:Int!,messageId:String!,sessionId:String!):MessageParam!
  }
  type Mutation {
    createnewUser(
      name: String
      email: String
      password: String
      mtn_number: String
    ): User
  }
  type Mutation {
    changePass(id: Int, password: String): User!
  }
  type Mutation{
    changePhoto(photo:[Upload]):String!
  }
  type Mutation {
    logIn(name: String!, password: String!): User!
  }
  type Mutation {
    followUser(profile_id:Int!,contact:String!): String!
  }
  type Mutation{
    tip(id:Int!,price:Int!,message:String,contact:String!):String!
  }
  type Query{
    getFeed(limit:Int!,offset:Int!):[PostFav]
  }
  type Mutation {
    viewPost(post_Id:Int!):Post!
  }
  type ProfileStat{
    
      profile:Profile!,
      posts:Int!,
      subscribers:Int!
    
  }
  type Query{
  getProfileStats(id:Int!):ProfileStat!
  }
  type Alert{
    id:Int!
    UserId:Int!
    message:String!,
    type:String!
  }
  type Subscription{
    alertAdded(toUser:Int!):Alert!
  }
  type Query{
    getAlerts(id:Int!):[Alert]
  }
  type Query{
    getPpvPrice(id:Int!):Decimal
  }
  type Query{
    getSinglePost(id:Int!):Post
  }
  type Stats{
    subscribers:[User],
    subscriptions:[Profile]
  }
  type Query{
    Withraw(contact:String!,amount:Int!):String!
  }
type Query{
  leCronJob:String
}
  type Mutation{
    resaveSession:Boolean!
  }
  type Query{
    getSubstats:Stats!
  }
  type Mutation{
    deleteAlert(id:Int!):Boolean!
  }
  type Post {
    id: Int!
    title: String!
    caption: String
    thumbnail: String
    file: String
    price:Int!
    UserId:Int
  }
  type Profile {
    id: Int!
    user_profile:UserProfile
    name: String!
    description: String
    email: String
    UserId:Int!
    referrer_id:Int 
    photo:String
    price:Decimal
    earnings:Decimal
  }
  type Mutation {
    newPost(
      title: String
      caption: String
      image: [Upload]
      price:Int!
    ): Post!
  }
  type Transaction{
    from:String!
    to:String!
    amount:Int!
  }
  type Mutation{
    createTransaction(to:Int!,amount:Int!):Transaction
  }
  type Mutation {
    createComment(
      text:String
      PostId:Int!
    ):Comment!
  }
  type Mutation{
    subscriptionPrice(price:Float!):String!
  }
  type Query{
    getComments(
      id:Int!
    ):[Comment]
  }
  type Mutation {
    createProfile(
      name: String!
      description: String!
      email:String!
    ): Profile!
  }
`;

module.exports = typeDefs;
