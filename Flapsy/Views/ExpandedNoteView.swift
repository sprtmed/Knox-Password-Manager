import SwiftUI

struct ExpandedNoteView: View {
    @Binding var text: String
    let title: String
    let readOnly: Bool
    let onDismiss: () -> Void
    @Environment(\.theme) var theme

    init(text: Binding<String>, title: String, readOnly: Bool = false, onDismiss: @escaping () -> Void) {
        self._text = text
        self.title = title
        self.readOnly = readOnly
        self.onDismiss = onDismiss
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack(spacing: 8) {
                Button(action: onDismiss) {
                    HStack(spacing: 4) {
                        Text("\u{2190}")
                            .font(.system(size: 11))
                        Text("Back")
                            .font(.system(size: 11, design: .monospaced))
                    }
                    .foregroundColor(theme.textSecondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 5)
                    .background(theme.fieldBg)
                    .cornerRadius(6)
                }
                .buttonStyle(.plain)

                Spacer()

                FormLabel(title)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)

            if readOnly {
                ScrollView {
                    Text(text)
                        .font(.system(size: 13, design: .monospaced))
                        .foregroundColor(theme.text)
                        .lineSpacing(3)
                        .textSelection(.enabled)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                }
                .background(theme.fieldBg)
                .cornerRadius(8)
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            } else {
                // Full-height editor
                TextEditor(text: $text)
                    .font(.system(size: 13, design: .monospaced))
                    .foregroundColor(theme.text)
                    .scrollContentBackground(.hidden)
                    .padding(10)
                    .background(theme.inputBg)
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(theme.inputBorder, lineWidth: 1)
                    )
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .transition(.move(edge: .trailing).combined(with: .opacity))
    }
}

struct NoteExpandButton: View {
    let action: () -> Void
    @Environment(\.theme) var theme

    var body: some View {
        Button(action: action) {
            Image(systemName: "arrow.up.left.and.arrow.down.right")
                .font(.system(size: 10))
                .foregroundColor(theme.textFaint)
                .padding(4)
                .background(theme.fieldBg)
                .cornerRadius(4)
        }
        .buttonStyle(.plain)
        .help("Expand note")
    }
}
