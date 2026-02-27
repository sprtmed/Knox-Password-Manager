import Foundation
import Security
import LocalAuthentication
import os.log

/// Manages storing/retrieving the vault's derived encryption key in Keychain
/// with biometric (Touch ID) protection.
final class KeychainService {
    static let shared = KeychainService()

    private let service = "com.knox.app"
    private let account = "vault-derived-key"
    private let log = OSLog(subsystem: "com.knox.app", category: "Keychain")

    private init() {}

    // MARK: - Store Key with Biometric Protection

    /// Stores the 32-byte derived key in Keychain protected by Touch ID.
    /// The key is invalidated if biometric enrollment changes (.biometryCurrentSet).
    @discardableResult
    func storeDerivedKey(_ keyData: Data) -> Bool {
        // Delete any existing item first
        deleteDerivedKey()

        var acError: Unmanaged<CFError>?
        guard let accessControl = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            .biometryCurrentSet,
            &acError
        ) else {
            os_log(.error, log: log, "SecAccessControl creation failed: %{public}@",
                   acError?.takeRetainedValue().localizedDescription ?? "unknown")
            return false
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: keyData,
            kSecAttrAccessControl as String: accessControl
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        if status != errSecSuccess {
            os_log(.error, log: log, "SecItemAdd failed: %{public}d", status)
        }
        return status == errSecSuccess
    }

    // MARK: - Retrieve Key with Biometric Auth

    /// Retrieves the derived key from Keychain. Triggers Touch ID automatically.
    func retrieveDerivedKey(reason: String, completion: @escaping (Data?) -> Void) {
        let context = LAContext()
        context.localizedFallbackTitle = "" // Hide "Enter Password" fallback

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecUseAuthenticationContext as String: context,
            kSecUseOperationPrompt as String: reason
        ]

        DispatchQueue.global(qos: .userInitiated).async {
            var result: AnyObject?
            let status = SecItemCopyMatching(query as CFDictionary, &result)

            DispatchQueue.main.async {
                if status == errSecSuccess, let data = result as? Data {
                    completion(data)
                } else {
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
            kSecAttrAccount as String: account,
            kSecUseAuthenticationUI as String: kSecUseAuthenticationUIFail
        ]
        let status = SecItemCopyMatching(query as CFDictionary, nil)
        // errSecInteractionNotAllowed means the item exists but requires biometric auth
        return status == errSecSuccess || status == errSecInteractionNotAllowed
    }

    // MARK: - Biometric Enabled Flag (UserDefaults)

    /// Persistent flag that survives app restarts without needing to decrypt the vault.
    /// Used by the lock screen to know whether to show the Touch ID button.
    static var biometricEnabledFlag: Bool {
        get { UserDefaults.standard.bool(forKey: "com.knox.biometricEnabled") }
        set { UserDefaults.standard.set(newValue, forKey: "com.knox.biometricEnabled") }
    }
}
