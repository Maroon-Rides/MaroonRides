//
//  APIManager.swift
//  Maroon Rides Watch App
//
//  Created by Brandon Wees on 1/31/24.
//

import Foundation
import Combine

enum NetworkError: Error {
  case invalidURL
  case noData
  case serverError
  case invalidResponse
}

class APIManager: ObservableObject {
  @Published var baseData: GetBaseDataResponse?
  @Published var error: Error?
  
  
  private var authKey: String = ""
  var cancellables = Set<AnyCancellable>()
  let session = URLSession.shared

  
  func fetchData() {
    getAuthentication()
      .flatMap { auth in
        self.getBaseData(auth: auth)
      }
      .sink(receiveCompletion: { completion in
        if case .failure(let error) = completion {
          self.error = error
        }
      }, receiveValue: { baseData in
        self.baseData = baseData
      })
      .store(in: &cancellables)
    
  }
  
  
  private func getAuthentication() -> AnyPublisher<String, Error> {
    guard let url = URL(string: "https://aggiespirit.ts.tamu.edu/") else {
      return Fail(error: NetworkError.invalidURL).eraseToAnyPublisher()
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.httpShouldHandleCookies = false
    
    
    
    return session.dataTaskPublisher(for: request)
      .tryMap { data, response in
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200,
              let allHeaders = httpResponse.allHeaderFields as? [String: String],
              let setCookieHeader = allHeaders["Set-Cookie"] else {
          throw NetworkError.serverError
        }
        
        let cookies = setCookieHeader.split(separator: ",").map { String($0.trimmingCharacters(in: .whitespaces)) }
        return cookies.map { $0.split(separator: ";").first ?? "" }.joined(separator: "; ")
      }
      .receive(on: RunLoop.main)
      .eraseToAnyPublisher()
  }
  
  private func getBaseData(auth: String) -> AnyPublisher<GetBaseDataResponse, Error> {
    self.authKey = auth
    
    guard let url = URL(string: "https://aggiespirit.ts.tamu.edu/RouteMap/GetBaseData") else {
      return Fail(error: NetworkError.invalidURL).eraseToAnyPublisher()
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.addValue(auth, forHTTPHeaderField: "cookie")
    
    return session.dataTaskPublisher(for: request)
      .map(\.data)
      .decode(type: GetBaseDataResponse.self, decoder: JSONDecoder())
      .receive(on: RunLoop.main)
      .eraseToAnyPublisher()
  }
  
  func getPatternPaths(routeKeys: [String]) -> AnyPublisher<[GetPatternPathsResponse], Error> {

    let bodyData = routeKeys.map { "routeKeys%5B%5D=\($0)" }.joined(separator: "&")
    guard let url = URL(string: "https://aggiespirit.ts.tamu.edu/RouteMap/GetPatternPaths") else {
      return Fail(error: NetworkError.invalidURL).eraseToAnyPublisher()
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.addValue(self.authKey, forHTTPHeaderField: "cookie")
    request.setValue("application/x-www-form-urlencoded; charset=UTF-8", forHTTPHeaderField: "Content-Type")
    
    request.httpBody = bodyData.data(using: .utf8)
    
    return session.dataTaskPublisher(for: request)
      .tryMap { data, response in
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
          throw NetworkError.invalidResponse
        }
        return data
      }
      .decode(type: [GetPatternPathsResponse].self, decoder: JSONDecoder())
      .receive(on: DispatchQueue.main)
      .eraseToAnyPublisher()
  }
  
  func getNextDepartureTimes(routeId: String, directionIds: [String], stopCode: String) -> AnyPublisher<GetNextDepartTimesResponse, Error> {
    
      var bodyData = [String]()
      for (i, directionId) in directionIds.enumerated() {
          let directionData = "routeDirectionKeys[\(i)][routeKey]=\(routeId)&routeDirectionKeys[\(i)][directionKey]=\(directionId)&stopCode=\(stopCode)"
          bodyData.append(directionData)
      }
      let bodyString = bodyData.joined(separator: "&")

      guard let url = URL(string: "https://aggiespirit.ts.tamu.edu/RouteMap/GetNextDepartTimes") else {
          return Fail(error: NetworkError.invalidURL).eraseToAnyPublisher()
      }

      var request = URLRequest(url: url)
      request.httpMethod = "POST"
      request.addValue(self.authKey, forHTTPHeaderField: "cookie")
      request.setValue("application/x-www-form-urlencoded; charset=UTF-8", forHTTPHeaderField: "Content-Type")
      request.httpBody = bodyString.data(using: .utf8)

      return session.dataTaskPublisher(for: request)
          .tryMap { data, response in
              guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                  throw NetworkError.invalidResponse
              }
            
              return data
          }
          .decode(type: GetNextDepartTimesResponse.self, decoder: JSONDecoder())
          .receive(on: DispatchQueue.main)
          .eraseToAnyPublisher()
  }
}
