//
//  RouteList.swift
//  Maroon Rides Watch App
//
//  Created by Brandon Wees on 1/31/24.
//

import SwiftUI

struct RouteList: View {
  @EnvironmentObject var apiManager: APIManager
  
  @State var favorites: [String] = []
  @State var error: Error?
  
  func getDirectionString(directions: [DirectionList]) -> String {
      return directions[0].destination + " | " + directions[1].destination
  }
  
  func reloadFavorites() {
    favorites = UserDefaults.standard.array(forKey: "favorites") as? [String] ?? []
  }
  
  var body: some View {
    if apiManager.baseData?.routes.count == 0  || apiManager.error != nil {
      if (apiManager.error != nil) {
        ErrorView(text: "There was an error loading the routes.")
      } else {
        ProgressView()
          .progressViewStyle(.circular)
          .scaleEffect(1)
      }
    } else {
      List {
        // Favorites
        if (favorites.count > 0) {
          Section(header: HStack {
            Image(systemName: "star.fill")
            Text("Favorites")
          }) {
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
        Section(header: HStack {
          // what the hell is this
          Image(systemName: "point.bottomleft.forward.to.point.topright.scurvepath.fill")
          Text("All Routes")
        }) {
          ForEach(apiManager.baseData?.routes ?? [], id: \.key) { route in
            NavigationLink {
              RouteDetail(route: route)
            }
            label: {
              RouteCell(
                name: route.name,
                number: route.shortName,
                color: Color(hex: route.directionList[0].lineColor),
                subtitle: route.directionList.count == 2 
                  ? getDirectionString(directions: route.directionList)
                  : ""
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

