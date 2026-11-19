import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type PasswordInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
};

export function PasswordInput({
  value,
  onChangeText,
  placeholder,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999999"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!isVisible}
        autoCapitalize="none"
        textContentType="password"
      />
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
        onPress={() => setIsVisible((visible) => !visible)}
      >
        <Text style={styles.toggle}>{isVisible ? 'HIDE' : 'SHOW'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 8,
    backgroundColor: '#252525',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    color: '#FFFFFF',
  },
  toggle: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: 'bold',
    paddingLeft: 12,
  },
});
