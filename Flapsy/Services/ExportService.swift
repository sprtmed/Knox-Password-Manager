import Foundation
import AppKit
import CryptoKit
import UniformTypeIdentifiers

/// Handles exporting vault data as encrypted .knox backup or plaintext CSV.
final class ExportService {
    static let shared = ExportService()

    private init() {}

    // MARK: - Types

    enum ExportFormat: String, CaseIterable {
        case encryptedBackup = "Encrypted Backup (.knox)"
        case csv             = "CSV (Unencrypted)"
    }

    enum ExportError: Error, LocalizedError {
        case encryptionFailed
        case writeFailed
        case cancelled
        case noItems

        var errorDescription: String? {
            switch self {
            case .encryptionFailed: return "Failed to encrypt backup"
            case .writeFailed: return "Failed to write file"
            case .cancelled: return "Export cancelled"
            case .noItems: return "No items to export"
            }
        }
    }

    // MARK: - Save Panel

    func showSavePanel(format: ExportFormat) -> URL? {
        let panel = NSSavePanel()
        panel.title = "Export Vault"
        panel.canCreateDirectories = true

        switch format {
        case .encryptedBackup:
            panel.nameFieldStringValue = "knox-backup.knox"
            panel.allowedContentTypes = [UTType(filenameExtension: "knox") ?? .data]
            panel.message = "Choose where to save your encrypted backup"
        case .csv:
            panel.nameFieldStringValue = "knox-export.csv"
            panel.allowedContentTypes = [.commaSeparatedText]
            panel.message = "Warning: CSV files are not encrypted"
        }

        guard panel.runModal() == .OK else { return nil }
        return panel.url
    }

    // MARK: - Export Encrypted Backup

    /// Creates an encrypted .knox backup file.
    ///
    /// Format:
    ///   4 bytes: magic "FLPY"
    ///   4 bytes: version (UInt32 big-endian, currently 1)
    ///   32 bytes: salt
    ///   remaining: AES-256-GCM encrypted VaultData JSON
    func exportEncryptedBackup(vault: VaultData, password: String, to url: URL) throws {
        guard !vault.items.isEmpty else { throw ExportError.noItems }

        // Generate a fresh salt for this backup
        let salt = EncryptionService.shared.generateSalt(byteCount: 32)

        // Derive key from the export password
        guard let key = deriveKeyStandalone(from: password, salt: salt) else {
            throw ExportError.encryptionFailed
        }

        // Encode vault to JSON
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let json = try encoder.encode(vault)

        // Encrypt
        let encrypted = try EncryptionService.shared.encrypt(json, using: key)

        // Build file: magic + version + salt + encrypted
        var fileData = Data()
        fileData.append("FLPY".data(using: .ascii)!)  // 4 bytes magic

        var version = UInt32(1).bigEndian
        fileData.append(Data(bytes: &version, count: 4))  // 4 bytes version

        fileData.append(salt)  // 32 bytes salt
        fileData.append(encrypted)  // encrypted payload

        try fileData.write(to: url, options: [.atomic, .completeFileProtection])
    }

    // MARK: - Export CSV

    /// Exports all vault items as a CSV file.
    func exportCSV(items: [VaultItem], to url: URL) throws {
        guard !items.isEmpty else { throw ExportError.noItems }

        var csv = "type,name,url,username,password,cardholder,card_number,expiry,cvv,notes,category,favorite,created,modified\n"

        for item in items {
            let row = [
                item.type.rawValue,
                escapeCSVField(item.name),
                escapeCSVField(item.url ?? ""),
                escapeCSVField(item.username ?? ""),
                escapeCSVField(item.password ?? ""),
                escapeCSVField(item.cardHolder ?? ""),
                escapeCSVField(item.cardNumber ?? ""),
                escapeCSVField(item.expiry ?? ""),
                escapeCSVField(item.cvv ?? ""),
                escapeCSVField(item.noteText ?? ""),
                escapeCSVField(item.category),
                item.isFavorite ? "1" : "0",
                ISO8601DateFormatter().string(from: item.createdAt),
                ISO8601DateFormatter().string(from: item.modifiedAt)
            ]
            csv += row.joined(separator: ",") + "\n"
        }

        guard let data = csv.data(using: .utf8) else { throw ExportError.writeFailed }
        try data.write(to: url, options: [.atomic, .completeFileProtection])
    }

    // MARK: - Helpers

    private func escapeCSVField(_ value: String) -> String {
        if value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r") {
            return "\"" + value.replacingOccurrences(of: "\"", with: "\"\"") + "\""
        }
        return value
    }

    /// Standalone key derivation using Argon2id (doesn't store the key in EncryptionService).
    private func deriveKeyStandalone(from password: String, salt: Data) -> SymmetricKey? {
        guard var derivedBytes = Argon2Service.shared.deriveKey(from: password, salt: salt) else {
            return nil
        }
        let key = SymmetricKey(data: derivedBytes)
        derivedBytes.resetBytes(in: 0..<derivedBytes.count)
        return key
    }
}
