const test = require("blue-tape");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { getMongo } = require("../stack//db");
const app = require("../stack/bin/sentry")
const request = require("supertest");

const mongod = new MongoMemoryServer();
let uri = mongod.getConnectionString();
console.log({uri})

let dbConnection

async function setupDb(){
    if(dbConnection) return
    console.log("Setting up database");
    const mongod = new MongoMemoryServer();
    dbConnection = await mongod.getConnectionString();
    process.env.DB_MONGO_URL = uri
}

async function seedDatabase(){
    const db = getMongo()
    db.sessions.insert({ _id: 'x8c9v1b2', uid: 'awesomeTestUser' })

    db.sessions.insert({ _id: 'AUTH_awesomeLeader', uid: 'awesomeLeader' })
    db.sessions.insert({ _id: 'AUTH_awesomeFollower', uid: 'awesomeFollower' })

    db.channels.insert({
        // @TODO: document schema
        _id: 'awesomeTestChannel',
        id: 'awesomeTestChannel',
        status: 'live',
        // @TODO: ERC20 addr
        depositAsset: 'DAI',
        depositAmount: 1000,
        validators: ['awesomeLeader', 'awesomeFollower'],
        spec: {
            validators: [
                { id: 'awesomeLeader', url: 'http://localhost:8005' },
                { id: 'awesomeFollower', url: 'http://localhost:8006' },
            ]
        }
    })
}

async function sendEvent(){

}

async function _setupSentry(){

}

async function _setupWorker(){
    
}

async function setupLeader(){

}

async function setupFollower(){

}

// Working Scenarios
test("Should deposit into the channel", async(t) => {
    // setup database
    await setupDb();
    // seed database
    await seedDatabase();
    // 

})

test("Leader signs a valid state, followers should detect and sign", async(t) => {

    // start leader
    // start follower
})

test("Should send events to the setup", async(t) => {

})

// Attack Scenarios
test("", async(t) => {

})