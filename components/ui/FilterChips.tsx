// PRESENTATION LAYER - Reusable Filter Component with proper type handling
import type React from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"

interface FilterChipsProps {
  selectedCuisine?: string
  selectedRating?: number
  onCuisineChange: (cuisine: string) => void
  onRatingChange: (rating: number) => void
  onClear: () => void
  hasActiveFilters: boolean
}

const cuisineTypes = ["All", "Italian", "Chinese", "Japanese", "Mexican", "Indian", "American", "French", "Thai"]
const ratingOptions = [
  { value: 0, label: "All" },
  { value: 3, label: "3+ ⭐" },
  { value: 4, label: "4+ ⭐" },
  { value: 4.5, label: "4.5+ ⭐" },
]

const FilterChips: React.FC<FilterChipsProps> = ({
  selectedCuisine = "All",
  selectedRating = 0,
  onCuisineChange,
  onRatingChange,
  onClear,
  hasActiveFilters,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuisine</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {cuisineTypes.map((cuisine) => (
            <TouchableOpacity
              key={cuisine}
              style={[styles.chip, selectedCuisine === cuisine && styles.chipActive]}
              onPress={() => onCuisineChange(cuisine)}
            >
              <Text style={[styles.chipText, selectedCuisine === cuisine && styles.chipTextActive]}>{cuisine}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rating</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {ratingOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, selectedRating === option.value && styles.chipActive]}
              onPress={() => onRatingChange(option.value)}
            >
              <Text style={[styles.chipText, selectedRating === option.value && styles.chipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FF6B35",
    borderRadius: 15,
  },
  clearText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 15,
    marginBottom: 8,
  },
  chipScroll: {
    paddingHorizontal: 15,
  },
  chip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "#FF6B35",
  },
  chipText: {
    fontSize: 12,
    color: "#666",
  },
  chipTextActive: {
    color: "#fff",
  },
})

export default FilterChips
