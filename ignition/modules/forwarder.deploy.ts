import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PayForwarderModule = buildModule("PayForwarderModule", (m) => {
  const owner = m.getAccount(0); // 默认 deployer

  const payForwarder = m.contract("PayForwarder", [owner]);

  return { PayForwarder: payForwarder };
});

export default PayForwarderModule;
