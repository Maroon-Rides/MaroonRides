//
//  ContentView.swift
//  basic-watchapp
//
//  Created by Brandon Wees on 1/31/24.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
      NavigationStack {
        TabView {
          RouteList()
            .navigationTitle("Favorites")
          Text("HSHSHSH")
            .navigationTitle("All Routes")
        }
      }
    }
}

#Preview {
    ContentView()
}
