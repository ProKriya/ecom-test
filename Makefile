.PHONY: test test-api dev deploy lint

test:
	npm test

test-api:
	npm run test:api

dev:
	npm run dev

deploy:
	npm run deploy

lint:
	npm run lint
