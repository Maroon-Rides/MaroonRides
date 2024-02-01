//
//  TimeBubble.swift
//  Reveille Rides Watch App
//
//  Created by Brandon Wees on 1/31/24.
//

import SwiftUI

struct TimeBubble: View {
  var date: String
  var isLive: Bool = false
  var color: Color
  
  func parseTime(time: String) -> Date {
    return ISO8601DateFormatter().date(from: time)!
  }
  
  var body: some View {
    HStack {
      Text(parseTime(time: date), style: .time)
      Image(systemName: "dot.radiowaves.up.forward")
        .font(.system(size: 16))
    }
    .padding([.vertical], 4)
      .padding([.horizontal], 8)
      .background(color)
      .cornerRadius(8)
    
    
  }
}

