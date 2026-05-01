// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC7984Receiver} from "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984Receiver.sol";
import {IERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984.sol";
import {
    Nox,
    euint256,
    externalEuint256,
    ebool
} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";

/**
 * @title PayrollManager
 * @dev Confidential batch payroll contract using ERC-7984 tokens.
 *
 * Features:
 * - Owner (employer) manages employee roster
 * - Batch-pay employees with encrypted amounts
 * - Selective auditor disclosure via Nox ACL (the differentiator)
 * - Implements IERC7984Receiver for receiving confidential tokens via transferAndCall
 *
 * Security model:
 * - Only owner can add/remove employees, execute batch payments, manage auditors
 * - Each employee can only decrypt their own payment handles
 * - Auditors get read-only decrypt access — cannot transfer tokens
 */
contract PayrollManager is Ownable, IERC7984Receiver {
    // --- State ---
    IERC7984 public immutable payToken;

    address[] private _employees;
    mapping(address => bool) public isEmployee;

    address[] private _auditors;
    mapping(address => bool) public isAuditor;

    // Track payment handles for auditor disclosure
    // paymentHandles[employee] = list of payment euint256 handles
    mapping(address => euint256[]) private _paymentHandles;

    // Track all employees who received payments (for auditor iteration)
    address[] private _paidEmployees;
    mapping(address => bool) private _hasPaidRecord;

    // --- Events ---
    event EmployeeAdded(address indexed employee);
    event EmployeeRemoved(address indexed employee);
    event PaymentSent(address indexed employee, euint256 indexed amount);
    event BatchPaymentCompleted(uint256 employeeCount);
    event AuditorGranted(address indexed auditor);
    event AuditorRevoked(address indexed auditor);

    // --- Errors ---
    error EmployeeAlreadyExists(address employee);
    error EmployeeNotFound(address employee);
    error AuditorAlreadyExists(address auditor);
    error AuditorNotFound(address auditor);
    error ArrayLengthMismatch();
    error EmptyBatch();

    constructor(IERC7984 payToken_, address owner_) Ownable(owner_) {
        payToken = payToken_;
    }

    // =============================================================
    //                     EMPLOYEE MANAGEMENT
    // =============================================================

    /**
     * @dev Add an employee to the payroll roster.
     */
    function addEmployee(address employee) external onlyOwner {
        if (isEmployee[employee]) revert EmployeeAlreadyExists(employee);
        isEmployee[employee] = true;
        _employees.push(employee);
        emit EmployeeAdded(employee);
    }

    /**
     * @dev Remove an employee from the payroll roster.
     * Does not delete payment history (auditor can still view past payments).
     */
    function removeEmployee(address employee) external onlyOwner {
        if (!isEmployee[employee]) revert EmployeeNotFound(employee);
        isEmployee[employee] = false;

        // Remove from array (swap-and-pop)
        for (uint256 i = 0; i < _employees.length; i++) {
            if (_employees[i] == employee) {
                _employees[i] = _employees[_employees.length - 1];
                _employees.pop();
                break;
            }
        }
        emit EmployeeRemoved(employee);
    }

    /**
     * @dev Returns the list of current employees.
     */
    function getEmployees() external view returns (address[] memory) {
        return _employees;
    }

    /**
     * @dev Returns the number of current employees.
     */
    function getEmployeeCount() external view returns (uint256) {
        return _employees.length;
    }

    // =============================================================
    //                      BATCH PAYMENT
    // =============================================================

    /**
     * @dev Record payment handles for employees after the employer has
     * transferred tokens directly via ConfPayToken.confidentialTransfer.
     *
     * Architecture note: The employer calls ConfPayToken.confidentialTransfer
     * directly (not through this contract) to avoid Nox ACL msg.sender
     * mismatches. This contract records the resulting handles and manages
     * auditor access — it's the bookkeeping + disclosure layer.
     *
     * @param employees Array of employee addresses who received payments
     * @param handles Array of resulting euint256 handles from the transfers
     */
    function recordPayments(
        address[] calldata employees,
        euint256[] calldata handles
    ) external onlyOwner {
        uint256 len = employees.length;
        if (len == 0) revert EmptyBatch();
        if (len != handles.length) revert ArrayLengthMismatch();

        for (uint256 i = 0; i < len; i++) {
            address employee = employees[i];
            euint256 handle = handles[i];

            // Store the payment handle for auditor disclosure
            _paymentHandles[employee].push(handle);

            // Track paid employees
            if (!_hasPaidRecord[employee]) {
                _paidEmployees.push(employee);
                _hasPaidRecord[employee] = true;
            }

            // Grant any current auditors access to this payment handle
            // NOTE: The employer must have called Nox.allow(handle, address(this))
            // before calling recordPayments, or the handle won't be accessible for
            // this contract to grant to auditors.
            // For now we skip Nox.allow here since it requires ACL permission on the handle.
            // Auditor grants are handled via grantAuditorAccess which reads stored handles.

            emit PaymentSent(employee, handle);
        }

        emit BatchPaymentCompleted(len);
    }

    // =============================================================
    //                   AUDITOR DISCLOSURE (differentiator)
    // =============================================================

    /**
     * @dev Register an auditor in the payroll system.
     * The auditor flag allows the frontend to query who has audit permissions.
     *
     * NOTE: Since the employer transfers tokens directly via ConfPayToken
     * (not through this contract), this contract does not have Nox ACL
     * permission on the payment handles. ACL grants must be made by the
     * employer directly via the Nox SDK / NoxCompute.allow() calls.
     * The frontend handles this in the "Grant Auditor" flow.
     */
    function grantAuditorAccess(address auditor) external onlyOwner {
        if (isAuditor[auditor]) revert AuditorAlreadyExists(auditor);
        isAuditor[auditor] = true;
        _auditors.push(auditor);
        emit AuditorGranted(auditor);
    }

    /**
     * @dev Revoke auditor access. New payments will not grant this auditor access.
     * NOTE: Nox ACL may not support retroactive revocation — the auditor may still
     * be able to decrypt previously-granted handles. This is a known limitation.
     * Documented per BLOCKER-003.
     */
    function revokeAuditorAccess(address auditor) external onlyOwner {
        if (!isAuditor[auditor]) revert AuditorNotFound(auditor);
        isAuditor[auditor] = false;

        // Remove from array (swap-and-pop)
        for (uint256 i = 0; i < _auditors.length; i++) {
            if (_auditors[i] == auditor) {
                _auditors[i] = _auditors[_auditors.length - 1];
                _auditors.pop();
                break;
            }
        }

        emit AuditorRevoked(auditor);
    }

    /**
     * @dev Returns the list of current auditors.
     */
    function getAuditors() external view returns (address[] memory) {
        return _auditors;
    }

    /**
     * @dev Returns the number of payment handles stored for an employee.
     * Useful for auditor UI to know how many payments to iterate.
     */
    function getPaymentCount(address employee) external view returns (uint256) {
        return _paymentHandles[employee].length;
    }

    /**
     * @dev Returns a specific payment handle for an employee.
     * The caller must have ACL permission (employee or auditor) to decrypt.
     */
    function getPaymentHandle(
        address employee,
        uint256 index
    ) external view returns (euint256) {
        return _paymentHandles[employee][index];
    }

    /**
     * @dev Returns all employees who have ever received a payment.
     * Used by auditor UI to list all payees.
     */
    function getPaidEmployees() external view returns (address[] memory) {
        return _paidEmployees;
    }

    // =============================================================
    //                    IERC7984Receiver
    // =============================================================

    /**
     * @dev Called by the ERC-7984 token when tokens are sent via confidentialTransferAndCall.
     * Accepts all incoming transfers and stores the handle.
     */
    function onConfidentialTransferReceived(
        address /*operator*/,
        address /*from*/,
        euint256 amount,
        bytes calldata /*data*/
    ) external override returns (ebool) {
        // Accept the transfer
        ebool accepted = Nox.toEbool(true);
        Nox.allowTransient(accepted, msg.sender);
        Nox.allowThis(amount);
        return accepted;
    }
}
