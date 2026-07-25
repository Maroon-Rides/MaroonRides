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
      if #available(watchOS 9, *) {
        NavigationStack {
          RouteList()
        }
        .onAppear(perform: {
          apiManager.fetchData()
        })
        .environmentObject(apiManager)
      } else {
        NavigationView {
          RouteList()
        }
        .navigationViewStyle(.stack)
        .onAppear(perform: {
          apiManager.fetchData()
        })
        .environmentObject(apiManager)
      }
    }
}

