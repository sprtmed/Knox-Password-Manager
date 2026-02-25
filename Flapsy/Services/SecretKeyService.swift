import Foundation
import Security

/// Manages the 128-bit Secret Key that supplements the master password.
///
/// The Secret Key adds 128 bits of entropy to key derivation, making brute-force
/// infeasible even with a weak master password. It is stored in the Keychain
/// (device-only, not synced) and displayed to the user once for backup.
///
/// Key derivation chain:
///   passwordKey = Argon2id(password, salt)
///   finalKey = HKDF-SHA256(ikm: passwordKey, salt: secretKey, info: "com.knox.vault-key")
final class SecretKeyService {
    static let shared = SecretKeyService()

    private let service = "com.knox.app"
    private let account = "vault-secret-key"

    /// Length of the Secret Key in bytes (128 bits).
    static let keyLength = 16

    private init() {}

    // MARK: - Generate

    /// Generates a new cryptographically random 128-bit Secret Key.
    func generateSecretKey() -> Data {
        var bytes = [UInt8](repeating: 0, count: SecretKeyService.keyLength)
        let status = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        guard status == errSecSuccess else {
            fatalError("SecRandomCopyBytes failed — system RNG unavailable")
        }
        return Data(bytes)
    }

    // MARK: - Keychain Storage (no biometric protection)

    /// Stores the Secret Key in the Keychain.
    /// Accessible when device is unlocked, device-only (not synced to iCloud).
    @discardableResult
    func storeSecretKey(_ keyData: Data) -> Bool {
        deleteSecretKey()

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: keyData,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    /// Retrieves the Secret Key from the Keychain.
    func retrieveSecretKey() -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return data
    }

    /// Deletes the Secret Key from the Keychain.
    @discardableResult
    func deleteSecretKey() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }

    /// True if a Secret Key exists in the Keychain.
    var hasSecretKey: Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        return SecItemCopyMatching(query as CFDictionary, nil) == errSecSuccess
    }

    // MARK: - Display Format

    /// Formats a Secret Key as a human-readable string for the "Emergency Kit".
    /// Format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XX (base32, grouped)
    static func formatForDisplay(_ keyData: Data) -> String {
        let base32 = base32Encode(keyData)
        // Group into chunks of 5 separated by dashes
        var result = ""
        for (i, char) in base32.enumerated() {
            if i > 0 && i % 5 == 0 { result += "-" }
            result.append(char)
        }
        return result
    }

    /// Parses a displayed Secret Key string back to Data.
    /// Strips dashes/spaces, decodes base32.
    static func parseFromDisplay(_ input: String) -> Data? {
        let cleaned = input
            .replacingOccurrences(of: "-", with: "")
            .replacingOccurrences(of: " ", with: "")
            .uppercased()
        return base32Decode(cleaned)
    }

    // MARK: - Base32 (RFC 4648)

    private static let base32Alphabet = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567")

    static func base32Encode(_ data: Data) -> String {
        var result = ""
        var bits: UInt64 = 0
        var bitCount = 0

        for byte in data {
            bits = (bits << 8) | UInt64(byte)
            bitCount += 8
            while bitCount >= 5 {
                bitCount -= 5
                let index = Int((bits >> bitCount) & 0x1F)
                result.append(base32Alphabet[index])
            }
        }

        if bitCount > 0 {
            let index = Int((bits << (5 - bitCount)) & 0x1F)
            result.append(base32Alphabet[index])
        }

        return result
    }

    static func base32Decode(_ string: String) -> Data? {
        var bits: UInt64 = 0
        var bitCount = 0
        var result = Data()

        for char in string {
            guard let idx = base32Alphabet.firstIndex(of: char) else { return nil }
            bits = (bits << 5) | UInt64(idx)
            bitCount += 5
            if bitCount >= 8 {
                bitCount -= 8
                result.append(UInt8((bits >> bitCount) & 0xFF))
            }
        }

        return result
    }
}
