import SwiftUI

struct LockScreenView: View {
    @EnvironmentObject var vault: VaultViewModel
    @EnvironmentObject var updateCheck: UpdateCheckService
    @Environment(\.theme) var theme

    @FocusState private var isPasswordFocused: Bool

    private var biometricAvailableAndEnabled: Bool {
        BiometricService.shared.isBiometricAvailable &&
        KeychainService.biometricEnabledFlag
    }

    var body: some View {
        ZStack {
            VStack(spacing: 20) {
                Spacer().frame(height: 40)

                // Lock icon with blue gradient
                ZStack {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "3b82f6"), Color(hex: "1d4ed8")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 64, height: 64)
                        .shadow(color: Color(hex: "3b82f6").opacity(0.3), radius: 16, y: 8)

                    Image(systemName: "lock.fill")
                        .font(.system(size: 28))
                        .foregroundColor(.white)
                }

                // Title
                VStack(spacing: 6) {
                    Text("Knox")
                        .font(.system(size: 18, weight: .bold, design: .monospaced))
                        .foregroundColor(theme.text)
                    Text("Enter master password to unlock")
                        .font(.system(size: 12, design: .monospaced))
                        .foregroundColor(theme.textSecondary)
                }

                // Password input
                SecureField("", text: $vault.masterPasswordInput)
                    .textFieldStyle(.plain)
                    .font(.system(size: 16, design: .monospaced))
                    .multilineTextAlignment(.center)
                    .padding(10)
                    .background(theme.inputBg)
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(
                                vault.lockError ? theme.accentRed : theme.inputBorder,
                                lineWidth: 1
                            )
                    )
                    .foregroundColor(theme.text)
                    .focused($isPasswordFocused)
                    .onSubmit { vault.unlock() }
                    .modifier(ShakeModifier(shakes: vault.shakeError ? 3 : 0))
                    .padding(.horizontal, 32)

                // Error message
                if vault.lockError {
                    Text("\u{2715} \(vault.lockErrorMessage)")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(theme.accentRed)
                }

                // Lockout countdown
                if vault.isLockedOut {
                    Text("Wait \(vault.lockoutRemainingSeconds)s before trying again")
                        .font(.system(size: 11, weight: .medium, design: .monospaced))
                        .foregroundColor(theme.accentRed.opacity(0.8))
                }

                // Biometric failed message
                if vault.biometricFailed {
                    Text("Touch ID failed \u{2014} enter your password")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(theme.textMuted)
                }

                // Secret Key recovery input (shown when Keychain lost for v2 vault)
                if vault.needsSecretKeyRecovery {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("SECRET KEY")
                            .font(.system(size: 10, weight: .semibold, design: .monospaced))
                            .foregroundColor(theme.textFaint)

                        TextField("XXXXX-XXXXX-XXXXX-XXXXX-XXXXX", text: $vault.secretKeyRecoveryInput)
                            .textFieldStyle(.plain)
                            .font(.system(size: 12, design: .monospaced))
                            .padding(10)
                            .background(theme.inputBg)
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(
                                        vault.secretKeyRecoveryError.isEmpty ? theme.inputBorder : theme.accentRed,
                                        lineWidth: 1
                                    )
                            )
                            .foregroundColor(theme.text)

                        if !vault.secretKeyRecoveryError.isEmpty {
                            Text(vault.secretKeyRecoveryError)
                                .font(.system(size: 10, design: .monospaced))
                                .foregroundColor(theme.accentRed)
                        }

