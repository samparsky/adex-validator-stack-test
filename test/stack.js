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
    followerIdentity,
    waitTime
} = require('./helper')

const assert = require("assert")


before( async () => {
    // await seedDatabase(leaderDatabase)
    // await seedDatabase(followerDatabase)
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
    
        // sleep for 50 seconds 
        // to allow validateworker to produce state
        await sleep(waitTime)
    
        const leaderTree   = await get(leaderPort, `channel/${channel}/tree`)
        const followerTree = await get(followerPort, `channel/${channel}/tree`)

        delete leaderTree['lastEvAggr']
        delete followerTree['lastEvAggr']

        assert.deepEqual(leaderTree, followerTree, "Should have the same channel tree")

         // get the last validator message from follower
        let followerMessage = await get(
            followerPort, 
            `channel/${channel}/validator-messages/${followerIdentity}/ApproveState`
            )
        
        assert.equal(
            followerMessage['validatorMessages'][0]['msg']['isHealthy'], 
            true, "Should mark channel healthy" )
        
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
        await sleep(waitTime)
    
        // get the last validator message from follower
        let followerMessage = await get(
            8006, 
            `channel/${channel}/validator-messages/${followerIdentity}/ApproveState`
            )
    
        assert.equal(
            followerMessage['validatorMessages'][0]['msg']['isHealthy'], 
            false, "Mark channel unhealthy" )
    })
    
    it("Leader sends an invalid type of state, follower should reject", async() => {
        const channel = randString()
    
        await seedChannel(leaderDatabase, channel)
        await seedChannel(followerDatabase, channel)
    
        const publisher = "a1"
    
        await sendEvents([leaderPort, followerPort], publisher, channel)
    
        // wait till approve state
        // is produced
        await sleep(waitTime)
        const stateRoot = "cd82fa3b9a6a0c00f3649bba9b3d90c95f970b2f7cdad8c93e16571297f1a0f4"
    
        const invalidState = {
            "messages": [{ 
                "type" : "NewState", 
                "balances" : { 
                    "a1" : "5000"
                },
                "balancesAfterFees": {
                    "a1":"4800",
                    "validator":"10"
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
            `channel/${channel}/validator-messages/${followerIdentity}/ApproveState`
            )
            
        assert.notEqual(
            followerMessage['validatorMessages'][0]['msg']['stateRoot'], 
            stateRoot, 
            "Should ignore invalid state transition"
        )
    })

    it(`Leader sends an unhealthy new state, follower should mark 
        channel unhealthy and after sends a healthy new state, 
        follower should mark channel healthy`, async () => {

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
        await sleep(waitTime)
    
        // get the last validator message from follower
        let followerMessage = await get(
            8006, 
            `channel/${channel}/validator-messages/${followerIdentity}/ApproveState`
            )
    
        assert.equal(
            followerMessage['validatorMessages'][0]['msg']['isHealthy'], 
            false, "Mark channel unhealthy" )
        
        // send new events to both follower & leader setup
        await sendEvents([followerPort, leaderPort], publisher, channel)

        // send event difference to the leader
        // setup
        i = 5
        while(i != 0){
            await sendEvents([leaderPort], publisher, channel)
            i -= 1
        }

        // wait till state is produced
        await sleep(waitTime)

        // get the last validator message from follower
        followerMessage = await get(
        8006,
        `channel/${channel}/validator-messages/${followerIdentity}/ApproveState`
        )
    
        assert.equal(
            followerMessage['validatorMessages'][0]['msg']['isHealthy'], 
            true, "Mark channel healthy" )

    })

})