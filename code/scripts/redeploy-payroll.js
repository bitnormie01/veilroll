/**
 * Redeploy PayrollManager only (v2 — fixed ACL flow)
 * Reuses existing MockERC20 and ConfPayToken.
 */
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const CONF_PAY_TOKEN = "0x08A1ABF57C949Db12848bE205498f492e9b5BBa6";

  // Deploy PayrollManager v2
  console.log("\nDeploying PayrollManager v2...");
  const PayrollManager = await hre.ethers.getContractFactory("PayrollManager");
  const payroll = await PayrollManager.deploy(CONF_PAY_TOKEN, deployer.address);
  await payroll.waitForDeployment();
  const payrollAddr = await payroll.getAddress();
  console.log("PayrollManager v2:", payrollAddr);

  // Set as operator on ConfPayToken
  console.log("\nSetting as operator on ConfPayToken...");
  const confPay = await hre.ethers.getContractAt(
    ["function setOperator(address operator, uint48 until)"],
    CONF_PAY_TOKEN,
    deployer
  );
  const tx = await confPay.setOperator(payrollAddr, 1893456000);
  await tx.wait();
  console.log("Operator set.");

  console.log("\n=== DONE ===");
  console.log("Update CONTRACTS config with new PayrollManager:", payrollAddr);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
