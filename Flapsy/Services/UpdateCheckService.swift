import Foundation
import os.log

private let logger = Logger(subsystem: "com.knox.app", category: "UpdateCheck")

final class UpdateCheckService: ObservableObject {
    @Published var updateAvailable = false
    @Published var latestVersion: String?

    private let releasesURL = "https://api.github.com/repos/sprtmed/knox/releases/latest"
    private var hasChecked = false

    private var currentVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0"
    }

    func checkForUpdate() {
        guard !hasChecked else { return }
        hasChecked = true

        Task.detached(priority: .utility) { [weak self] in
            guard let self else { return }
            do {
                guard let url = URL(string: self.releasesURL) else { return }
                var request = URLRequest(url: url)
                request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
                request.timeoutInterval = 10

                let (data, response) = try await URLSession.shared.data(for: request)
                guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return }

                struct Release: Decodable { let tag_name: String }
                let release = try JSONDecoder().decode(Release.self, from: data)

                // Strip leading "v" if present (e.g. "v1.1" → "1.1")
                let remote = release.tag_name.hasPrefix("v")
                    ? String(release.tag_name.dropFirst())
                    : release.tag_name

                let isNewer = self.compareVersions(remote, self.currentVersion)

                await MainActor.run {
                    if isNewer {
                        self.updateAvailable = true
                        self.latestVersion = remote
                        logger.info("Update available: v\(remote, privacy: .public)")
                    } else {
                        logger.info("App is up to date (v\(self.currentVersion, privacy: .public))")
                    }
                }
            } catch {
                logger.debug("Version check failed: \(error.localizedDescription, privacy: .public)")
            }
        }
    }

    /// Simple semantic version comparison: returns true if `remote` > `local`
    private func compareVersions(_ remote: String, _ local: String) -> Bool {
        let r = remote.split(separator: ".").compactMap { Int($0) }
        let l = local.split(separator: ".").compactMap { Int($0) }
        let count = max(r.count, l.count)
        for i in 0..<count {
            let rv = i < r.count ? r[i] : 0
            let lv = i < l.count ? l[i] : 0
            if rv > lv { return true }
            if rv < lv { return false }
        }
        return false
    }
}
