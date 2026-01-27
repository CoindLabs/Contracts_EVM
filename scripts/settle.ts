import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const NETWORK = process.env.HARDHAT_NETWORK ?? "baseSepolia";
  console.log(`\n[Settle] Network: ${NETWORK}`);

  const deployedPath = path.resolve(__dirname, "../deployed.json");
  if (!fs.existsSync(deployedPath)) {
    throw new Error("deployed.json not found");
  }

  const { contract } = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
  console.log(`[Settle] PayForwarder: ${contract}`);

  const connection: any = await network.connect({ network: NETWORK });
  const viem = connection.viem;
  const publicClient = await viem.getPublicClient();
  const [wallet] = await viem.getWalletClients();

  console.log(`[Settle] Executor: ${wallet.account.address}`);

  const merchantsPath = path.resolve(__dirname, "../config/merchants_ETH.json");
  if (!fs.existsSync(merchantsPath)) {
    throw new Error("merchants.json not found");
  }

  const merchants = JSON.parse(fs.readFileSync(merchantsPath, "utf8"));

  const logPath = path.resolve(__dirname, "../config/settle.log.json");
  const logs = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath, "utf8"))
    : [];

  const abi = (
    await import("../artifacts/contracts/PayForwarder.sol/PayForwarder.json", {
      assert: { type: "json" },
    })
  ).default.abi;

  for (const m of merchants) {
    console.log(`[Settle] Merchant: ${m.merchant}`);

    try {
      const hash = await wallet.writeContract({
        address: contract,
        abi,
        functionName: "forward",
        args: [
          m.token,
          m.merchant,
          m.treasury,
          BigInt(m.amount),
          m.feeBps,
          m.reserveBps,
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      logs.push({
        network: NETWORK,
        token: m.token,
        merchant: m.merchant,
        amount: m.amount,
        feeBps: m.feeBps,
        reserveBps: m.reserveBps,
        txHash: hash,
        status: "completed",
        timestamp: new Date().toISOString(),
      });

      console.log(`[Settle] ✅ Success: ${hash}`);
    } catch (err) {
      logs.push({
        network: NETWORK,
        token: m.token,
        merchant: m.merchant,
        amount: m.amount,
        error: String(err),
        status: "failed",
        timestamp: new Date().toISOString(),
      });

      console.error(`[Settle] ❌ Failed`, err);
    }
  }

  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  console.log(`[Settle] Log saved: ${logPath}\n`);
}

main().catch((err) => {
  console.error("[Settle] Fatal:", err);
  process.exit(1);
});
