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
  
  func parseRelativeTime(iso: String) -> String {
    let dateFormatter = ISO8601DateFormatter()
    guard let date = dateFormatter.date(from: iso) else {
        return "Invalid"
    }
    
    let calendar = Calendar.current
    let now = Date()
    let components = calendar.dateComponents([.minute], from: now, to: date)
    
    if let minutes = components.minute {
        if minutes < 1 {
            return "Now"
        } else {
            return "\(minutes) min"
        }
    } else {
        return "Unknown"
    }
  }
  
  var body: some View {
    HStack {
      Text(parseRelativeTime(iso: date))
      if (isLive) {
        Image(systemName: "dot.radiowaves.up.forward")
          .font(.system(size: 10))
          .padding([.bottom], 8)
          .padding([.leading], -4)
      }
    }
      .padding([.vertical], 4)
      .padding([.horizontal], 8)
      .background(color)
      .cornerRadius(8)
  }
}

