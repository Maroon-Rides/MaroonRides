//
//  RouteList.swift
//  Reveille Rides Watch App
//
//  Created by Brandon Wees on 1/31/24.
//

import SwiftUI

struct RouteList: View {
    var body: some View {
      ScrollView {
        Bus_Icon(name: "RELLIS", number: "47", color: Color.red, subtitle: "MSC | Rellis")
      }
    }
}

#Preview {
    RouteList()
}
