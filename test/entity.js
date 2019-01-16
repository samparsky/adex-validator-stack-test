const test = require("blue-tape");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require('mongodb')

// const request = require("supertest");
// const sentry = require("../stack/bin/sentry")
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
// process.on('SIGINT', exitHandler)
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

    await db.collection("sessions").insertOne({ _id: 'x8c9v1b2', uid: 'awesomeTestUser' })

    await db.collection("sessions").insertOne({ _id: 'AUTH_awesomeLeader', uid: 'awesomeLeader' })
    await db.collection("sessions").insertOne({ _id: 'AUTH_awesomeFollower', uid: 'awesomeFollower' })

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

    // await mongoClient.close()

}

async function dropDatabase(id, uri){
    const mongoClient = await MongoClient.connect(uri || 'mongodb://localhost:27017', { useNewUrlParser: true })
    const db = mongoClient.db(id)

    await db.dropDatabase()
    await mongoClient.close()
}

async function sendEvents(ports=[],publisher="myAwesomePublisher", channel="awesomeTestChannel", ){
    Promise.all(
        ports.map(async (port) => {
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
        
            console.log({response})
        })
    )
}

async function get(port, url) {
    url =  `http://localhost:${port}/${url}`
    const response = await fetch(url, {
        headers: {
            "content-type": "application/json"
        },
        method: "GET"
    });
    console.log({response})
    return response.json()
}

async function post(port, url, body) {
    url =  `http://localhost:${port}/${url}`
    body = JSON.stringify(body)

    const response = await fetch(url, {
        headers: {
            "authorization": "Bearer x8c9v1b2",
            "content-type": "application/json"
        },
        body,
        method: "POST"
    });

    console.log({response})
    return response.json()
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

// Working Scenarios
test("Should deposit into the channel", async(t) => {
    // setup database
    // seed database
    // await setupLeader();
    // await setupFollower();
    // await sendMessages();

    // confirm follower & leader received message

})

test("Leader signs a valid state, Followers should detect and sign", async(t) => {
    const channel = "awesomeTestChannel"

    // await seedDatabase("adexValidatorFollower")
    // await seedDatabase("adexValidator")


    const publishers = ["myAwesomePublisher", "myAwesomePublisher1", "myAwesomePublisher2"]
    Promise.all(
        publishers.map(
            (publisher) => sendEvents([8005, 8006], publisher)
        )
    )
    // get the channel status
    const leaderStatus  = await get(8005, `channel/${channel}/status`)
    const followerStatus = await get(8006, `channel/${channel}/status`)
    console.log({leaderStatus})
    console.log({followerStatus})

    // check deposit amount
    t.equal(leaderStatus.depositAmount, followerStatus.depositAmount, "Invalid channel details")
    // check tree

    const leaderTree = await get(8005, `channel/${channel}/tree`)
    const followerTree = await get(8006, `channel/${channel}/tree`)
    // t.equal(leaderTree.fo)
    console.log({leaderTree})
    console.log({followerTree})

    publishers.map((publisher) => t.equal(leaderTree['balances'][publisher], '1', "failed to balance publisher"))

    // check the follower database for validator messages
    // await dropDatabase("adexValidatorFollower")
    // await dropDatabase("adexValidator")

})

async function afterProducer(adapter, {channel, newStateTree, balances}) {
	const followers = channel.spec.validators.slice(1)
	// Note: MerkleTree takes care of deduplicating and sorting
	const elems = Object.keys(balances).map(
		acc => adapter.getBalanceLeaf(acc, balances[acc])
	)
	const tree = new adapter.MerkleTree(elems)
	const stateRootRaw = tree.getRoot()
	return adapter.sign(stateRootRaw)
	.then(function(signature) {
		const stateRoot = stateRootRaw.toString('hex')
		return persistAndPropagate(adapter, followers, channel, {
			type: 'NewState',
			...newStateTree,
			stateRoot,
			signature,
		})
	})
}

test("Leader sends an incorrect new state, follower should mark channel unhealthy", async(t) => {
    const channel = "awesomeTestChannel"
    const publisher = "myAwesomePublisher"
    sendEvents([8005, 8006], publisher)

    const invalidState = { 
        "type" : "NewState", 
        "balances" : { 
            "myAwesomePublisher" : "3", 
            "myAwesomePublisher1" : "3", 
            "myAwesomePublisher2" : "3" 
        }, 
        "lastEvAggr" : ISODate("2019-01-16T08:48:01.547Z"), 
        "stateRoot" : "cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4", 
        "signature" : "Dummy adapter signature for cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4 by awesomeLeader" 
    }

    const followerPropagate = await post(8006, `channel/${channel}/validator-messages`, invalidState)
    console.log({ followerPropagate })
    // should mark the state unhealhy 
    const followerStatus = await get(8006, `channel/${channel}/status`)
    console.log({ followerStatus })
    // validator-message
})

test("Leader sends an incorrect new state, follower should mark channel unhealthy", async(t) => {

})

test("Leader signs invalid state, follower should reject and not sign", async(t) => {

})

test("Leader signs an invalid transition, follower should reject", async(t) => {

})

test("Should send events to the setup", async(t) => {
//propagate
})

// Attack Scenarios
test("", async(t) => {

})