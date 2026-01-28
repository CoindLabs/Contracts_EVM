import { defineConfig, configVariable } from "hardhat/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatVerifyPlugin from "@nomicfoundation/hardhat-verify";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin, hardhatVerifyPlugin],
  solidity: {
    profiles: {
      default: { version: "0.8.28" },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: { enabled: true, runs: 200 }, // 分账合约最优区间
        },
      },
    },
  },
  networks: {
    baseSepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("BASE_SEPOLIA_RPC"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
    base: {
      type: "http",
      chainType: "l1",
      url: configVariable("BASE_MAINNET_RPC"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
    bscTestnet: {
      type: "http",
      chainType: "l1",
      url: configVariable("BSC_TESTNET_RPC"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
    bsc: {
      type: "http",
      chainType: "l1",
      url: configVariable("BSC_MAINNET_RPC"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
});
