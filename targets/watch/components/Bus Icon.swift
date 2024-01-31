//
//  Bus Icon.swift
//  Reveille Rides Watch App
//
//  Created by Brandon Wees on 1/31/24.
//

import SwiftUI

struct Bus_Icon: View {
  var name: String
  var number: String
  var color: Color
  var subtitle: String

  var body: some View {
      HStack {
        Text("01")
          .padding([.vertical], 8)
          
          .padding([.horizontal], 12)
          .background(color)
          .clipShape(.rect(cornerSize: CGSize(width: 8, height: 8)))
          
        VStack {
          HStack {
            Text(name)
              .font(.headline)
              .frame(alignment: .leading)
            Spacer()
          }
          
          HStack {
            Text(subtitle)
              .font(.caption2)
              .frame(alignment: .leading)
              .foregroundStyle(.secondary)
            Spacer()
          }
        }
        .padding([.leading], 4)
        
        Spacer()
        
        Image(systemName: "chevron.right")
          .foregroundStyle(.tertiary)
      }
  }
}

#Preview {
    Bus_Icon(
      name: "RELLIS",
      number: "47",
      color: Color.red,
      subtitle: "MSC | RELLIS"
    )
}
