export const CONTRACTS = {
  "MockERC20": {
    "address": "0x155b9eee80e9f89f0594953bb9B9554d8b653a00",
    "abi": [
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "name_",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol_",
            "type": "string"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "allowance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "needed",
            "type": "uint256"
          }
        ],
        "name": "ERC20InsufficientAllowance",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "balance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "needed",
            "type": "uint256"
          }
        ],
        "name": "ERC20InsufficientBalance",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "approver",
            "type": "address"
          }
        ],
        "name": "ERC20InvalidApprover",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "receiver",
            "type": "address"
          }
        ],
        "name": "ERC20InvalidReceiver",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          }
        ],
        "name": "ERC20InvalidSender",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "ERC20InvalidSpender",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  },
  "ConfPayToken": {
    "address": "0x08A1ABF57C949Db12848bE205498f492e9b5BBa6",
    "abi": [
      {
        "inputs": [
          {
            "internalType": "contract IERC20",
            "name": "underlying_",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "receiver",
            "type": "address"
          }
        ],
        "name": "ERC7984InvalidReceiver",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          }
        ],
        "name": "ERC7984InvalidSender",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "ERC7984TotalSupplyOverflow",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "caller",
            "type": "address"
          }
        ],
        "name": "ERC7984UnauthorizedCaller",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "holder",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "ERC7984UnauthorizedSpender",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "euint256",
            "name": "amount",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          }
        ],
        "name": "ERC7984UnauthorizedUseOfEncryptedAmount",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "holder",
            "type": "address"
          }
        ],
        "name": "ERC7984ZeroBalance",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "euint256",
            "name": "unwrapRequestId",
            "type": "bytes32"
          }
        ],
        "name": "InvalidUnwrapRequest",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "MalformedDecryptedData",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          }
        ],
        "name": "SafeERC20FailedOperation",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "euint256",
            "name": "amount",
            "type": "bytes32"
          }
        ],
        "name": "ConfidentialTransfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "holder",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint48",
            "name": "until",
            "type": "uint48"
          }
        ],
        "name": "OperatorSet",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "receiver",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "euint256",
            "name": "encryptedAmount",
            "type": "bytes32"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "plaintextAmount",
            "type": "uint256"
          }
        ],
        "name": "UnwrapFinalized",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "receiver",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "euint256",
            "name": "amount",
            "type": "bytes32"
          }
        ],
        "name": "UnwrapRequested",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "confidentialBalanceOf",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "confidentialTotalSupply",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "externalEuint256",
            "name": "encryptedAmount",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "inputProof",
            "type": "bytes"
          }
        ],
        "name": "confidentialTransfer",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "euint256",
            "name": "amount",
            "type": "bytes32"
          }
        ],
        "name": "confidentialTransfer",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "euint256",
            "name": "amount",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "confidentialTransferAndCall",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "transferred",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "externalEuint256",
            "name": "encryptedAmount",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "inputProof",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "confidentialTransferAndCall",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "transferred",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "externalEuint256",
            "name": "encryptedAmount",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "inputProof",
            "type": "bytes"
          }
        ],
        "name": "confidentialTransferFrom",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "euint256",
            "name": "amount",
            "type": "bytes32"
          }
        ],
        "name": "confidentialTransferFrom",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "externalEuint256",
            "name": "encryptedAmount",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "inputProof",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "confidentialTransferFromAndCall",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "transferred",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "euint256",
            "name": "amount",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "confidentialTransferFromAndCall",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "transferred",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "contractURI",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "euint256",
            "name": "unwrapRequestId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "decryptedAmountAndProof",
            "type": "bytes"
          }
        ],
        "name": "finalizeUnwrap",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "inferredTotalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "holder",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "isOperator",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "maxTotalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "onTransferReceived",
        "outputs": [
          {
            "internalType": "bytes4",
            "name": "",
            "type": "bytes4"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "internalType": "uint48",
            "name": "until",
            "type": "uint48"
          }
        ],
        "name": "setOperator",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes4",
            "name": "interfaceId",
            "type": "bytes4"
          }
        ],
        "name": "supportsInterface",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "underlying",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "externalEuint256",
            "name": "encryptedAmount",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "inputProof",
            "type": "bytes"
          }
        ],
        "name": "unwrap",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "euint256",
            "name": "amount",
            "type": "bytes32"
          }
        ],
        "name": "unwrap",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "euint256",
            "name": "unwrapAmount",
            "type": "bytes32"
          }
        ],
        "name": "unwrapRequester",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "wrap",
        "outputs": [
          {
            "internalType": "euint256",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  },
  "PayrollManager": {
      "address": "0xe3A2240060e1f52D84d8acE41dBb908aF53B3825",
      "abi": [
          {
              "inputs": [
                  {
                      "internalType": "contract IERC7984",
                      "name": "payToken_",
                      "type": "address"
                  },
                  {
                      "internalType": "address",
                      "name": "owner_",
                      "type": "address"
                  }
              ],
              "stateMutability": "nonpayable",
              "type": "constructor"
          },
          {
              "inputs": [],
              "name": "ArrayLengthMismatch",
              "type": "error"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "auditor",
                      "type": "address"
                  }
              ],
              "name": "AuditorAlreadyExists",
              "type": "error"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "auditor",
                      "type": "address"
                  }
              ],
              "name": "AuditorNotFound",
              "type": "error"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "employee",
                      "type": "address"
                  }
              ],
              "name": "EmployeeAlreadyExists",
              "type": "error"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "employee",
                      "type": "address"
                  }
              ],
              "name": "EmployeeNotFound",
              "type": "error"
          },
          {
              "inputs": [],
              "name": "EmptyBatch",
              "type": "error"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "owner",
                      "type": "address"
                  }
              ],
              "name": "OwnableInvalidOwner",
              "type": "error"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "account",
                      "type": "address"
                  }
              ],
              "name": "OwnableUnauthorizedAccount",
              "type": "error"
          },
          {
              "anonymous": false,
              "inputs": [
                  {
                      "indexed": true,
                      "internalType": "address",
                      "name": "auditor",
                      "type": "address"
                  }
              ],
              "name": "AuditorGranted",
              "type": "event"
          },
          {
              "anonymous": false,
              "inputs": [
                  {
                      "indexed": true,
                      "internalType": "address",
                      "name": "auditor",
                      "type": "address"
                  }
              ],
              "name": "AuditorRevoked",
              "type": "event"
          },
          {
              "anonymous": false,
              "inputs": [
                  {
                      "indexed": false,
                      "internalType": "uint256",
                      "name": "employeeCount",
                      "type": "uint256"
                  }
              ],
              "name": "BatchPaymentCompleted",
              "type": "event"
          },
          {
              "anonymous": false,
              "inputs": [
                  {
                      "indexed": true,
                      "internalType": "address",
                      "name": "employee",
                      "type": "address"
                  }
              ],
              "name": "EmployeeAdded",
              "type": "event"
          },
          {
              "anonymous": false,
              "inputs": [
                  {
                      "indexed": true,
                      "internalType": "address",
                      "name": "employee",
                      "type": "address"
                  }
              ],
              "name": "EmployeeRemoved",
              "type": "event"
          },
          {
              "anonymous": false,
              "inputs": [
                  {
                      "indexed": true,
                      "internalType": "address",
                      "name": "previousOwner",
                      "type": "address"
                  },
                  {
                      "indexed": true,
                      "internalType": "address",
                      "name": "newOwner",
                      "type": "address"
                  }
              ],
              "name": "OwnershipTransferred",
              "type": "event"
          },
          {
              "anonymous": false,
              "inputs": [
                  {
                      "indexed": true,
                      "internalType": "address",
                      "name": "employee",
                      "type": "address"
                  },
                  {
                      "indexed": true,
                      "internalType": "euint256",
                      "name": "amount",
                      "type": "bytes32"
                  }
              ],
              "name": "PaymentSent",
              "type": "event"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "employee",
                      "type": "address"
                  }
              ],
              "name": "addEmployee",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
          },
          {
              "inputs": [],
              "name": "getAuditors",
              "outputs": [
                  {
                      "internalType": "address[]",
                      "name": "",
                      "type": "address[]"
                  }
              ],
              "stateMutability": "view",
              "type": "function"
          },
          {
              "inputs": [],
              "name": "getEmployeeCount",
              "outputs": [
                  {
                      "internalType": "uint256",
                      "name": "",
                      "type": "uint256"
                  }
              ],
              "stateMutability": "view",
              "type": "function"
          },
          {
              "inputs": [],
              "name": "getEmployees",
              "outputs": [
                  {
                      "internalType": "address[]",
                      "name": "",
                      "type": "address[]"
                  }
              ],
              "stateMutability": "view",
              "type": "function"
          },
          {
              "inputs": [],
              "name": "getPaidEmployees",
              "outputs": [
                  {
                      "internalType": "address[]",
                      "name": "",
                      "type": "address[]"
                  }
              ],
              "stateMutability": "view",
              "type": "function"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "employee",
                      "type": "address"
                  }
              ],
              "name": "getPaymentCount",
              "outputs": [
                  {
                      "internalType": "uint256",
                      "name": "",
                      "type": "uint256"
                  }
              ],
              "stateMutability": "view",
              "type": "function"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "employee",
                      "type": "address"
                  },
                  {
                      "internalType": "uint256",
                      "name": "index",
                      "type": "uint256"
                  }
              ],
              "name": "getPaymentHandle",
              "outputs": [
                  {
                      "internalType": "euint256",
                      "name": "",
                      "type": "bytes32"
                  }
              ],
              "stateMutability": "view",
              "type": "function"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "auditor",
                      "type": "address"
                  }
              ],
              "name": "grantAuditorAccess",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "",
                      "type": "address"
                  }
              ],
              "name": "isAuditor",
              "outputs": [
                  {
                      "internalType": "bool",
                      "name": "",
                      "type": "bool"
                  }
              ],
              "stateMutability": "view",
              "type": "function"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "",
                      "type": "address"
                  }
              ],
              "name": "isEmployee",
              "outputs": [
                  {
                      "internalType": "bool",
                      "name": "",
                      "type": "bool"
                  }
              ],
              "stateMutability": "view",
              "type": "function"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "",
                      "type": "address"
                  },
                  {
                      "internalType": "address",
                      "name": "",
                      "type": "address"
                  },
                  {
                      "internalType": "euint256",
                      "name": "amount",
                      "type": "bytes32"
                  },
                  {
                      "internalType": "bytes",
                      "name": "",
                      "type": "bytes"
                  }
              ],
              "name": "onConfidentialTransferReceived",
              "outputs": [
                  {
                      "internalType": "ebool",
                      "name": "",
                      "type": "bytes32"
                  }
              ],
              "stateMutability": "nonpayable",
              "type": "function"
          },
          {
              "inputs": [],
              "name": "owner",
              "outputs": [
                  {
                      "internalType": "address",
                      "name": "",
                      "type": "address"
                  }
              ],
              "stateMutability": "view",
              "type": "function"
          },
          {
              "inputs": [],
              "name": "payToken",
              "outputs": [
                  {
                      "internalType": "contract IERC7984",
                      "name": "",
                      "type": "address"
                  }
              ],
              "stateMutability": "view",
              "type": "function"
          },
          {
              "inputs": [
                  {
                      "internalType": "address[]",
                      "name": "employees",
                      "type": "address[]"
                  },
                  {
                      "internalType": "euint256[]",
                      "name": "handles",
                      "type": "bytes32[]"
                  }
              ],
              "name": "recordPayments",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "employee",
                      "type": "address"
                  }
              ],
              "name": "removeEmployee",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
          },
          {
              "inputs": [],
              "name": "renounceOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "auditor",
                      "type": "address"
                  }
              ],
              "name": "revokeAuditorAccess",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
          },
          {
              "inputs": [
                  {
                      "internalType": "address",
                      "name": "newOwner",
                      "type": "address"
                  }
              ],
              "name": "transferOwnership",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
          }
      ]
  }
};

export const CHAIN_ID = 421614;
export const CHAIN_NAME = "Arbitrum Sepolia";
export const RPC_URL = "https://arbitrum-sepolia-rpc.publicnode.com";
export const EXPLORER_URL = "https://sepolia.arbiscan.io";
