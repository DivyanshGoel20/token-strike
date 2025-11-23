#Token Strike

Token Strike is a Web3-powered arcade shooter where your real crypto deposits become your in-game strength. Your bullets, damage, and power-ups scale dynamically based on the USD value of the tokens you deposit.

Built for the World App Mini-App ecosystem, Token Strike blends on-chain logic with a fun retro arcade experience.

🚀 How It Works

Deposit supported tokens (WLD, WETH, WBTC) directly into the smart contract.

The contract uses Pyth on-chain price feeds to calculate your USD value.

Your bullets and damage auto-update based on simple formulas using your deposit value.

Launch the mini-app in World App and start playing instantly.

🕹️ Gameplay

Built using Phaser, a lightweight 2D game engine.

Retro, pixel-style characters and effects bring the shooter experience alive.

Your guns, power, and stats depend entirely on your token value — the more you deposit, the stronger you get.

🔗 Tech Overview (Simplified)

Smart Contract: Solidity contract deployed on World Chain, storing balances and calculating stats.

Price Feeds: Live token prices fetched using Pyth’s on-chain feeds.

Frontend: TypeScript app using ethers.js, Wagmi, and AppKit for wallet connections.

Mini-App Integration: Packaged and deployed to run inside the World App.

Game Engine: Phaser for animations, controls, and gameplay loops.

📦 Features

Real-time stat adjustments

Multi-token support

Seamless wallet connection

Fast deposits/withdrawals

On-chain transparency

Smooth World App mini-app experience
