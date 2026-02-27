import SwiftUI

struct PasswordStrength {
    /// Minimum strength score required for vault creation and password changes.
    static let minimumRequired = 50

    static func calculate(_ password: String) -> Int {
        guard !password.isEmpty else { return 0 }
        var score = 0

        if password.count >= 8 { score += 15 }
        if password.count >= 12 { score += 15 }
        if password.count >= 16 { score += 10 }
        if password.count >= 20 { score += 10 }

        if password.range(of: "[a-z]", options: .regularExpression) != nil { score += 10 }
        if password.range(of: "[A-Z]", options: .regularExpression) != nil { score += 10 }
        if password.range(of: "[0-9]", options: .regularExpression) != nil { score += 10 }
        if password.range(of: "[^a-zA-Z0-9]", options: .regularExpression) != nil { score += 15 }

        let uniqueChars = Set(password).count
        if Double(uniqueChars) > Double(password.count) * 0.6 { score += 5 }

        return min(100, score)
    }

    static func color(for strength: Int) -> Color {
        if strength >= 90 { return Color(hex: "34d399") }
        if strength >= 75 { return Color(hex: "fbbf24") }
        if strength >= 50 { return Color(hex: "fb923c") }
        return Color(hex: "f87171")
    }

    static func label(for strength: Int) -> String {
        if strength >= 90 { return "Excellent" }
        if strength >= 75 { return "Strong" }
        if strength >= 50 { return "Fair" }
        if strength > 0 { return "Weak" }
        return ""
    }
}
