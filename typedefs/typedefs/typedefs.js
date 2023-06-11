const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Upload
  type Query {
    hello: String
  }
  type Query {
    me: User
  }
  type Query {
    getSubscribers:[Profile]
  }
  type User {
    id: Int!
    name: String!
    email: String!
    password: String!
    mtn_number: Int!
  }
  type Comment{
    id:Int!
    text:String
    UserId:Int!
    PostId:Int!
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
  }
  type Query{
    getFavoritesCount(id:Int):Int!
  }
  type Query {
    getPosts(id:Int!):[PostFav]
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
    newBundle(price:Int,endDate:Int):Bundle!
  }
  type Mutation{
    deleteBundle(id:Int):[Bundle]
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
  type Mutation {
    logIn(name: String!, password: String!): User!
  }
  type Mutation {
    followUser(profile_id:Int!): User!
  }
  type Mutation {
    viewPost(post_Id:Int!):Post!
  }
  
  type Post {
    id: Int!
    title: String!
    caption: String
    thumbnail: String
    file: String
    price:Int!
  }
  type Profile {
    id: Int!
    name: String!
    description: String
    email: String
    UserId:Int!
    referrer_id:Int
    price:Float
  }
  type Mutation {
    newPost(
      title: String
      caption: String
      image: [Upload]
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
  type Mutation {
    createProfile(
      name: String!
      description: String!
      email:String!
    ): Profile!
  }
`;

module.exports = typeDefs;
