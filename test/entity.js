const test = require("blue-tape");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { getMongo, connect } = require("../stack/db");
// const request = require("supertest");
const sentry = require("../stack/bin/sentry")
const worker = require("../stack/bin/validatorWorker")
const util = require("util")
const exec = util.promisify(require("child_process").exec)
// const request = require("request")

// const mongod = new MongoMemoryServer();
// let uri = mongod.getConnectionString();
// console.log({uri})

let dbUrl

async function setupDb(dbName){
    if(dbUrl) {
        return dbUrl
    }
    console.log("Setting up database");
    const mongod = new MongoMemoryServer();
    dbUrl = await mongod.getConnectionString();
    console.log({ dbUrl })
    return dbUrl
}

async function seedDatabase(id, uri){
    process.env.DB_MONGO_URL = uri
    process.env.DB_MONGO_NAME = id

    await connect();

    const db = getMongo()

    db.collection("sessions").insertOne({ _id: 'x8c9v1b2', uid: 'awesomeTestUser' })

    db.collection("sessions").insertOne({ _id: 'AUTH_awesomeLeader', uid: 'awesomeLeader' })
    db.collection("sessions").insertOne({ _id: 'AUTH_awesomeFollower', uid: 'awesomeFollower' })

    db.collection("channels").insertOne({
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

async function sendMessages(port, channel="awesomeTestChannel"){
    const url = `http://localhost:${port}/channel/${channel}/events`
    const body = {"events": [{"type": "IMPRESSION", "publisher": "myAwesomePublisher"}]}

    // send to leader
    
    // send to follower

    // curl -H 'Authorization: Bearer x8c9v1b2' -H 
    // 'Content-Type: application/json' --data "$bodyJson" -X POST http://localhost:8006/channel/awesomeTestChannel/events

}

async function _setupSentry(id, dbUrl, port){
    await seedDatabase(id, dbUrl)

    const cmd = `DB_MONGO_NAME=${id} DB_MONGO_URL=${dbUrl} PORT=${port} node /Users/Samparsky/Sites/nodejs/adex-validator-stack-test/stack/bin/sentry.js --adapter=dummy --dummyIdentity=${id} &`
    const { stdout, stderr } = await exec(cmd)

    console.log({ stdout })
    console.log({ stderr })
}

async function _setupWorker(id, dbUrl){
    await seedDatabase(id, dbUrl)

    const cmd = `DB_MONGO_NAME=${id} DB_MONGO_URL=${dbUrl} node /Users/Samparsky/Sites/nodejs/adex-validator-stack-test/stack/bin/validatorWorker.js --adapter=dummy --dummyIdentity=${id} &`
    const { stdout, stderr } = await exec(cmd)

    console.log({ stdout })
    console.log({ stderr })
}


async function setupLeader(){
    // setup db
    const uri = await setupDb();
    // run sentry
    await _setupSentry("awesomeLeader", "", 8009)
    // setup work
    await _setupWorker("awesomeLeader", "")
}

async function setupFollower(){
    const uri = await setupDb();
    // run sentry
    await _setupSentry("awesomeFollower", "", 8010)
    // setup work
    await _setupWorker("awesomeFollower", "")
}

// Working Scenarios
test("Should deposit into the channel", async(t) => {
    // setup database
    // seed database
    await setupLeader();
    await setupFollower();
    await sendMessages();

    // confirm follower & leader received message

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