//
//  ErrorView.swift
//  MaroonRides
//
//  Created by Brandon Wees on 8/2/24.
//

import SwiftUI

struct ErrorView: View {
    var text: String
  
    var body: some View {
      VStack {
        Image(systemName: "exclamationmark.triangle.fill")
          .foregroundStyle(.gray)
        Text(text)
          .multilineTextAlignment(.center)
          .foregroundStyle(.gray)
      }
    }
}

#Preview {
  ErrorView(text: "There was an error")
}
