import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location'; // Import the Location module
import { Image } from 'react-native';

const CustomNotification = ({ message, onClose }) => {
  return (
    <View style={notificationStyles.container}>
      <View style={notificationStyles.innerContainer}>
        <View style={notificationStyles.messageContainer}>
          <Text style={notificationStyles.message}>{message}</Text>
          </View>
        <TouchableOpacity style={notificationStyles.closeButton} onPress={onClose}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

let locationsOfInterest = [
  {
    title: "Commons",
    location: {
      latitude: 30.61537411641874,
      longitude: -96.33715082738541
    },
  },
  {
    title: "Lewis Street",
    location: {
      latitude: 30.611253659502868,
      longitude: -96.3356478256135
    },
  },
  {
    title: "Southside Rec",
    location: {
      latitude: 30.61535238796324,
      longitude: -96.3338886824899
    },
  },
  {
    title: "Ross and Bizzell",
    location: {
      latitude: 30.61980637703089,
      longitude: -96.33820827925067 
    },
  },
  {
    title: "Ross and Ireland",
    location: {
      latitude:  30.617691945212947,
      longitude: -96.34125330410123 
    },
  },
  {
    title: "Fish Pond",
    location: {
      latitude: 30.61644036868911,
      longitude: -96.34308290839124 
    },
  },
  {
    title: "MSC - ILCB",
    location: {
      latitude: 30.612586721749967,
      longitude: -96.34355663281082 
    },
  },
  {
    title: "Kleberg",
    location: {
      latitude: 30.609888451449454,
      longitude: -96.34670005198542 
    },
  },
  {
    title: "Reed Arena",
    location: {
      latitude: 30.605305297793567,
      longitude: -96.34753209489811 
    },
  },
  {
    title: "Lot 100G",
    location: {
      latitude: 30.605646023272996,
      longitude: -96.34509961964976
    },
  },
  {
    title: "Rec Center",
    location: {
      latitude: 30.60677254360113,
      longitude: -96.34474674957903 
    },
  },
  {
    title: "HEEP",
    location: {
      latitude: 30.611995450798645,
      longitude: -96.34791185413819
    },
  },
  {
    title: "Asbury Water Tower",
    location: {
      latitude: 30.617677182905105,
      longitude: -96.3433081946236
    },
  }
  
]

export default function App() {
  const [selectedStartMarker, setSelectedStartMarker] = useState(null);
  const [selectedDestMarker, setSelectedDestMarker] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [closestMarkers, setClosestMarkers] = useState([]);
  const [showCurrentLocation, setShowCurrentLocation] = useState(false);
  const [draggablePin, setDraggablePin] = useState(null);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setNotificationMessage('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Initialize draggable pin at current location
      setDraggablePin({
        latitude: 30.612603301354493, //location.coords.latitude + 1, //COME BACK
        longitude:  -96.34181472982877 //location.coords.longitude + 1,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      findClosestMarkers(currentLocation);
    }
  }, [currentLocation]);

  const onRegionChange = (region) => {
    //console.log(region);
  };

  const selectMarker = (marker) => {
    if (selectedStartMarker === marker) {
      setSelectedStartMarker(null);
    } else if (selectedDestMarker === marker) {
      setSelectedDestMarker(null);
    } else if (!selectedStartMarker) {
      setSelectedStartMarker(marker);
    } else if (!selectedDestMarker) {
      setSelectedDestMarker(marker);
    }
  };

  const handleDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setDraggablePin({ latitude, longitude });

    // Find the closest marker to the dragged pin
    const closestMarkerToDraggedPin = findClosestMarker({ latitude, longitude });

    // Highlight the closest marker to the dragged pin in orange
    setSelectedStartMarker(closestMarkerToDraggedPin);

    if (currentLocation) {
      // Find the closest marker to the current location
      const closestMarkerToCurrentLocation = findClosestMarker(currentLocation);

      // Highlight the closest marker to the current location in orange
      setSelectedDestMarker(closestMarkerToCurrentLocation);
    }
  };
  
const stops = {'Commons': [1], 'Lewis Street': [1], 'Southside Rec': [1], 'Ross and Bizzell': [1, 4], 'Ross and Ireland': [1, 4],
'Fish Pond': [1, 4], 'MSC - ILCB': [1], 'Kleberg': [1], 'Reed Arena': [1], 'Lot 100G':[1], "Rec Center" : [1], 'HEEP' : [1],
'Asbury Water Tower': [1, 4], 'Wisenbaker': [4], 'The Gardens': [4], 'Becky Gates Center': [4], 'Hensel @ Texas': [4], 'Zachry': [4]};


function intersect(list1, list2) {
  if (!list1 || !list2) {
    return []; // Return an empty array or handle this case accordingly
  }

  const set1 = new Set(list1.map(String)); // Convert list1 elements to strings
  const set2 = new Set(list2.map(String)); // Convert list2 elements to strings
  const setU = new Set();

  for (const item of set1) {
    if (set2.has(item)) {
      setU.add(item);
    }
  }

  return Array.from(setU); // Convert the result back to an array if needed
}



const findRoute = (selectedStartMarker, selectedDestMarker) => {
  const setU = intersect(stops[selectedStartMarker.title], stops[selectedDestMarker.title]);
  if (setU.length === 0) {
    setNotificationMessage('No Available Bus Routes :( Try to walk, bike, VEO, or ride share!');
  } else {
    const str = `Route to ${selectedDestMarker.title}: Bus Route(s) ` + setU.join(', ');
    setNotificationMessage(str);
  }
};

const confirmSelection = () => {
  if (selectedStartMarker && selectedDestMarker) {
    findRoute(selectedStartMarker, selectedDestMarker);
    setSelectedStartMarker(null);
    setSelectedDestMarker(null);
  } else {
    setNotificationMessage("Select both start and destination pins!!");
  }
};

const showLocationsOfInterest = () => {
  return locationsOfInterest.map((item, index) => {
    const isClosestMarker = closestMarkers.includes(item);
    const isHidden = !showCurrentLocation && !isClosestMarker;

    return (
      <Marker
        key={index}
        coordinate={item.location}
        title={item.title}
        description={item.description}
        pinColor={
          selectedStartMarker?.title === item.title
            ? 'green'
            : selectedDestMarker?.title === item.title
            ? 'red'
            : isClosestMarker
            ? 'black'
            : 'black'
        }
        onPress={() => selectMarker(item)}
        opacity={isHidden ? 0 : 1}
      >
        <Callout>
          <Text>{item.title}</Text>
        </Callout>
      </Marker>
    );
  });
};

const findClosestMarkers = (currentLocation) => {
  const sortedMarkers = [...locationsOfInterest].sort((a, b) => {
    const aDistance = getDistance(currentLocation, a.location);
    const bDistance = getDistance(currentLocation, b.location);
    return aDistance - bDistance;
  });
  setClosestMarkers(sortedMarkers.slice(0, 2));
};


  const findClosestMarker = (location) => {
    let closestMarker = null;
    let closestDistance = Number.MAX_VALUE;
  
    locationsOfInterest.forEach((marker) => {
      const distance = getDistance(location, marker.location);
      if (distance < closestDistance) {
        closestMarker = marker;
        closestDistance = distance;
      }
    });
  
    return closestMarker;
  };

  

const getDistance = (location1, location2) => {
  const lat1 = location1.latitude;
  const lon1 = location1.longitude;
  const lat2 = location2.latitude;
  const lon2 = location2.longitude;

  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

return (
  <View style={styles.container}>
    <Image
    source={require('./logo.png')}
    style={styles.logo}
  />
    <MapView
      style={styles.map}
      onRegionChange={onRegionChange}
      initialRegion={{
        latitude: 30.61446139344223,
        latitudeDelta: 0.019075511625736397,
        longitude: -96.34006516326997,
        longitudeDelta: 0.011273115836317515,
      }}
    >
      {currentLocation && (
        <Marker
          coordinate={currentLocation}
          title="Your Location"
          description="You are here"
          pinColor="blue"
        >
          <Callout>
            <Text>Your Location</Text>
          </Callout>
        </Marker>
      )}

      {draggablePin && ( // Display draggable pin if it exists
        <Marker
          coordinate={draggablePin}
          draggable
          pinColor="blue" // Set the pin color to blue
          onDragEnd={(e) => handleDragEnd(e)}
        />
      )}

      {showLocationsOfInterest()}
    </MapView>

    <TouchableOpacity
      style={buttonStyles.container}
      onPress={confirmSelection}
    >
      <Text style={{ ...buttonStyles.text, marginBottom: 10 }}>Confirm Selection</Text>
    </TouchableOpacity>
    <StatusBar style="auto" />
    {notificationMessage && (
      <CustomNotification
        message={notificationMessage}
        onClose={() => setNotificationMessage('')}
      />
    )}
  </View>
);
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  logo: {
    position: 'absolute',
    top: 20, // Adjust the top position as needed
    left: 20, // Adjust the left position as needed
    width: 40, // Adjust the width as needed
    height: 40, // Adjust the height as needed
  },
  
  map: {
    flex: 1,
    width: '100%',
    height: '80%',
  },
});

const notificationStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  messageContainer: {
    flex: 1, // Take up remaining space
    maxHeight: 100, // Adjust this value as needed
  },
  innerContainer: {
    backgroundColor: 'black',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '95%',
    height: '10%'
  },
  message: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    paddingTop: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 360,
  },
});

const buttonStyles = StyleSheet.create({
  container: {
    backgroundColor: 'black', // Dark background color for the button
    padding: 30,
    borderRadius: 10,
    alignItems: 'center', // Center content horizontally
  },
  text: {
    color: 'white', // White text color for the button
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});