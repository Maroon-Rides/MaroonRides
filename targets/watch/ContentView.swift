//
//  ContentView.swift
//  basic-watchapp
//
//  Created by Brandon Wees on 1/31/24.
//

import SwiftUI

struct ContentView: View {
    @StateObject var apiManager: APIManager = APIManager()
    var body: some View {
      NavigationStack {
        RouteList()
      }
      .onAppear(perform: {
        apiManager.fetchData()
      })
      .environmentObject(apiManager)
    }
}

