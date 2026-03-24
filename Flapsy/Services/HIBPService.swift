import Foundation
import CryptoKit
import os.log

private let logger = Logger(subsystem: "com.knox.app", category: "HIBP")

/// Checks passwords against Have I Been Pwned using k-Anonymity.
///
/// Security guarantees:
/// - Only the first 5 characters of the SHA-1 hash are sent over the network
/// - Full passwords and full hashes NEVER leave the device
/// - All requests use HTTPS (TLS 1.2+)
/// - No API key or account required
/// - Results are NOT cached to disk — checked fresh each session
/// - All comparison is done locally after downloading the prefix range
enum HIBPService {

    /// Result of checking a single password
    struct BreachResult {
        let itemID: UUID
        /// How many times this password appeared in known breaches
        let occurrences: Int
    }

    /// Check a single password against HIBP.
    /// Returns the number of times it appeared in breaches, or nil on network error.
    static func checkPassword(_ password: String) async -> Int? {
        // SHA-1 hash the password locally
        let data = Data(password.utf8)
        let digest = Insecure.SHA1.hash(data: data)
        let hash = digest.map { String(format: "%02X", $0) }.joined()

        let prefix = String(hash.prefix(5))
        let suffix = String(hash.dropFirst(5))

        // Request range from HIBP API (only sends 5-char prefix)
        guard let url = URL(string: "https://api.pwnedpasswords.com/range/\(prefix)") else {
            return nil
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Flapsy-Password-Manager", forHTTPHeaderField: "User-Agent")
        // Add padding to prevent response length analysis
        request.setValue("true", forHTTPHeaderField: "Add-Padding")
        request.timeoutInterval = 10

        do {
            let (responseData, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                logger.warning("HIBP API returned non-200 status")
                return nil
            }

            guard let body = String(data: responseData, encoding: .utf8) else {
                return nil
            }

            // Parse response: each line is "SUFFIX:COUNT"
            // Compare locally to find our password's suffix
            for line in body.components(separatedBy: "\r\n") {
                let parts = line.split(separator: ":")
                guard parts.count == 2 else { continue }
                let responseSuffix = String(parts[0]).trimmingCharacters(in: .whitespaces)
                // Skip padded entries (they have count 0)
                guard let count = Int(parts[1].trimmingCharacters(in: .whitespaces)),
                      count > 0 else { continue }

                if responseSuffix.uppercased() == suffix {
                    return count
                }
            }

            // Not found in any breach
            return 0
        } catch {
            logger.warning("HIBP check failed: \(error.localizedDescription, privacy: .public)")
            return nil
        }
    }

    /// Check all login passwords in the vault concurrently.
    /// Returns results only for compromised passwords (occurrences > 0).
    /// Passwords are checked with limited concurrency to be respectful to the API.
    static func checkVault(items: [(id: UUID, password: String)]) async -> [BreachResult] {
        var results: [BreachResult] = []

        // Use TaskGroup with limited concurrency (max 3 concurrent requests)
        await withTaskGroup(of: BreachResult?.self) { group in
            var active = 0
            var index = 0

            for item in items {
                if active >= 3 {
                    if let result = await group.next() {
                        if let r = result { results.append(r) }
                        active -= 1
                    }
                }

                group.addTask {
                    guard let count = await checkPassword(item.password),
                          count > 0 else { return nil }
                    return BreachResult(itemID: item.id, occurrences: count)
                }
                active += 1
                index += 1
            }

            for await result in group {
                if let r = result { results.append(r) }
            }
        }

        return results
    }
}
