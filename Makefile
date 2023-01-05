all:
	make reinstall
	# TODO
	cd libs/sota-common && rm -rf node_modules && npm i
	make rebuild

rebuild:
	rm -rf dist/bin dist/libs && tsc
	make deps

rebuild-one:
	rm -rf dist/bin/$(t) dist/libs/sota-$(t) && tsc
	make dep t=libs/sota-$(t)
	make dep t=bin/$(t)

build:
	tsc
	make deps

dep:
	cp -f $(t)/package.json dist/$(t)/
	cd dist/$(t) && npm i

deps:
	make dep t=libs/sota-common
	make dep t=libs/sota-btc
	make dep t=libs/sota-bsc
	make dep t=libs/sota-eos
	make dep t=libs/sota-bch
	make dep t=libs/sota-ltc
	make dep t=libs/sota-eth
	make dep t=libs/sota-xrp
	make dep t=libs/sota-ada
	make dep t=libs/wallet-core
	make dep t=bin/eos
	make dep t=bin/btc
	make dep t=bin/bsc
	make dep t=bin/bch
	make dep t=bin/ltc
	make dep t=bin/eth
	make dep t=bin/xrp
	make dep t=bin/ada
	make dep t=bin/common
	make dep t=bin/typeorm_migration

ts-dep-reinstall:
	cd $(t) && rm -rf node_modules package-lock.json && npm i

ts-dep-install:
	cd $(t) && rm -rf package-lock.json && npm i

ts-deps:
	make ts-dep-install t=./
	make ts-dep-install t=libs/sota-common
	make ts-dep-install t=libs/sota-btc
	make ts-dep-install t=libs/sota-bsc
	make ts-dep-install t=libs/sota-eos
	make ts-dep-install t=libs/sota-bch
	make ts-dep-install t=libs/sota-ltc
	make ts-dep-install t=libs/sota-eth
	make ts-dep-install t=libs/sota-xrp
	make ts-dep-install t=libs/sota-ada
	make ts-dep-install t=libs/wallet-core
	make ts-dep-install t=bin/btc
	make ts-dep-install t=bin/bsc
	make ts-dep-install t=bin/bch
	make ts-dep-install t=bin/ltc
	make ts-dep-install t=bin/eos
	make ts-dep-install t=bin/eth
	make ts-dep-install t=bin/xrp
	make ts-dep-install t=bin/ada
	make ts-dep-install t=bin/common
	make ts-dep-install t=bin/typeorm_migration

ts-dep-reinstall-fix:
	cd $(t) && rm -rf node_modules && npm i

ts-deps-reinstall:
	make ts-dep-reinstall t=./
	make ts-dep-reinstall-fix t=libs/sota-common
	make ts-dep-reinstall t=libs/sota-btc
	make ts-dep-reinstall t=libs/sota-bsc
	make ts-dep-reinstall t=libs/sota-eos
	make ts-dep-reinstall t=libs/sota-bch
	make ts-dep-reinstall t=libs/sota-ltc
	make ts-dep-reinstall t=libs/sota-eth
	make ts-dep-reinstall-fix t=libs/sota-xrp
	make ts-dep-reinstall t=libs/sota-ada
	make ts-dep-reinstall t=libs/wallet-core
	make ts-dep-reinstall t=bin/typeorm_migration
	make ts-dep-reinstall t=bin/eos
	make ts-dep-reinstall t=bin/btc
	make ts-dep-reinstall t=bin/bsc
	make ts-dep-reinstall t=bin/bch
	make ts-dep-reinstall t=bin/ltc
	make ts-dep-reinstall t=bin/eth
	make ts-dep-reinstall t=bin/xrp
	make ts-dep-reinstall t=bin/ada
	make ts-dep-reinstall t=bin/common

install:
	make ts-deps

reinstall:
	make ts-deps-reinstall

migrations:
	cd bin/typeorm_migration && npm run migrations
