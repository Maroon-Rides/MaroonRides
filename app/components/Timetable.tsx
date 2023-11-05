import { Text, View } from "react-native";
import React  from "react";

function Timetable({ timetable, tintColor }) {
  return (
    <View className="flex flex-row justify-around items-baseline">
      {Object.entries(timetable[0]).map((elm) => {
        const timePoint = elm[0];
        const times = elm[1];

        return (
          <View className="gap-y-3">
            <Text className="w-20 mb-2 font-bold" numberOfLines={2} ellipsizeMode="tail">{timePoint}</Text>
            {(times as unknown as string[]).map((time, index) => {
              const timeValue = new Date(time);

              const localTime = timeValue.toLocaleString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              });

              return (
                <View key={index}>
                  <Text>{localTime}</Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

export default Timetable;
