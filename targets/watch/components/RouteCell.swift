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

  var body: some View {
      HStack {
        VStack {
          HStack {
            Text(number)
              .padding([.vertical], 2)
              .padding([.horizontal], 6)
              .font(.system(size: 16).bold())
              .minimumScaleFactor(0.1)
              .lineLimit(1)
              .background(color)
              .clipShape(.rect(cornerSize: CGSize(width: 8, height: 8)))
            Text(name)
              .font(.headline)
              .frame(alignment: .leading)
              .lineLimit(1)
            Spacer()
          }
          
          HStack {
            Text(subtitle)
              .font(.system(size: 12))
              .frame(alignment: .leading)
              .foregroundStyle(.secondary)
              .lineLimit(1)

            Spacer()
          }
        }
        .padding([.leading], 4)
        
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
