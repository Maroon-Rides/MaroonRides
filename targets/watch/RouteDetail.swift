//
//  RouteDetail.swift
//  Maroon Rides Watch App
//
//  Created by Brandon Wees on 1/31/24.
//

import SwiftUI

struct RouteDetail: View {
  var route: MapRoute
  @EnvironmentObject var apiManager: APIManager
  
  @State var selectedDirection = 0
  @State var patternPaths: [GetPatternPathsResponse] = []
  @State var selectedPath: PatternPath?
  @State var favorited: Bool = false
  
  @State var error: Error?
  
  func updatePathData() {
    apiManager.getPatternPaths(
      routeKeys: [route.key]
    )
      .sink(receiveCompletion: { completion in
        if case .failure(let error) = completion {
          self.error = error
        }
      }, receiveValue: { data in
          patternPaths = data
          selectedPath = patternPaths[0].patternPaths.filter({$0.directionKey == route.directionList[selectedDirection].direction.key}).first
      })
      .store(in: &apiManager.cancellables)
  }
  
  
  var body: some View {
    ScrollView {
      HStack {
        Text(route.shortName)
          .padding([.vertical], 2)
          .padding([.horizontal], 6)
          .font(.system(size: 20).bold())
          .minimumScaleFactor(0.1)
          .lineLimit(1)
          .background(Color(hex: route.directionList[0].lineColor))
          .clipShape(.rect(cornerSize: CGSize(width: 8, height: 8)))
        
        MarqueeText(
          text: route.name,
          font: UIFont.preferredFont(forTextStyle: .headline),
          leftFade: 8,
          rightFade: 8,
          startDelay: 1
        )
          .padding([.leading], 2)
        
        Spacer()
        
        // favorites button
        Button(action: {
          var newFavorites = UserDefaults.standard.array(forKey: "favorites") as? [String] ?? []
          if favorited {
            newFavorites.removeAll(where: {$0 == route.shortName})
          } else {
            newFavorites.append(route.shortName)
          }
          
          favorited = !favorited
          
          UserDefaults.standard.setValue(newFavorites, forKey: "favorites")
        }) {
          if favorited {
            Image(systemName: "star.fill")
              .font(.system(size: 24))
              .foregroundColor(.yellow)
          } else {
            Image(systemName: "star")
              .font(.system(size: 24))
              .foregroundColor(.yellow)
          }
          
        }
          .buttonStyle(.plain)
          
      }

      
      if (route.directionList.count > 1) {
        Button(action: {
          var newSelected = selectedDirection + 1
          
          if newSelected >= route.directionList.count {
            newSelected = 0
          }
          selectedDirection = newSelected
          selectedPath = patternPaths[0].patternPaths.filter({$0.directionKey == route.directionList[selectedDirection].direction.key}).first
        }) {
          HStack(alignment: .center) {
            Image(systemName: "chevron.up.chevron.down")
            
            MarqueeText(
              text: "to " + route.directionList[selectedDirection].destination,
              font: UIFont.systemFont(ofSize: 16),
              leftFade: 8,
              rightFade: 8,
              startDelay: 1
            )
              .padding([.leading], 2)
          }
          .padding([.vertical], 4)
          .padding([.horizontal], 8)
          .background(.quaternary)
          .cornerRadius(32)
        }
          .buttonStyle(.plain)
      }
      

      if (patternPaths.count > 0 && (error == nil)) {
        Divider()
        ForEach(selectedPath!.patternPoints, id: \.key) { point in
          if (point.stop != nil) {
            StopCell(stop: point.stop!, direction: route.directionList[selectedDirection].direction, route: route)
          }
        }
        .listStyle(.plain)
        

      } else {
        if (error != nil) {
          ErrorView(text: "There was an error loading the route")
            .padding(.top, 16)
        } else {
          ProgressView()
            .progressViewStyle(.circular)
            .scaleEffect(1)
        }
      }
    }.onAppear(perform: {
      updatePathData()
    })
  }
}

