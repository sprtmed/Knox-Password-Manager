import Cocoa
import Foundation

/// Monitors system-wide activity and triggers vault lock after inactivity.
/// Tracks: mouse movement, key presses, screen sleep, system sleep, fast user switch.
final class AutoLockService {
    private var globalMouseMonitor: Any?
    private var globalKeyMonitor: Any?
    private var inactivityTimer: Timer?
    private var lastActivityDate = Date()

    private var isEnabled: Bool = true
    private var lockAfterMinutes: Int = 5
    private var onLock: (() -> Void)?

    /// Starts monitoring. Call this after vault is unlocked.
    func start(lockAfterMinutes: Int, onLock: @escaping () -> Void) {
        stop() // clean up any previous session

        self.lockAfterMinutes = lockAfterMinutes
        self.onLock = onLock
        self.isEnabled = true
        self.lastActivityDate = Date()

        // Global mouse/keyboard activity monitors
        globalMouseMonitor = NSEvent.addGlobalMonitorForEvents(
            matching: [.mouseMoved, .leftMouseDown, .rightMouseDown, .scrollWheel]
        ) { [weak self] _ in
            self?.recordActivity()
        }

        globalKeyMonitor = NSEvent.addGlobalMonitorForEvents(
            matching: [.keyDown]
        ) { [weak self] _ in
            self?.recordActivity()
        }

        // System sleep / screen lock / fast user switch / screen wake
        let ws = NSWorkspace.shared.notificationCenter
        ws.addObserver(self, selector: #selector(systemWillSleep), name: NSWorkspace.willSleepNotification, object: nil)
        ws.addObserver(self, selector: #selector(screenDidSleep), name: NSWorkspace.screensDidSleepNotification, object: nil)
        ws.addObserver(self, selector: #selector(screenDidWake), name: NSWorkspace.screensDidWakeNotification, object: nil)
        ws.addObserver(self, selector: #selector(sessionDidResignActive), name: NSWorkspace.sessionDidResignActiveNotification, object: nil)

        // Check inactivity every 15 seconds
        inactivityTimer = Timer.scheduledTimer(withTimeInterval: 15, repeats: true) { [weak self] _ in
            self?.checkInactivity()
        }
    }

    /// Stops all monitoring. Call on lock or app termination.
    func stop() {
        if let m = globalMouseMonitor { NSEvent.removeMonitor(m) }
        if let m = globalKeyMonitor { NSEvent.removeMonitor(m) }
        globalMouseMonitor = nil
        globalKeyMonitor = nil
        inactivityTimer?.invalidate()
        inactivityTimer = nil
        isEnabled = false

        let ws = NSWorkspace.shared.notificationCenter
        ws.removeObserver(self, name: NSWorkspace.willSleepNotification, object: nil)
        ws.removeObserver(self, name: NSWorkspace.screensDidSleepNotification, object: nil)
        ws.removeObserver(self, name: NSWorkspace.screensDidWakeNotification, object: nil)
        ws.removeObserver(self, name: NSWorkspace.sessionDidResignActiveNotification, object: nil)
    }

    /// Update the timeout (e.g. when user changes setting while unlocked).
    func updateTimeout(minutes: Int) {
        lockAfterMinutes = minutes
    }

    // MARK: - Private

    private func recordActivity() {
        lastActivityDate = Date()
    }

    private func checkInactivity() {
        guard isEnabled, lockAfterMinutes > 0 else { return }
        let elapsed = Date().timeIntervalSince(lastActivityDate)
        if elapsed >= Double(lockAfterMinutes) * 60 {
            triggerLock()
        }
    }

    private func triggerLock() {
        guard isEnabled else { return }
        DispatchQueue.main.async { [weak self] in
            self?.onLock?()
        }
        stop()
    }

    // MARK: - System Events → Immediate Lock

    @objc private func systemWillSleep(_ notification: Notification) {
        triggerLock()
    }

    @objc private func screenDidSleep(_ notification: Notification) {
        triggerLock()
    }

    @objc private func screenDidWake(_ notification: Notification) {
        triggerLock()
    }

    @objc private func sessionDidResignActive(_ notification: Notification) {
        triggerLock()
    }

    deinit {
        stop()
    }
}
