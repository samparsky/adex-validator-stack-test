const test = require("blue-tape");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require('mongodb')

// const request = require("supertest");
const sentry = require("../stack/bin/sentry")
// const worker = require("../stack/bin/validatorWorker")
const util = require("util")
const exec = util.promisify(require("child_process").exec)
const { spawn, fork } = require("child_process")
const fetch = require("node-fetch");

let pids = []

const exitHandler =  () => {
    console.log(`killing processes with id ${pids.join(" ,")}`)
    pids.map((id) => process.kill(parseInt(`-${id}`)))
    console.log("Success")
    // process.exit(0)
}

// process.on('exit', exitHandler)
process.on('SIGINT', exitHandler)
// const request = require("request")

// const mongod = new MongoMemoryServer();
// let uri = mongod.getConnectionString();
// console.log({uri})

let dbUrl
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



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

async function seedDatabase(id, uri, channel="awesomeTestChannel"){
    console.log({id})
    console.log({uri})
    
    const mongoClient = await MongoClient.connect(uri || 'mongodb://localhost:27017', { useNewUrlParser: true })
    const db = mongoClient.db(id)

    db.collection("sessions").insertOne({ _id: 'x8c9v1b2', uid: 'awesomeTestUser' })

    db.collection("sessions").insertOne({ _id: 'AUTH_awesomeLeader', uid: 'awesomeLeader' })
    db.collection("sessions").insertOne({ _id: 'AUTH_awesomeFollower', uid: 'awesomeFollower' })

    db.collection("channels").insertOne({
        // @TODO: document schema
        _id: channel,
        id: channel,
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

async function sendEvents(port, channel="awesomeTestChannel"){
    const url = `http://localhost:${port}/channel/${channel}/events`
    // const body = JSON.stringify({"events": [{"type": "IMPRESSION", "publisher": "myAwesomePublisher"}]})
        const body = JSON.stringify({"events": [{"type": "CLICK", "publisher": "myAwesomePublisher"}]})

    // send to leader
    const response = await fetch(url, {
        headers: {
            "authorization": "Bearer x8c9v1b2",
            "content-type": "application/json"
        },
        body,
        method: "POST"
    });

    console.log({response})
    
    // send to follower

    // curl -H 'Authorization: Bearer x8c9v1b2' -H 
    // 'Content-Type: application/json' --data "$bodyJson" -X POST http://localhost:8006/channel/awesomeTestChannel/events

}

async function _setupSentry(id, dbUrl, port){
    await seedDatabase(id, dbUrl)

    console.log("executing command")

    const cmd = `DB_MONGO_NAME=${id} DB_MONGO_URL=${dbUrl || ''} PORT=${port} nohup node /Users/Samparsky/Sites/nodejs/adex-validator-stack-test/stack/bin/sentry.js --adapter=dummy --dummyIdentity=${id} >> ${id}.out`
    console.log({cmd})
    const spawnR = spawn(cmd, {
        stdio: 'inherit',
        shell: true,
        detached: true
    })
    pids.push(spawnR.pid)
    // console.log({spawnR})

    console.log("hello world")
}

async function _setupWorker(id, dbUrl){
    const cmd = `DB_MONGO_NAME=${id} DB_MONGO_URL=${dbUrl || ''} nohup node /Users/Samparsky/Sites/nodejs/adex-validator-stack-test/stack/bin/validatorWorker.js --adapter=dummy --dummyIdentity=${id} >> ${id}.out`
    const spawnR = await spawn(cmd, {
        stdio: 'inherit',
        shell: true,
        detached: true
    })
    pids.push(spawnR.pid)
    // console.log({ spawnR })
    // console.log({ stderr })
}


async function setupLeader(){
    // setup db
    // const uri = await setupDb();
    const port = 8005
    // run sentry
    console.log("setup sentry") 

    // await _setupSentry("awesomeLeader", "", port)
    // console.log('Taking a break...');
    // await sleep(2000);
    // console.log('Two seconds later');
    // // setup work
    // await _setupWorker("awesomeLeader", "")
    // send messages
    console.log("send messages") 
    await sendEvents(port)



}

async function setupFollower(){
    const uri = await setupDb();
    const port = 8006

    // run sentry
    // await _setupSentry("awesomeFollower", "", port)
    // console.log('Taking a break...');
    // await sleep(2000);
    // console.log('Two seconds later');
    // // // setup work
    // await _setupWorker("awesomeFollower", "")
    console.log("send messages") 

    await sendEvents(port)
}

// Working Scenarios
test("Should deposit into the channel", async(t) => {
    // setup database
    // seed database
    // await setupLeader();
    // await setupFollower();
    // await sendMessages();

    // confirm follower & leader received message

})

test("Leader signs a valid state, followers should detect and sign", async(t) => {
    // start leader
    // start follower
    await setupLeader();
    await setupFollower();
})

test("Should send events to the setup", async(t) => {

})

// Attack Scenarios
test("", async(t) => {

})