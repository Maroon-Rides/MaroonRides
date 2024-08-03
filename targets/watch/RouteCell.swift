//
//  Bus Icon.swift
//  Reveille Rides Watch App
//
//  Created by Brandon Wees on 1/31/24.
//

import SwiftUI

struct RouteCell: View {
  var name: String
  var number: String
  var color: Color
  var subtitle: String

  @State var showNextLine = false
  @State var rowHeight: CGFloat = 84
  
  let titleFont = UIFont.preferredFont(forTextStyle: .headline)
  
  var body: some View {
    HStack {
      VStack {
        HStack(alignment: .center) {
          Text(number)
            .frame(height: 22)
            .padding([.horizontal], 6)
            .font(.system(size: 16).bold())
            .minimumScaleFactor(0.1)
            .lineLimit(1)
            .background(color)
            .clipShape(.rect(cornerSize: CGSize(width: 8, height: 8)))
          
          MarqueeText(
            text: name,
            font: titleFont,
            leftFade: 8,
            rightFade: 8,
            startDelay: 1
          )
          .padding([.leading], 2)
        }
        
        if subtitle != "" {
          HStack {
            MarqueeText(
              text: subtitle,
              font: UIFont.systemFont(ofSize: 12),
              leftFade: 8,
              rightFade: 8,
              startDelay: 2
            )
            .padding([.leading], 4)
            Spacer()
          }
        }
      }
//      .padding([.leading], 4)
      
      Spacer()
      
      Image(systemName: "chevron.right")
        .foregroundStyle(.tertiary)
    }
    .padding([.vertical], 8)
  }
}

#Preview {
    RouteCell(
      name: "RELLIS",
      number: "47",
      color: Color.red,
      subtitle: "MSC | RELLIS"
    )
}
