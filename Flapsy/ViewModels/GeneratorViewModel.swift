import Foundation
import Combine

enum GeneratorType: String, CaseIterable {
    case random = "Random Password"
    case memorable = "Memorable Password"
    case pin = "PIN Code"
}

enum SeparatorType: String, CaseIterable {
    case hyphens = "Hyphens"
    case periods = "Periods"
    case spaces = "Spaces"
    case commas = "Commas"
    case underscores = "Underscores"
    case numbers = "Numbers"

    var character: String {
        switch self {
        case .hyphens: return "-"
        case .periods: return "."
        case .spaces: return " "
        case .commas: return ","
        case .underscores: return "_"
        case .numbers: return "" // handled specially
        }
    }
}

final class GeneratorViewModel: ObservableObject {
    @Published var generatorType: GeneratorType = .random
    @Published var generatedPassword: String = ""
    @Published var isGenerating: Bool = false
    @Published var copied: Bool = false

    // Random Password settings
    @Published var characterCount: Double = 20
    @Published var includeNumbers: Bool = true
    @Published var includeSymbols: Bool = true

    // Memorable Password settings
    @Published var wordCount: Double = 4
    @Published var separator: SeparatorType = .hyphens
    @Published var capitalize: Bool = false
    @Published var fullWords: Bool = true

    // PIN settings
    @Published var pinLength: Double = 6

    // History
    @Published var history: [String] = []

    var strength: Int {
        PasswordStrength.calculate(generatedPassword)
    }

    private static let wordList = [
        "alpha","brave","coral","delta","eagle","flame","grace","haven","ivory","jewel",
        "karma","lunar","maple","noble","ocean","pearl","quest","river","solar","tiger",
        "unity","vivid","whale","xenon","youth","zephyr","amber","blaze","cedar","drift",
        "ember","frost","glyph","haze","index","jazz","knack","lemon","mirth","nexus",
        "opal","plume","quirk","ridge","sage","torch","ultra","valor","wren","axiom","brisk"
    ]

    func generate() {
        isGenerating = true

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            guard let self = self else { return }

            let password: String
            switch self.generatorType {
            case .random:
                password = self.generateRandom()
            case .memorable:
                password = self.generateMemorable()
            case .pin:
                password = self.generatePIN()
            }

            self.generatedPassword = password
            self.isGenerating = false

            if !password.isEmpty {
                self.history.insert(password, at: 0)
                if self.history.count > 50 {
                    self.history.removeLast()
                }
            }
        }
    }

    private func generateRandom() -> String {
        var chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz"
        if includeNumbers { chars += "23456789" }
        if includeSymbols { chars += "!@#$%^&*()_+-=" }
        let charArray = Array(chars)
        let length = Int(characterCount)
        return String((0..<length).map { _ in charArray[Int.random(in: 0..<charArray.count)] })
    }

    private func generateMemorable() -> String {
        let count = Int(wordCount)
        var words: [String] = []

        for _ in 0..<count {
            var word = Self.wordList.randomElement() ?? "word"
            if !fullWords {
                let end = min(word.count, 3 + Int.random(in: 0...1))
                word = String(word.prefix(end))
            }
            if capitalize {
                word = word.prefix(1).uppercased() + word.dropFirst()
            }
            words.append(word)
        }

        if separator == .numbers {
            return words.enumerated().map { index, word in
                index < words.count - 1 ? word + String(Int.random(in: 0...9)) : word
            }.joined()
        }

        return words.joined(separator: separator.character)
    }

    private func generatePIN() -> String {
        let length = Int(pinLength)
        return (0..<length).map { _ in String(Int.random(in: 0...9)) }.joined()
    }

    func copyGenerated() {
        guard !generatedPassword.isEmpty else { return }
        ClipboardService.shared.copy(generatedPassword)
        copied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            self?.copied = false
        }
    }
}
