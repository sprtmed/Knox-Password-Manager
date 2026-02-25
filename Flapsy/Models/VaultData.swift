import Foundation

struct VaultData: Codable {
    var items: [VaultItem]
    var categories: [VaultCategory]
    var settings: VaultSettings

    static var empty: VaultData {
        VaultData(
            items: [],
            categories: [],
            settings: VaultSettings.defaults
        )
    }
}
