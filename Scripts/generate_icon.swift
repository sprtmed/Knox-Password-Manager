#!/usr/bin/env swift

import Cocoa

func generateIcon(size: Int) -> NSImage {
    let image = NSImage(size: NSSize(width: size, height: size))
    image.lockFocus()

    guard let ctx = NSGraphicsContext.current?.cgContext else {
        image.unlockFocus()
        return image
    }

    let s = CGFloat(size)

    // Background: rounded rectangle with blue gradient
    let cornerRadius = s * 0.22
    let bgPath = CGPath(roundedRect: CGRect(x: 0, y: 0, width: s, height: s),
                        cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
    ctx.addPath(bgPath)
    ctx.clip()

    // Gradient: #3b82f6 to #1d4ed8
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let colors = [
        CGColor(srgbRed: 0.231, green: 0.510, blue: 0.965, alpha: 1.0),  // #3b82f6
        CGColor(srgbRed: 0.114, green: 0.306, blue: 0.847, alpha: 1.0),  // #1d4ed8
    ] as CFArray
    if let gradient = CGGradient(colorsSpace: colorSpace, colors: colors, locations: [0.0, 1.0]) {
        ctx.drawLinearGradient(gradient, start: CGPoint(x: 0, y: s), end: CGPoint(x: s, y: 0), options: [])
    }

    // Shield shape (centered, ~55% of icon size)
    let shieldW = s * 0.50
    let shieldH = s * 0.58
    let cx = s / 2
    let shieldTop = s * 0.82
    let shieldBot = shieldTop - shieldH

    let shieldPath = CGMutablePath()

    // Top center
    shieldPath.move(to: CGPoint(x: cx, y: shieldTop))

    // Top-left curve
    shieldPath.addCurve(
        to: CGPoint(x: cx - shieldW / 2, y: shieldTop - shieldH * 0.18),
        control1: CGPoint(x: cx - shieldW * 0.15, y: shieldTop),
        control2: CGPoint(x: cx - shieldW / 2, y: shieldTop - shieldH * 0.05)
    )

    // Left side going down
    shieldPath.addLine(to: CGPoint(x: cx - shieldW / 2, y: shieldTop - shieldH * 0.45))

    // Bottom-left curve to bottom point
    shieldPath.addCurve(
        to: CGPoint(x: cx, y: shieldBot),
        control1: CGPoint(x: cx - shieldW / 2, y: shieldBot + shieldH * 0.12),
        control2: CGPoint(x: cx - shieldW * 0.15, y: shieldBot)
    )

    // Bottom-right curve
    shieldPath.addCurve(
        to: CGPoint(x: cx + shieldW / 2, y: shieldTop - shieldH * 0.45),
        control1: CGPoint(x: cx + shieldW * 0.15, y: shieldBot),
        control2: CGPoint(x: cx + shieldW / 2, y: shieldBot + shieldH * 0.12)
    )

    // Right side going up
    shieldPath.addLine(to: CGPoint(x: cx + shieldW / 2, y: shieldTop - shieldH * 0.18))

    // Top-right curve
    shieldPath.addCurve(
        to: CGPoint(x: cx, y: shieldTop),
        control1: CGPoint(x: cx + shieldW / 2, y: shieldTop - shieldH * 0.05),
        control2: CGPoint(x: cx + shieldW * 0.15, y: shieldTop)
    )

    shieldPath.closeSubpath()

    // Fill shield white
    ctx.setFillColor(CGColor(srgbRed: 1, green: 1, blue: 1, alpha: 0.95))
    ctx.addPath(shieldPath)
    ctx.fillPath()

    // Keyhole: circle + downward triangle
    let keyholeR = shieldW * 0.11
    let keyholeCY = shieldTop - shieldH * 0.38

    // Circle part of keyhole
    ctx.setFillColor(CGColor(srgbRed: 0.231, green: 0.510, blue: 0.965, alpha: 1.0))
    ctx.fillEllipse(in: CGRect(
        x: cx - keyholeR,
        y: keyholeCY - keyholeR,
        width: keyholeR * 2,
        height: keyholeR * 2
    ))

    // Triangle (keyhole slot pointing down)
    let slotPath = CGMutablePath()
    let slotHalfW = keyholeR * 0.6
    let slotHeight = keyholeR * 2.5
    slotPath.move(to: CGPoint(x: cx - slotHalfW, y: keyholeCY))
    slotPath.addLine(to: CGPoint(x: cx, y: keyholeCY - slotHeight))
    slotPath.addLine(to: CGPoint(x: cx + slotHalfW, y: keyholeCY))
    slotPath.closeSubpath()

    ctx.addPath(slotPath)
    ctx.fillPath()

    image.unlockFocus()
    return image
}

// Generate all required sizes
let sizes = [16, 32, 64, 128, 256, 512, 1024]
let outputDir = "Flapsy/Assets.xcassets/AppIcon.appiconset"

// Ensure output directory exists
let fm = FileManager.default
try? fm.createDirectory(atPath: outputDir, withIntermediateDirectories: true)

for size in sizes {
    let image = generateIcon(size: size)
    guard let tiffData = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiffData),
          let pngData = bitmap.representation(using: .png, properties: [:]) else {
        print("Failed to generate icon_\(size)x\(size).png")
        continue
    }
    let filename = "icon_\(size)x\(size).png"
    let path = "\(outputDir)/\(filename)"
    do {
        try pngData.write(to: URL(fileURLWithPath: path))
        print("Generated \(filename)")
    } catch {
        print("Failed to write \(filename): \(error)")
    }
}

print("Done! Icon files generated in \(outputDir)")
