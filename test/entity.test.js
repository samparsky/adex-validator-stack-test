const { 
    post, 
    get, 
    sendEvents, 
    seedChannel, 
    seedDatabase, 
    exitHandler,
    drop,
    sleep 
} = require('./helper')

before(async()=> {
    console.log("entity")
    await seedDatabase("adexValidator")
    await seedDatabase("adexValidatorFollower")
})

after(async() => {
    console.log("entity")

    await drop("adexValidator")
    await drop("adexValidatorFollower")
})

describe("Validator Stack", () => {
    it("Leader signs a valid state, Followers should detect and sign", async(t) => {
        const channel = Math.random().toString(36).substring(2, 15) 
    
        await seedChannel("adexValidator", channel)
        await seedChannel("adexValidatorFollower", channel)
    
        const publishers = ["myAwesomePublisher", "myAwesomePublisher1", "myAwesomePublisher2"]
    
        Promise.all(
            publishers.map(
                (publisher) => sendEvents([8005, 8006], publisher, channel)
            )
        )
        // get the channel status
        const leaderStatus  = await get(8005, `channel/${channel}/status`)
        const followerStatus = await get(8006, `channel/${channel}/status`)
        // console.log({leaderStatus})
        // console.log({followerStatus})
    
        // check deposit amount
        await t.equal(leaderStatus.depositAmount, followerStatus.depositAmount)
        // check tree
    
        // sleep for 3 seconds 
        // to allow validateworker to produce state
        await sleep(30000)
    
        const leaderTree = await get(8005, `channel/${channel}/tree`)
        const followerTree = await get(8006, `channel/${channel}/tree`)
        // t.equal(leaderTree.fo)
        // console.log({leaderTree})
        // console.log({followerTree})
    
        // confirm the tree
        Promise.all(
            publishers.map(
                (publisher) => t.equal(
                                leaderTree['balances'][publisher], 
                                '1', 
                                "publisher balance"
                            )
            )
        )
    
        // confirm tree
        Promise.all(
            publishers.map(
                (publisher) => t.equal(
                                followerTree['balances'][publisher], 
                                '1', 
                                "publisher balance"
                            )
            )
        )
    })
    
    it("Leader sends an unhealthy new state, follower should mark channel unhealthy", async(t) => {
        const channel = Math.random().toString(36).substring(2, 15) 
    
        await seedChannel("adexValidator", channel)
        await seedChannel("adexValidatorFollower", channel)
    
        const publisher = "a1"
    
        await sendEvents([8005, 8006], publisher, channel)
        await sendEvents([8005, 8006], publisher, channel)
    
        await sendEvents([8006], publisher, channel)
        await sendEvents([8006], publisher, channel)
        await sendEvents([8006], publisher, channel)
        await sendEvents([8006], publisher, channel)
        await sendEvents([8006], publisher, channel)
    
        await sleep(50000)
    
        // get the last validator message from follower
        let followerMessage = await get(
            8006, 
            `channel/${channel}/validator-messages/awesomeFollower/ApproveState`
            )
    
        console.log({ followerMessage })
        t.equal(followerMessage['messages'][0]['msg']['health'], "UNHEALTHY", "Mark channel unhealthy")
    
    })
    
    // DOS attack vector
    it("Leader sends an invalid type of state, follower should reject", async(t) => {
        const channel = Math.random().toString(36).substring(2, 15) 
    
        await seedChannel("adexValidator", channel)
        await seedChannel("adexValidatorFollower", channel)
    
        const publisher = "a1"
    
        await sendEvents([8005, 8006], publisher, channel)
    
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
        const followerPropagate = await post(
            8006, 
            `channel/${channel}/validator-messages`, 
            invalidState, 
            "Bearer AUTH_awesomeLeader" )
    
        console.log({ followerPropagate })
    
        // get the last validator message from follower
        // the last stored new state message
        // should have balance 1
        let followerMessage = await get(
            8006, 
            `channel/${channel}/validator-messages/awesomeFollower/ApproveState`
            )
        
        console.log({followerMessage})
    
        t.notEqual(followerMessage['messages'][0]['msg']['stateRoot'], stateRoot, "Ignore invalid state transition")
    })
    
    // DOS Attack Vector
    it("Leader sends invalid messages to follower", async(t) => {
    
    })
})