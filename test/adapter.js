const test = require("blue-tape");
const { readFileSync }  = require('fs')
const { catchErr } = require('./helper')
const { ethereum: ethereumAdapter } = require("../stack/adapters");

test("ethereum adapter - Should init adapter", async(t) => {
    const actual = {}

    const opts = {
        keystoreFile: "/Users/Samparsky/Sites/nodejs/adex-validator-stack-test/test/resources/keystore.json",
        keystorePwd: "adexvalidator"
    }

    const expected = readFileSync(opts.keystoreFile, "utf-8")
    
    await ethereumAdapter.init(opts)
    t.pass("init ethereum adapter sucess")
})

test("ethereum adapter - Should fail to init adapter with empty opts", async(t) => {
    
})

test("ethereum adapter - Should unlock keystore", async(t) => {
    const opts = {
        keystoreFile: "/Users/Samparsky/Sites/nodejs/adex-validator-stack-test/test/resources/keystore.json",
        keystorePwd: "adexvalidator"
    }

    await ethereumAdapter.init(opts)
    await ethereumAdapter.unlock(opts)
    t.pass("unlock ethereum adapater success")
})

test("ethereum adapter - Should get whoami", async(t) => {
    const opts = {
        keystoreFile: "/Users/Samparsky/Sites/nodejs/adex-validator-stack-test/test/resources/keystore.json",
        keystorePwd: "adexvalidator"
    }

    await ethereumAdapter.init(opts)

    const expected = `0x${JSON.parse(readFileSync(opts.keystoreFile, "utf-8"))['address']}`.toLowerCase()
    console.log({expected})
    const actual = ethereumAdapter.whoami().toLowerCase()

    t.equal(actual, expected)
})

test("ethereum adapter - Should sign message", async(t) => {
    const opts = {
        keystoreFile: "/Users/Samparsky/Sites/nodejs/adex-validator-stack-test/test/resources/keystore.json",
        keystorePwd: "adexvalidator"
    }

    await ethereumAdapter.init(opts)

    const message = "hello world"
    const actual = await ethereumAdapter.sign(message)
    const expected = 
        "0xb139c99dbc0ab504f55ba0aa1e0d5662b1cb32aa207e8bb9b6204cab78e234901bd7abcf0d7d303ed276de735c1459018e672c5bf183690e2a2796670099757e1b"

    t.equal(actual, expected)
})

test("ethereum adapter - Should getBalanceLeaf", async(t) => {
    const opts = {
        keystoreFile: "/Users/Samparsky/Sites/nodejs/adex-validator-stack-test/test/resources/keystore.json",
        keystorePwd: "adexvalidator"
    }

    await ethereumAdapter.init(opts)

    const address = JSON.parse(readFileSync(opts.keystoreFile, "utf8"))['address']
    
    const expected = `{
        "type":"Buffer",
        "data":[
            106,198,127,161,126,210,
            213,191,165,101,145,140,
            36,185,210,177,68,169,
            238,242,110,70,211,165,
            190,46,199,193,133,7,119,148
        ]
    }`

    let actual = await ethereumAdapter.getBalanceLeaf(address, 0)
    actual = JSON.stringify(actual)
    console.log()
    t.equal(actual, expected)

})

test("ethereum adapter - sessionFromToken", async(t) => {
    const opts = {
        keystoreFile: "/Users/Samparsky/Sites/nodejs/adex-validator-stack-test/test/resources/keystore.json",
        keystorePwd: "adexvalidator"
    }

    await ethereumAdapter.init(opts)

    const token = "gptaktmksmcxtsbukkci"

    const sessionFromToken = await ethereumAdapter.sessionFromToken(token)

    console.log({ sessionFromToken })
})