# KNOX

**A no-nonsense password manager for Mac.**

KNOX lives in your menu bar. It stores your passwords locally, encrypted with the same cryptography used by intelligence agencies. No cloud. No subscriptions. No bloat. Just your passwords, locked down tight.

We built KNOX because we were fed up. Every password manager out there keeps bolting on features nobody asked for — browser extensions that break, cloud sync that leaks, family plans, travel mode, dark web monitoring, "security scores." Meanwhile, the core job — *storing passwords securely* — gets buried under feature creep.

KNOX does one thing and does it well.

---

## Features

- **Menu bar app** — Click the icon or press `Cmd+Shift+P` to open. No dock icon, no window clutter
- **Password generator** — Configurable length, character sets, and strength meter
- **Categories & favorites** — Organize your vault however you want
- **Search** — Find any entry instantly
- **Touch ID** — Unlock with your fingerprint
- **Auto-lock** — Locks automatically after inactivity, sleep, or screen lock
- **Import** — Bring your passwords from 1Password, Bitwarden, or any CSV
- **Export** — Encrypted `.knox` backup or plain CSV
- **Dark & light mode** — Follows your preference
- **Completely free** — No trials, no tiers, no subscriptions. Ever.

---

## Security

This is a password manager, so security isn't a feature — it's the foundation. Here's exactly what KNOX uses:

| Layer | Implementation |
|-------|---------------|
| **Encryption** | AES-256-GCM (CryptoKit) |
| **Key derivation** | Argon2id — 128 MB memory, 3 iterations, 4 parallel lanes |
| **Secret Key** | 128-bit random key stored in macOS Keychain, mixed via HKDF-SHA256 |
| **Key memory** | Pinned to RAM (`mlock`), zeroed on lock (`resetBytes`) |
| **Anti-debug** | `ptrace(PT_DENY_ATTACH)` + `sysctl` detection in release builds |
| **File permissions** | `0600` (owner read/write only) on all vault files |
| **Salt integrity** | SHA-256 checksum with redundant copy in vault header |
| **Brute-force protection** | Exponential backoff (2s, 4s, 8s, 16s, 30s cap), persisted across restarts |
| **Clipboard** | Marked as concealed (`NSPasteboard.ConcealedType`) + auto-clear timer |
| **Password requirements** | 12-character minimum with real-time strength scoring |
| **Storage** | Local only — `~/Library/Application Support/Knox/` |
| **Network** | None. Zero. KNOX has no network entitlements and makes no connections. |
| **Biometrics** | Touch ID via `LAContext` with `.biometryCurrentSet` (invalidates on enrollment change) |
| **Runtime** | Hardened Runtime enabled |

### How your vault is encrypted

```
Master Password + Salt (32 bytes)
        |
        v
    Argon2id (128 MB, 3 iterations, 4 lanes)
        |
        v
  Intermediate Key + Secret Key (128-bit, from Keychain)
        |
        v
    HKDF-SHA256 ("com.knox.vault-key")
        |
        v
    256-bit AES Key
        |
        v
    AES-256-GCM encrypt/decrypt
```

Your vault file (`vault.enc`) contains a 40-byte header (`FLPV` magic + version + embedded salt) followed by the AES-256-GCM ciphertext. Even if someone steals the file, they need both your master password AND the 128-bit secret key to decrypt it. Brute-forcing that combination is computationally infeasible.

### What KNOX can't protect against

We believe in transparency. KNOX cannot defend against:

- Malware running as your user (this applies to every password manager)
- A compromised operating system or kernel
- Someone with physical access to your unlocked Mac

These are OS-level threats, not application-level ones.

---

## Requirements

- macOS 14.0 (Sonoma) or later
- Xcode 15+ (to build from source)
- [xcodegen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`)

## Build

```bash
# Clone the repo
git clone https://github.com/sprtmed/Knox-Password-Manager.git
cd Knox-Password-Manager

# Generate Xcode project
xcodegen generate

# Build and run
open Knox.xcodeproj
# Press Cmd+R in Xcode
```

After building, KNOX appears in your menu bar — look for the lock icon in the top-right of your screen.

---

## Vault file format

For the security-curious:

```
Offset  Size    Content
0       4       Magic bytes: "FLPV"
4       4       Version: UInt32 big-endian (2 = Argon2id)
8       32      Salt (redundant backup copy)
40      ...     AES-256-GCM ciphertext (nonce + encrypted JSON + auth tag)
```

Salt is stored separately in `salt.dat` (32 bytes + SHA-256 checksum = 64 bytes) with a fallback to the embedded copy in the vault header.

---

## Why "KNOX"

Fort Knox. Where the gold is kept. Seemed fitting for a vault.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
