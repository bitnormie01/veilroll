const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying PayrollManager with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  // Phase 1 contract addresses (deployed on Arbitrum Sepolia)
  const MOCK_ERC20_ADDR = "0x155b9eee80e9f89f0594953bb9B9554d8b653a00";
  const CONF_PAY_TOKEN_ADDR = "0x08A1ABF57C949Db12848bE205498f492e9b5BBa6";

  // Get contract instances
  const mockERC20 = await hre.ethers.getContractAt("MockERC20", MOCK_ERC20_ADDR);
  const confPayToken = await hre.ethers.getContractAt("ConfPayToken", CONF_PAY_TOKEN_ADDR);

  // 1. Deploy PayrollManager
  console.log("\n--- Deploying PayrollManager ---");
  const PayrollManager = await hre.ethers.getContractFactory("PayrollManager");
  const payrollManager = await PayrollManager.deploy(CONF_PAY_TOKEN_ADDR, deployer.address);
  await payrollManager.waitForDeployment();
  const payrollAddr = await payrollManager.getAddress();
  console.log("PayrollManager deployed to:", payrollAddr);
  console.log("PayrollManager deploy tx:", payrollManager.deploymentTransaction().hash);

  // 2. Add employees
  console.log("\n--- Adding Employees ---");
  // Using deterministic test addresses (deployer will act as employer)
  const employee1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Hardhat account #1
  const employee2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Hardhat account #2

  const addEmp1Tx = await payrollManager.addEmployee(employee1);
  await addEmp1Tx.wait();
  console.log("Added employee 1:", employee1, "Tx:", addEmp1Tx.hash);

  const addEmp2Tx = await payrollManager.addEmployee(employee2);
  await addEmp2Tx.wait();
  console.log("Added employee 2:", employee2, "Tx:", addEmp2Tx.hash);

  // Verify employees
  const employees = await payrollManager.getEmployees();
  console.log("Current employees:", employees);
  console.log("Employee count:", employees.length);

  // 3. Set PayrollManager as operator on ConfPayToken
  console.log("\n--- Setting Operator ---");
  // Set operator until year 2030 (timestamp: 1893456000)
  const operatorUntil = 1893456000;
  const setOpTx = await confPayToken.setOperator(payrollAddr, operatorUntil);
  await setOpTx.wait();
  console.log("Set PayrollManager as operator. Tx:", setOpTx.hash);

  // Verify operator
  const isOp = await confPayToken.isOperator(deployer.address, payrollAddr);
  console.log("PayrollManager is operator:", isOp);

  // 4. Grant auditor access (test with a known address)
  console.log("\n--- Granting Auditor Access ---");
  const auditorAddr = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"; // Hardhat account #3
  const grantTx = await payrollManager.grantAuditorAccess(auditorAddr);
  await grantTx.wait();
  console.log("Granted auditor access to:", auditorAddr, "Tx:", grantTx.hash);

  // Verify auditors
  const auditors = await payrollManager.getAuditors();
  console.log("Current auditors:", auditors);

  // Summary
  console.log("\n========== PHASE 2 DEPLOYMENT SUMMARY ==========");
  console.log("Network:", hre.network.name);
  console.log("Deployer (Employer):", deployer.address);
  console.log("PayrollManager:", payrollAddr);
  console.log("ConfPayToken:", CONF_PAY_TOKEN_ADDR);
  console.log("MockERC20:", MOCK_ERC20_ADDR);
  console.log("Employee 1:", employee1);
  console.log("Employee 2:", employee2);
  console.log("Auditor:", auditorAddr);
  console.log("Deploy tx:", payrollManager.deploymentTransaction().hash);
  console.log("Add emp1 tx:", addEmp1Tx.hash);
  console.log("Add emp2 tx:", addEmp2Tx.hash);
  console.log("Set operator tx:", setOpTx.hash);
  console.log("Grant auditor tx:", grantTx.hash);
  console.log("=================================================");

  console.log("\n⚠️  BATCH PAY NOTE:");
  console.log("batchPay() requires encrypted amounts + inputProofs from the JS SDK.");
  console.log("This needs @iexec-nox/handle SDK integration — see test-auditor-decrypt.js");
  console.log("For now, the contract is deployed and employee/auditor management is verified.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
