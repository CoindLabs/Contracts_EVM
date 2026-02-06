import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const NETWORK_TO_CHAIN_ID: Record<string, number> = {
  baseSepolia: 84532,
  base: 8453,
  bscTestnet: 97,
  bsc: 56,
};

const CONTRACT_KEY_HINT = "PayForwarder";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const NETWORK = process.env.HARDHAT_NETWORK ?? "baseSepolia";
  console.log(`\n[Deploy] Network: ${NETWORK}`);

  const chainId = NETWORK_TO_CHAIN_ID[NETWORK];
  if (!chainId) {
    throw new Error(
      `Unknown network "${NETWORK}", supported: ${Object.keys(
        NETWORK_TO_CHAIN_ID,
      ).join(", ")}`,
    );
  }

  const deploymentPath = path.resolve(
    __dirname,
    `../ignition/deployments/chain-${chainId}/deployed_addresses.json`,
  );

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found:\n${deploymentPath}`);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  // 自动匹配 PayForwarder
  const matchedKey = Object.keys(deployments).find((k) =>
    k.includes(CONTRACT_KEY_HINT),
  );

  if (!matchedKey) {
    throw new Error(`Could not find ${CONTRACT_KEY_HINT} in deployed JSON`);
  }

  const contractAddress = deployments[matchedKey];
  console.log(`[Deploy] PayForwarder: ${contractAddress}`);

  const outputPath = path.resolve(
    __dirname,
    `../deployed/chain_${NETWORK}.json`,
  );
  const output = {
    network: NETWORK,
    chainId,
    contract: contractAddress,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`[Deploy] Saved to ${outputPath}\n`);
}

main().catch((err) => {
  console.error("[Deploy] Failed:", err);
  process.exit(1);
});
