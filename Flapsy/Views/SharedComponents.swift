import SwiftUI

// MARK: - FlapsyToggle

/// Custom toggle matching the mockup: 44x26px track, 20x20 thumb, spring animation.
struct FlapsyToggle: View {
    @Binding var isOn: Bool
    var accentColor: Color? = nil
    @Environment(\.theme) var theme

    var body: some View {
        let resolvedAccent = accentColor ?? theme.accentBlue

        ZStack(alignment: isOn ? .trailing : .leading) {
            // Track
            RoundedRectangle(cornerRadius: 13)
                .fill(isOn ? resolvedAccent : theme.toggleOff)
                .frame(width: 44, height: 26)
                .shadow(
                    color: isOn ? resolvedAccent.opacity(0.27) : Color.clear,
                    radius: 4, y: 0
                )

            // Thumb
            Circle()
                .fill(theme.toggleThumb)
                .frame(width: 20, height: 20)
                .shadow(color: Color.black.opacity(0.3), radius: 1.5, y: 1)
                .padding(3)
        }
        .frame(width: 44, height: 26)
        .onTapGesture {
            withAnimation(.spring(response: 0.2, dampingFraction: 0.64)) {
                isOn.toggle()
            }
        }
    }
}

// MARK: - FlapsyDropdown

/// Custom dropdown matching the mockup style with themed overlay menu.
struct FlapsyDropdown: View {
    let value: String
    let options: [String]
    let onChange: (String) -> Void
    var width: CGFloat = 180

    @Environment(\.theme) var theme
    @State private var isOpen = false

    var body: some View {
        ZStack(alignment: .topLeading) {
            // Trigger button
            Button(action: { withAnimation(.easeOut(duration: 0.15)) { isOpen.toggle() } }) {
                HStack {
                    Text(value)
                        .font(.system(size: 12, design: .monospaced))
                        .foregroundColor(theme.text)
                    Spacer()
                    Text("▼")
                        .font(.system(size: 8))
                        .foregroundColor(theme.textMuted)
                        .rotationEffect(.degrees(isOpen ? 180 : 0))
                        .animation(.easeInOut(duration: 0.2), value: isOpen)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(theme.inputBg)
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(isOpen ? theme.focusBorder : theme.inputBorder, lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .frame(width: width)
        }
        .overlay(alignment: .top) {
            if isOpen {
                dropdownMenu
                    .offset(y: 38)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .zIndex(isOpen ? 50 : 0)
    }

    private var dropdownMenu: some View {
        VStack(spacing: 0) {
            ForEach(options, id: \.self) { opt in
                Button(action: {
                    onChange(opt)
                    withAnimation(.easeOut(duration: 0.15)) { isOpen = false }
                }) {
                    HStack {
                        Text(opt)
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundColor(opt == value ? theme.accentBlueLt : theme.textSecondary)
                        Spacer()
                        if opt == value {
                            Text("✓")
                                .font(.system(size: 11))
                                .foregroundColor(theme.accentBlue)
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(opt == value ? theme.activeBg : Color.clear)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .background(theme.ddBg)
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(theme.ddBorder, lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.3), radius: 20, y: 6)
        .frame(width: width)
    }
}
