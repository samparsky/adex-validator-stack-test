const fetch = require("node-fetch");
const util = require("util")
const exec = util.promisify(require("child_process").exec)
const { spawn, fork } = require("child_process")
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require('mongodb')

let mongoClient = null

async function tryCatch(promise, message) {
    try {
        await promise;
        throw null;
    } catch (error) {
        assert(error, "Expected an error but did not get one");
        try {
            assert(
                error.message.startsWith(PREFIX + message),
                "Expected an error starting with '" + PREFIX + message + "' but got '" + error.message + "' instead"
            );
        } catch (err) {
            assert(
                error.message.startsWith(PREFIX2 + message),
                "Expected an error starting with '" + PREFIX + message + "' but got '" + error.message + "' instead"
            );
        }
    }
}

let dbUrl
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const exitHandler =  () => {
    console.log(`killing processes with id ${pids.join(" ,")}`)
    pids.map((id) => process.kill(parseInt(`-${id}`)))
    console.log("Success")
    // process.exit(0)
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

async function get(port, url) {
    url =  `http://localhost:${port}/${url}`
    const response = await fetch(url, {
        headers: {
            "content-type": "application/json"
        },
        method: "GET"
    });
    // console.log({response})
    return response.json()
}

async function post(port, url, body, authorization="Bearer x8c9v1b2") {
    url =  `http://localhost:${port}/${url}`
    body = JSON.stringify(body)

    const response = await fetch(url, {
        headers: {
            authorization,
            "content-type": "application/json"
        },
        body,
        method: "POST"
    });

    // console.log({response})
    return response.json()
}

async function sendEvents(ports=[], publisher="myAwesomePublisher", channel="awesomeTestChannel", ){
    ports.forEach(async (port) => {
        const url = `http://localhost:${port}/channel/${channel}/events`

        const body = JSON.stringify({"events": [{"type": "IMPRESSION", "publisher": publisher}]})
        // send to leader
        const response = await fetch(url, {
            headers: {
                "authorization": "Bearer x8c9v1b2",
                "content-type": "application/json"
            },
            body,
            method: "POST"
        });
    
        // console.log({response})
    })
}

async function drop(id, drop=false){
    const mongoClient = await connectDB()
    const db = mongoClient.db(id)

    await db.dropDatabase();

    console.log("closing")
    if(drop) {
        console.log("closed")
        mongoClient.close(true)
    }
    
}

async function seedChannel(id, channel="awesomeTestChannel") {
    const mongoClient = await connectDB()

    const db = mongoClient.db(id)

    await db.collection("channels").insertOne({
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

async function connectDB(uri){
    if(mongoClient){
        console.log("reusing connection")
        return mongoClient
    }
    console.log("connectin")

    mongoClient = await MongoClient.connect(uri || 'mongodb://localhost:27017', { 
        useNewUrlParser: true,
    })
    return mongoClient;
}

async function seedDatabase(id){
    const mongoClient = await connectDB()
    const db = mongoClient.db(id)

    await db.collection("sessions").update({ _id: 'x8c9v1b2'}, { _id: 'x8c9v1b2', uid: 'awesomeTestUser' },  {upsert: true})

    await db.collection("sessions").update({ _id: 'AUTH_awesomeLeader'}, { _id: 'AUTH_awesomeLeader', uid: 'awesomeLeader' }, {upsert: true})
    await db.collection("sessions").update({ _id: 'AUTH_awesomeFollower'}, { _id: 'AUTH_awesomeFollower', uid: 'awesomeFollower' }, {upsert: true})

    return mongoClient;
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
}

const randString = () => Math.random().toString(36).substring(2, 15) 


module.exports = { 
    catchErr: async function(promise) {
        await tryCatch(promise, "");
    },
    post,
    get,
    sendEvents,
    seedChannel,
    seedDatabase,
    exitHandler,
    sleep,
    randString,
    drop,
    connectDB,
}
