const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy MockERC20
  console.log("\n--- Deploying MockERC20 ---");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy("Mock USDC", "mUSDC");
  await mockERC20.waitForDeployment();
  const mockAddr = await mockERC20.getAddress();
  console.log("MockERC20 deployed to:", mockAddr);
  console.log("MockERC20 deploy tx:", mockERC20.deploymentTransaction().hash);

  // 2. Deploy ConfPayToken (ERC-7984 wrapper)
  console.log("\n--- Deploying ConfPayToken ---");
  const ConfPayToken = await hre.ethers.getContractFactory("ConfPayToken");
  const confPayToken = await ConfPayToken.deploy(mockAddr);
  await confPayToken.waitForDeployment();
  const confPayAddr = await confPayToken.getAddress();
  console.log("ConfPayToken deployed to:", confPayAddr);
  console.log("ConfPayToken deploy tx:", confPayToken.deploymentTransaction().hash);

  // 3. Verify ERC-7984 interface support (ERC-165 check)
  const ERC7984_INTERFACE_ID = "0x4958f2a4";
  const supportsERC7984 = await confPayToken.supportsInterface(ERC7984_INTERFACE_ID);
  console.log("\nSupports ERC-7984 (0x4958f2a4):", supportsERC7984);

  // 4. Mint MockERC20 to deployer
  console.log("\n--- Minting MockERC20 ---");
  const mintAmount = hre.ethers.parseEther("10000");
  const mintTx = await mockERC20.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("Minted 10000 mUSDC to deployer. Tx:", mintTx.hash);

  const balance = await mockERC20.balanceOf(deployer.address);
  console.log("MockERC20 balance:", hre.ethers.formatEther(balance));

  // 5. Approve ConfPayToken to spend MockERC20
  console.log("\n--- Approving ConfPayToken ---");
  const approveTx = await mockERC20.approve(confPayAddr, mintAmount);
  await approveTx.wait();
  console.log("Approved ConfPayToken to spend 10000 mUSDC. Tx:", approveTx.hash);

  // 6. Wrap ERC-20 → ERC-7984
  console.log("\n--- Wrapping tokens ---");
  const wrapAmount = hre.ethers.parseEther("1000");
  const wrapTx = await confPayToken.wrap(deployer.address, wrapAmount);
  const wrapReceipt = await wrapTx.wait();
  console.log("Wrapped 1000 mUSDC → CPAY. Tx:", wrapTx.hash);
  console.log("Wrap block:", wrapReceipt.blockNumber);

  // 7. Check confidential balance handle exists
  const confBalance = await confPayToken.confidentialBalanceOf(deployer.address);
  console.log("\nConfidential balance handle (bytes32):", confBalance);
  console.log("Handle is non-zero:", confBalance !== "0x0000000000000000000000000000000000000000000000000000000000000000");

  // 8. Check underlying token balance decreased
  const remainingBalance = await mockERC20.balanceOf(deployer.address);
  console.log("Remaining MockERC20 balance:", hre.ethers.formatEther(remainingBalance));

  // Summary
  console.log("\n========== DEPLOYMENT SUMMARY ==========");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("MockERC20:", mockAddr);
  console.log("ConfPayToken:", confPayAddr);
  console.log("ERC-7984 supported:", supportsERC7984);
  console.log("Mint tx:", mintTx.hash);
  console.log("Approve tx:", approveTx.hash);
  console.log("Wrap tx:", wrapTx.hash);
  console.log("=========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
