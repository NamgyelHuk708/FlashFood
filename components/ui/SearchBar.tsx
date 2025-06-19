// PRESENTATION LAYER - Reusable Search Component
import type React from "react"
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  onClear?: () => void
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, placeholder = "Search...", onClear }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 5,
  },
})

export default SearchBar
