const test = require("blue-tape");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../stack/bin/sentry")
const request = require("supertest");

const mongod = new MongoMemoryServer();
let uri = mongod.getConnectionString();
console.log({uri})
// before(async ()=>{
//     const uri = await mongod.getConnectionString();
//     process.env.DB_MONGO_URL = uri
// })

// DB_MONGO_URL
test("Sentry - Get Channel Info", async(t)=>{
    uri = await uri
    process.env.DB_MONGO_URL = uri
    // set Mongo db  url
    request(app).get("/channel/list").end((err, res)=> {
        // console.log({ err })
        console.log(res.body)
    })
})

test("Sentry - Get channel status", async(t) => {
    process.env.DB_MONGO_URL = uri
    request(app).get("/channel/awesomeTestChannel/status").end((err, res)=> {
        // console.log({ err })
        console.log("channle status")
        console.log(res.body)
    })
})

test("Sentry - Get channel tree", async(t) => {
    process.env.DB_MONGO_URL = uri
    request(app).get("/channel/awesomeTestChannel/tree").end((err, res)=> {
        // console.log({ err })
        console.log("channle tree")
        console.log(res.body)
    })
})

test("Sentry - POST events", async(t) => {
    process.env.DB_MONGO_URL = uri
    request(app).post("/channel/awesomeTestChannel/events")      
    .send({"events": [{"type": "IMPRESSION", "publisher": "myAwesomePublisher"}]})
    .end((err, res)=> {
        console.log( err)
        console.log("POST ")
        console.log(res.body)
    })
})

test("Sentry - POST validator messages", async(t) => {
    process.env.DB_MONGO_URL = uri
    request(app).post("/channel/awesomeTestChannel/events")      
    // .send({"events": [{"type": "IMPRESSION", "publisher": "myAwesomePublisher"}]})
    .end((err, res)=> {
        console.log( err)
        console.log("POST validator messages")
        console.log(res.body)
    })
})