# Changelog

## [1.1.0](https://github.com/italofelipe/auraxis-app/compare/v1.0.0...v1.1.0) (2026-03-07)


### Features

* **app:** initial expo project scaffold (SDK 54 + RN 0.81) ([9d3b6a3](https://github.com/italofelipe/auraxis-app/commit/9d3b6a3a70b07f845a1b8e9e019effcc53276787))
* **app:** scaffold placeholder screens and pre-feature architecture ([#24](https://github.com/italofelipe/auraxis-app/issues/24)) ([fcb0e3c](https://github.com/italofelipe/auraxis-app/commit/fcb0e3c690f413e31601d4d9324e76590c6f7031))
* **flags:** integrate runtime feature toggles for tools ([#31](https://github.com/italofelipe/auraxis-app/issues/31)) ([56d1079](https://github.com/italofelipe/auraxis-app/commit/56d1079627d4d297e7e3055af2f510d2be76d984))
* **flags:** integrate unleash provider runtime on app ([#32](https://github.com/italofelipe/auraxis-app/issues/32)) ([5848567](https://github.com/italofelipe/auraxis-app/commit/5848567c196327edbf0af53412aa0f17c16163b6))
* **quality:** add security, E2E, testing and observability tooling ([884122c](https://github.com/italofelipe/auraxis-app/commit/884122c94fcb211cd7033cf288ea9488e26b3d92))


### Bug Fixes

* **app:** set android package for non-interactive eas builds ([#23](https://github.com/italofelipe/auraxis-app/issues/23)) ([1a6d99d](https://github.com/italofelipe/auraxis-app/commit/1a6d99db92ab970e03f3813cd6885cf92469584d))
* **ci:** detect dependabot pr author correctly ([#120](https://github.com/italofelipe/auraxis-app/issues/120)) ([e08beea](https://github.com/italofelipe/auraxis-app/commit/e08beeadf3bc31d9bb1dbf798338405050fea1ab))
* **ci:** gate sonar scanner behind repo variable in app ([bc56f93](https://github.com/italofelipe/auraxis-app/commit/bc56f93f051dcb81b87c88a743e7200d95a0b395))
* **ci:** harden PR comment permissions and audit gate exceptions ([b5253cc](https://github.com/italofelipe/auraxis-app/commit/b5253cc858a61424b684edc36faf48220d711bd8))
* **ci:** make app dependency review resilient and repair Sonar paths ([77bf1d1](https://github.com/italofelipe/auraxis-app/commit/77bf1d10afbd0c6283321f60313628ae9a61bdbd))
* **ci:** move workflow permissions to job scope in app pipelines ([ac25dbe](https://github.com/italofelipe/auraxis-app/commit/ac25dbe9cfeb460b74f455d2c5c9f146034e2d1f))
* **ci:** pin sonar action and align app sonar organization ([4acdfce](https://github.com/italofelipe/auraxis-app/commit/4acdfce1789a00553b2bd5229d406295d060d37f))
* **ci:** use eas cli binary in store release workflow ([#22](https://github.com/italofelipe/auraxis-app/issues/22)) ([f5b4fae](https://github.com/italofelipe/auraxis-app/commit/f5b4faeff01307d0d7284036b8621c026b8dfb6d))
* **tsconfig:** exclude e2e/ from main typecheck (Detox has its own tsconfig) ([52ee8ca](https://github.com/italofelipe/auraxis-app/commit/52ee8ca9e9065d014fa34725110470d77e53898a))

## Changelog

All notable changes to this project will be documented in this file.

This file is the baseline for automated release management via Release Please.
Subsequent entries should be generated from release automation.
