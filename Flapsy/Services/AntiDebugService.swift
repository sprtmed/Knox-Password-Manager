import Foundation

/// Prevents debugger attachment in release builds.
/// Disabled in DEBUG to allow normal Xcode development.
enum AntiDebugService {

    /// Call once at app launch to deny debugger attachment.
    static func denyDebuggerAttachment() {
        #if !DEBUG
        // PT_DENY_ATTACH prevents future debugger attachment via ptrace.
        let PT_DENY_ATTACH: CInt = 31
        ptrace(PT_DENY_ATTACH, 0, nil, 0)
        #endif
    }

    /// Returns true if a debugger is currently attached (sysctl check).
    static var isDebuggerAttached: Bool {
        #if DEBUG
        return false
        #else
        var info = kinfo_proc()
        var size = MemoryLayout<kinfo_proc>.size
        var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
        let result = sysctl(&mib, UInt32(mib.count), &info, &size, nil, 0)
        guard result == 0 else { return false }
        return (info.kp_proc.p_flag & P_TRACED) != 0
        #endif
    }
}
