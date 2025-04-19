import SwiftUI
import Inject

struct ColorSelectionView: View {
    @ObserveInjection var inject
    @Binding var isPresented: Bool
    @Binding var selectedColor: Color
    
    let colors: [(name: String, color: Color)] = [
        ("White", .white),
        ("Grey", Color(hex: "9ca3af")),
        ("Neon Orange", Color(hex: "ff6b00"))
    ]
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Select Spray Paint Color")
                .font(.headline)
                .foregroundColor(.white)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                ForEach(colors, id: \.name) { colorOption in
                    Button(action: {
                        selectedColor = colorOption.color
                        isPresented = false
                    }) {
                        VStack(spacing: 8) {
                            Circle()
                                .fill(colorOption.color)
                                .frame(width: 48, height: 48)
                                .overlay(
                                    Circle()
                                        .strokeBorder(Color(white: 0.2), lineWidth: 1)
                                )
                                .overlay(
                                    Circle()
                                        .strokeBorder(Color.purple.opacity(selectedColor == colorOption.color ? 1 : 0), lineWidth: 2)
                                )
                            
                            Text(colorOption.name)
                                .font(.subheadline)
                                .foregroundColor(.white)
                        }
                    }
                    .padding()
                    .background(Color(white: 0.1))
                    .cornerRadius(8)
                }
            }
            .padding()
        }
        .padding()
        .background(Color(white: 0.067))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(Color(white: 0.2), lineWidth: 1)
        )
        .enableInjection()
    }
}

// Color extension for hex support
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    ColorSelectionView(
        isPresented: .constant(true),
        selectedColor: .constant(.white)
    )
    .preferredColorScheme(.dark)
} 