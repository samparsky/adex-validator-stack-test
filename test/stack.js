const { 
    post, 
    get, 
    sendEvents, 
    seedChannel, 
    seedDatabase, 
    drop,
    sleep,
    randString,
    leaderPort,
    followerPort,
    leaderDatabase,
    followerDatabase,
} = require('./helper')

const assert = require("assert")

before( async () => {
    await seedDatabase(leaderDatabase)
    await seedDatabase(followerDatabase)
})

after( async () => {
    await drop(leaderDatabase)
    await drop(followerDatabase, true)
})

describe("Validator Stack", () => {

    it("Leader signs a valid state, Followers should detect and sign", async() => {
        const channel = randString()
    
        await seedChannel(leaderDatabase, channel)
        await seedChannel(followerDatabase, channel)
    
        const publishers = [
            "myAwesomePublisher", 
            "myAwesomePublisher1", 
            "myAwesomePublisher2"
        ]

        Promise.all(
            publishers.map(
                async (publisher) => await sendEvents([leaderPort, followerPort], 
                                            publisher, channel)
            )
        )
    
        // get the channel status
        const leaderStatus   = await get(leaderPort, `channel/${channel}/status`)
        const followerStatus = await get(followerPort, `channel/${channel}/status`)
    
        // check deposit amount
        assert.deepEqual(leaderStatus, followerStatus)
    
        // sleep for 3 seconds 
        // to allow validateworker to produce state
        await sleep(50000)
    
        const leaderTree   = await get(leaderPort, `channel/${channel}/tree`)
        const followerTree = await get(followerPort, `channel/${channel}/tree`)

        delete leaderTree['lastEvAggr']
        delete followerTree['lastEvAggr']

        assert.deepEqual(leaderTree, followerTree, "Should have the same channel tree")

         // get the last validator message from follower
        let followerMessage = await get(
            followerPort, 
            `channel/${channel}/validator-messages/awesomeFollower/ApproveState`
            )
    
        assert.equal(
            followerMessage['messages'][0]['msg']['health'], 
            "HEALTHY", "Mark channel unhealthy" )
        
    })
    
    it("Leader sends an unhealthy new state, follower should mark channel unhealthy", async() => {
        const channel = randString()
    
        await seedChannel(leaderDatabase, channel)
        await seedChannel(followerDatabase, channel)
    
        const publisher = "a1"
    
        await sendEvents([followerPort, leaderPort], publisher, channel)
        
        // send events to the follower
        // setup only
        let i = 5
        while(i != 0){
            await sendEvents([followerPort], publisher, channel)
            i -= 1
        }

        // wait till state is produced
        await sleep(50000)
    
        // get the last validator message from follower
        let followerMessage = await get(
            8006, 
            `channel/${channel}/validator-messages/awesomeFollower/ApproveState`
            )
    
        assert.equal(
            followerMessage['messages'][0]['msg']['health'], 
            "UNHEALTHY", "Mark channel unhealthy" )
    
    })
    
    // DOS attack vector
    it("Leader sends an invalid type of state, follower should reject", async() => {
        const channel = randString()
    
        await seedChannel(leaderDatabase, channel)
        await seedChannel(followerDatabase, channel)
    
        const publisher = "a1"
    
        await sendEvents([leaderPort, followerPort], publisher, channel)
    
        // allow event to be proccessed
        await sleep(50000)
        const stateRoot = "cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4"
    
        const invalidState = {
            "messages": [{ 
                "type" : "NewState", 
                "balances" : { 
                    "a1" : "5000"
                }, 
                "lastEvAggr" : "2019-01-16T08:48:01.547Z", 
                "stateRoot" : "cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4", 
                "signature" : "Dummy adapter signature for cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4 by awesomeLeader" 
            }]
        }
    
        // propagate to follower
        await post(
            followerPort, 
            `channel/${channel}/validator-messages`, 
            invalidState, 
            "Bearer AUTH_awesomeLeader" )
        
        // get the last validator message from follower
        // the last stored new state message
        // should have balance 1
        let followerMessage = await get(
            followerPort, 
            `channel/${channel}/validator-messages/awesomeFollower/ApproveState`
            )
            
        assert.notEqual(
            followerMessage['messages'][0]['msg']['stateRoot'], 
            stateRoot, 
            "Should ignore invalid state transition"
        )
    })

})