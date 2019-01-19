Integration test implementation for Adex Validator Network

## RUN TEST (Docker)

Run tests against docker setup validator stack
```bash
$ cd adex-validator-stack-js
$ docker-compose up
```

```bash
$ MONGODB_URL=mongodb://localhost:28000 npm test
```

### RUN TEST (Local machine)
Run tests against local machine setup validator stack

```bash
$ NOT_DOCKER=true npm test
```