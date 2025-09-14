import { useSearchSuggestions } from '@data/queries/route_planning';
import useAppStore from '@data/state/app_state';
import { useTheme } from '@data/state/utils';
import { MyLocation, PlaceSuggestion, PlaceType } from '@data/types';
import { memo, useEffect, useState } from 'react';
import { Keyboard, Platform, TextInput, View } from 'react-native';

interface Props {
  location: PlaceSuggestion | null;
  icon: React.JSX.Element;
  onFocus: () => void;
  outputName: 'start' | 'end' | null;
  setSuggestionLoading: (loading: boolean) => void;
}

const SuggestionInput: React.FC<Props> = ({
  location,
  icon,
  onFocus,
  outputName,
  setSuggestionLoading,
}) => {
  const theme = useTheme();
  const setSuggestions = useAppStore((state) => state.setSuggestions);
  const suggestionsOutput = useAppStore((state) => state.suggestionOutput);
  const setSuggestionsOutput = useAppStore(
    (state) => state.setSuggestionOutput,
  );

  const [searchTerm, setSearchTerm] = useState('');
  const { data: suggestions, isLoading } = useSearchSuggestions(searchTerm);

  // figure out if this could be reactive state somehow. Maybe a context provider or a useRef?
  useEffect(() => {
    setSuggestionLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (location) {
      setSearchTerm(location.name);
      setSuggestions([]);
      Keyboard.dismiss();
    } else {
      setSearchTerm('');
    }
  }, [location]);

  useEffect(() => {
    if (!searchTerm) return;

    if (searchTerm.trim() === '' && suggestionsOutput) {
      setSuggestions([MyLocation]);
      return;
    }

    suggestionsOutput && setSuggestions(suggestions ?? []);
  }, [suggestions]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          backgroundColor: theme.tertiaryBackground,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          height: 36,
          width: 36,
          paddingVertical: 2,
          marginRight: 8,
        }}
      >
        {icon}
      </View>

      <TextInput
        style={{
          backgroundColor: theme.tertiaryBackground,
          color:
            location?.type === PlaceType.MY_LOCATION
              ? theme.myLocation
              : theme.text,
          borderColor: theme.myLocation,
          padding: 8,
          borderRadius: 8,
          height: 40,
          flex: 1,
        }}
        clearButtonMode="while-editing"
        value={searchTerm}
        onChangeText={(text) => {
          setSearchTerm(text);
          setSuggestionsOutput(outputName);
          if (text.trim() === '') {
            setSuggestions([MyLocation]);
            return;
          }
        }}
        onFocus={() => {
          // clear search so user can start typing immediately
          if (location?.type === PlaceType.MY_LOCATION) {
            setSearchTerm('');
          }
          if (searchTerm.trim() === '') {
            setSuggestions([MyLocation]);
          } else {
            setSuggestions(suggestions ?? []);
          }

          setSuggestionsOutput(outputName);
          onFocus();
        }}
        placeholder="Enter a location"
        placeholderTextColor={
          Platform.OS === 'android'
            ? theme.androidTextPlaceholderColor
            : undefined
        }
      />
    </View>
  );
};

export default memo(SuggestionInput);