                        Text("Enter the Secret Key from your Emergency Kit")
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundColor(theme.textMuted)
                    }
                    .padding(.horizontal, 32)
                }

                // Unlock button
                if vault.needsSecretKeyRecovery {
                    Button(action: { vault.unlockWithRecoveredSecretKey() }) {
                        HStack(spacing: 8) {
                            if vault.isLoading {
                                ProgressView()
                                    .scaleEffect(0.7)
                                    .progressViewStyle(.circular)
                                Text("Unlocking\u{2026}")
                                    .font(.system(size: 13, weight: .semibold))
                            } else {
                                Image(systemName: "key.fill")
                                    .font(.system(size: 12))
                                Text("Recover & Unlock")
                                    .font(.system(size: 13, weight: .semibold))
                            }
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 11)
                        .background(
                            LinearGradient(
                                colors: [Color(hex: "f59e0b"), Color(hex: "d97706")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .cornerRadius(10)
                    }
                    .buttonStyle(.plain)
                    .disabled(vault.isLoading || vault.isLockedOut)
                    .padding(.horizontal, 32)
                } else {
                    Button(action: { vault.unlock() }) {
                        HStack(spacing: 8) {
                            if vault.isLoading {
                                ProgressView()
                                    .scaleEffect(0.7)
                                    .progressViewStyle(.circular)
                                Text("Unlocking\u{2026}")
                                    .font(.system(size: 13, weight: .semibold))
                            } else {
                                Text("Unlock Vault")
                                    .font(.system(size: 13, weight: .semibold))
                            }
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 11)
                        .background(
                            LinearGradient(
                                colors: [Color(hex: "3b82f6"), Color(hex: "2563eb")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .cornerRadius(10)
                    }
                    .buttonStyle(.plain)
                    .disabled(vault.isLoading || vault.isLockedOut)
                    .padding(.horizontal, 32)
                }

                // Touch ID button
                if biometricAvailableAndEnabled && !vault.needsSecretKeyRecovery {
                    Button(action: { vault.attemptBiometricUnlock() }) {
                        HStack(spacing: 8) {
                            Image(systemName: "touchid")
                                .font(.system(size: 20))
                            Text("Unlock with Touch ID")
                                .font(.system(size: 13, weight: .medium, design: .monospaced))
                        }
                        .foregroundColor(theme.accentBlueLt)
                        .padding(.vertical, 8)
                    }
                    .buttonStyle(.plain)
                    .disabled(vault.showBiometricPrompt)
                }

                // Security badges
                HStack(spacing: 16) {
                    Label("AES-256", systemImage: "diamond.fill")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(theme.textGhost)
                    Label("Argon2id", systemImage: "diamond.fill")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(theme.textGhost)
                }

                // Version info
                if updateCheck.updateAvailable, let version = updateCheck.latestVersion {
                    Button(action: {
                        if let url = URL(string: "https://github.com/sprtmed/knox/releases/latest") {
                            NSWorkspace.shared.open(url)
                        }
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.down.circle")
                                .font(.system(size: 9))
                            Text("v\(version) available")
                                .font(.system(size: 10, design: .monospaced))
                        }
                        .foregroundColor(theme.accentBlueLt)
                    }
                    .buttonStyle(.plain)
                } else {
                    Text("v\(updateCheck.currentVersion)")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(theme.textGhost)
                }

                Spacer()

                // Quit application link
                HStack {
                    Spacer()
                    Button(action: { NSApplication.shared.terminate(nil) }) {
                        HStack(spacing: 4) {
                            Image(systemName: "xmark")
                                .font(.system(size: 8, weight: .semibold))
                            Text("Quit Application")
                                .font(.system(size: 9, design: .monospaced))
                        }
                        .foregroundColor(theme.textGhost)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.bottom, 16)
            }
            .padding(.horizontal, 32)
        }
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                isPasswordFocused = true
            }
            // Auto-trigger Touch ID if enabled
            if biometricAvailableAndEnabled {
                vault.attemptBiometricUnlock()
            }
        }
    }

}

// MARK: - Shake Animation Modifier

struct ShakeModifier: GeometryEffect {
    var shakes: Int
    var animatableData: CGFloat {
        get { CGFloat(shakes) }
        set { shakes = Int(newValue) }
    }

    func effectValue(size: CGSize) -> ProjectionTransform {
        let translation = sin(animatableData * .pi * 2) * 8
        return ProjectionTransform(CGAffineTransform(translationX: translation, y: 0))
    }
}
