import Foundation
import Security
import LocalAuthentication
import os.log

/// Manages storing/retrieving the vault's derived encryption key in Keychain
/// with Keychain-level biometric (Touch ID) protection via SecAccessControl.
///
/// When biometric is available, the derived key is stored with
/// `.biometryCurrentSet` so the OS enforces Touch ID at the Keychain layer.
/// This prevents other processes running as the user from reading the key
/// without biometric authentication.
final class KeychainService {
    static let shared = KeychainService()

    private let service = "com.knox.app"
    private let account = "vault-derived-key"
    private let log = OSLog(subsystem: "com.knox.app", category: "Keychain")

    private init() {}

    // MARK: - Store Key

    /// Stores the 32-byte derived key in Keychain (device-only).
    /// When biometric hardware is available, adds SecAccessControl with
    /// `.biometryCurrentSet` so the OS requires Touch ID for retrieval.
    @discardableResult
    func storeDerivedKey(_ keyData: Data) -> Bool {
        // Delete any existing item first
        deleteDerivedKey()

        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: keyData
        ]

        // Use SecAccessControl with biometric when available
        if BiometricService.shared.isBiometricAvailable,
           let access = SecAccessControlCreateWithFlags(
               nil,
               kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
               .biometryCurrentSet,
               nil
           ) {
            query[kSecAttrAccessControl as String] = access
        } else {
            // Fallback: no biometric hardware — use plain accessibility
            query[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        }

        let status = SecItemAdd(query as CFDictionary, nil)
        if status != errSecSuccess {
            os_log(.error, log: log, "SecItemAdd failed: %{public}d", status)
        }
        return status == errSecSuccess
    }

    // MARK: - Retrieve Key with Biometric Auth

    /// Retrieves the derived key from Keychain.
    /// If the key was stored with SecAccessControl + biometry, the OS will present
    /// the Touch ID prompt automatically — no separate LAContext call needed.
    func retrieveDerivedKey(reason: String, completion: @escaping (Data?) -> Void) {
        let context = LAContext()
        context.localizedFallbackTitle = "" // Hide "Enter Password" fallback
        context.localizedReason = reason

        // The Keychain query uses the LAContext so the OS can present Touch ID
        // as part of SecItemCopyMatching (single prompt, Keychain-enforced).
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecUseAuthenticationContext as String: context
        ]

        // Run on background thread since SecItemCopyMatching with biometric blocks
        DispatchQueue.global(qos: .userInitiated).async { [self] in
            var result: AnyObject?
            let status = SecItemCopyMatching(query as CFDictionary, &result)

            DispatchQueue.main.async {
                if status == errSecSuccess, let data = result as? Data {
                    completion(data)
                } else {
                    if status != errSecSuccess && status != errSecUserCanceled && status != errSecAuthFailed {
                        os_log(.error, log: self.log, "SecItemCopyMatching failed: %{public}d", status)
                    }
                    completion(nil)
                }
            }
        }
    }

    // MARK: - Delete Key

    @discardableResult
    func deleteDerivedKey() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }

    // MARK: - Check if Key Exists

    var hasDerivedKey: Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        let status = SecItemCopyMatching(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    // MARK: - Biometric Enabled Flag (UserDefaults)

    /// Persistent flag that survives app restarts without needing to decrypt the vault.
    /// Used by the lock screen to know whether to show the Touch ID button.
    static var biometricEnabledFlag: Bool {
        get { UserDefaults.standard.bool(forKey: "com.knox.biometricEnabled") }
        set { UserDefaults.standard.set(newValue, forKey: "com.knox.biometricEnabled") }
    }
}
