import Foundation
import Security
import LocalAuthentication
import os.log

/// Manages storing/retrieving the vault's derived encryption key in Keychain
/// with application-level biometric (Touch ID) protection.
///
/// Uses app-level LAContext authentication instead of Keychain-level SecAccessControl
/// biometry, because the latter requires the restricted `keychain-access-groups`
/// entitlement which blocks Developer ID (non-App Store) apps from launching.
final class KeychainService {
    static let shared = KeychainService()

    private let service = "com.knox.app"
    private let account = "vault-derived-key"
    private let log = OSLog(subsystem: "com.knox.app", category: "Keychain")

    private init() {}

    // MARK: - Store Key

    /// Stores the 32-byte derived key in Keychain (device-only, accessible when unlocked).
    /// Biometric auth is enforced at the application level on retrieval, not at the Keychain level.
    @discardableResult
    func storeDerivedKey(_ keyData: Data) -> Bool {
        // Delete any existing item first
        deleteDerivedKey()

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: keyData,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        if status != errSecSuccess {
            os_log(.error, log: log, "SecItemAdd failed: %{public}d", status)
        }
        return status == errSecSuccess
    }

    // MARK: - Retrieve Key with Biometric Auth

    /// Authenticates the user with Touch ID, then retrieves the derived key from Keychain.
    func retrieveDerivedKey(reason: String, completion: @escaping (Data?) -> Void) {
        let context = LAContext()
        context.localizedFallbackTitle = "" // Hide "Enter Password" fallback

        // Step 1: Authenticate with Touch ID at the application level
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { [self] success, error in
            guard success else {
                if let error = error {
                    os_log(.error, log: log, "Touch ID auth failed: %{public}@", error.localizedDescription)
                }
                DispatchQueue.main.async { completion(nil) }
                return
            }

            // Step 2: Retrieve from Keychain (no biometric gate at Keychain level)
            let query: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: account,
                kSecReturnData as String: true
            ]

            var result: AnyObject?
            let status = SecItemCopyMatching(query as CFDictionary, &result)

            DispatchQueue.main.async {
                if status == errSecSuccess, let data = result as? Data {
                    completion(data)
                } else {
                    if status != errSecSuccess {
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
