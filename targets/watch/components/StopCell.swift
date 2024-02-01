//
//  StopCell.swift
//  Reveille Rides Watch App
//
//  Created by Brandon Wees on 1/31/24.
//

import SwiftUI

struct StopCell: View {
  var stop: Stop
  var direction: Direction
  var route: MapRoute
  
  @State var estimates: GetNextDepartTimesResponse?
  
  @EnvironmentObject var apiManager: APIManager
  
  func updateStopEstimates() {
    apiManager.getNextDepartureTimes(routeId: route.key, directionIds: [direction.key], stopCode: stop.stopCode)
      .sink(receiveCompletion: { completion in
        if case .failure(let error) = completion {
            apiManager.error = error
        }
      }, receiveValue: { data in
          estimates = data
      })
      .store(in: &apiManager.cancellables)
  }
  
  // refresh ETA every 30s
  let timer = Timer.publish(every: 30, on: .main, in: .common).autoconnect()
  
  var body: some View {
    VStack {
      HStack {
        Text(stop.name)
        Spacer()
      }
      if estimates == nil {
        ProgressView()
          .progressViewStyle(.circular)
          .padding()
      } else {
        if (estimates?.routeDirectionTimes[0].nextDeparts.count == 0) {
          HStack {
            Text("No times to show")
              .font(.subheadline)
              .foregroundColor(.gray)
            Spacer()
          }
        } else {
          ScrollView(.horizontal) {
            HStack {
              ForEach((estimates?.routeDirectionTimes[0].nextDeparts.deduplicated(by: \.estimatedDepartTimeUtc))!, id: \.scheduledDepartTimeUtc) { depart in
                // if first time
                if estimates?.routeDirectionTimes[0].nextDeparts.firstIndex(where: {$0.scheduledDepartTimeUtc == depart.scheduledDepartTimeUtc}) == 0 {
                  TimeBubble(
                    date: (depart.estimatedDepartTimeUtc ?? depart.scheduledDepartTimeUtc)!,
                    isLive: depart.estimatedDepartTimeUtc != nil,
                    color: Color(hex: route.directionList[0].lineColor)
                  )
                } else {
                  TimeBubble(
                    date: (depart.estimatedDepartTimeUtc ?? depart.scheduledDepartTimeUtc)!,
                    isLive: depart.estimatedDepartTimeUtc != nil,
                    color: Color(hex: "#48484a")
                  )
                }
              }
            }
          }
        }
        
      }
      Divider()

    }
    .onReceive(timer, perform: { _ in
      print("update")
      updateStopEstimates()
    })
    .onAppear(perform: {
      updateStopEstimates()
    })
  }
}
