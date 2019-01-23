# Integration test implementation for Adex Validator Network

## Clone

It's important to use `--recursive` when cloning this repo, as `adex-validator-stack-js` is included as a submodule

```
git clone --recursive https://github.com/AdExNetwork/adex-validator-stack-test
( cd adex-validator-stack-js && npm i )
```

## Configuration
The following can be overridden via environment variables
- MONGODB_URL (for docker default =(MONGODB_URL=mongodb://localhost:28000))
- LEADER_DATABASE (default = "adexValidator")
- FOLLOWER_DATABASE (default= "adexValidatorFollower")
- LEADER_PORT (default=8005)
- FOLLOWER_PORT (default=8006)
- FOLLOWER_IDENTITY (default="awesomeFollower")
- LEADER_IDENTITY (default="awesomeLeader")

## RUN TEST (Docker)

Run tests against docker validator stack setup
Setup Docker
```bash
$ cd adex-validator-stack-js
$ npm install
$ docker-compose up
```
Run tests
```bash
$ npm run test-docker
```

## RUN TEST (Local machine)

You can create a local validator stack setup with 
the below configuration
### Leader

#### Sentry

```
node bin/sentry --adapter=dummy --dummyIdentity=awesomeLeader
```

#### Validator Worker

```
node bin/validatorWorker.js --adapter=dummy --dummyIdentity=awesomeLeader
```

### Follower

#### Sentry

```
DB_MONGO_NAME=adexValidatorFollower PORT=8006 node bin/sentry --adapter=dummy --dummyIdentity=awesomeFollower
```


#### Validator Worker
```
DB_MONGO_NAME=adexValidatorFollower node bin/validatorWorker.js --adapter=dummy --dummyIdentity=awesomeFollower
```

Run tests against local machine validator stack setup

```bash
$ npm run test-local
```
