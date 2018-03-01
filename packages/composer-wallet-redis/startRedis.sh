#!/bin/bash
docker start composer-wallet-redis || docker run -p 6379:6379 --name composer-wallet-redis -d redis
docker exec composer-wallet-redis redis-cli -c flushall
