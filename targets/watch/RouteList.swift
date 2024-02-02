//
//  RouteList.swift
//  Reveille Rides Watch App
//
//  Created by Brandon Wees on 1/31/24.
//

import SwiftUI

struct RouteList: View {
  @EnvironmentObject var apiManager: APIManager
  
  @State var favorites: [String] = []
  
  func getDirectionString(directions: [DirectionList]) -> String {
      return directions[0].destination + " | " + directions[1].destination
  }
  
  func reloadFavorites() {
    favorites = UserDefaults.standard.array(forKey: "favorites") as? [String] ?? []
  }
  
  var body: some View {
    if apiManager.baseData?.routes.count == 0 {
      ProgressView()
        .progressViewStyle(.circular)
        .scaleEffect(1)
    } else {
      List {
        
        // Favorites
        if (favorites.count > 0) {
          Section(header: Text("Favorites")) {
            ForEach(apiManager.baseData?.routes ?? [], id: \.key) { route in
              if (favorites.contains(route.shortName)) {
                NavigationLink {
                  RouteDetail(route: route, favorited: true)
                }
                label: {
                  RouteCell(
                    name: route.name,
                    number: route.shortName,
                    color: Color(hex: route.directionList[0].lineColor),
                    subtitle: route.directionList.count == 2 ? getDirectionString(directions: route.directionList) : ""
                  )
                }
              }
            }
          }
        }
        
        // All Routes
        Section(header: Text("All Routes")) {
          ForEach(apiManager.baseData?.routes ?? [], id: \.key) { route in
            NavigationLink {
              RouteDetail(route: route)
            }
            label: {
              RouteCell(
                name: route.name,
                number: route.shortName,
                color: Color(hex: route.directionList[0].lineColor),
                subtitle: route.directionList.count == 2 ? getDirectionString(directions: route.directionList) : ""
              )
            }
          }
        }
      }
      .onAppear(perform: {
        reloadFavorites()
      })
    }
  }
}

