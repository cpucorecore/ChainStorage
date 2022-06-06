all: compile

compile: $(wildcard test/*) $(wildcard contracts/**/*)
	npx hardhat compile --force

.PHONY: test
test: $(wildcard test/*) $(wildcard contracts/**/*)
	npx hardhat test test/File.ts
	npx hardhat test test/Node.ts
	npx hardhat test test/Node2.ts
	npx hardhat test test/NodeSelector.ts
	npx hardhat test test/User.ts
	npx hardhat test test/UserAction.ts
	npx hardhat test test/UserAction2.ts
	npx hardhat test test/Monitor.ts
	npx hardhat test test/Event.ts
	npx hardhat test test/Setting.ts
	npx hardhat test test/Task.ts

