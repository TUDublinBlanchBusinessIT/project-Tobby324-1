import { Text, View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/app/auth-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Tools", "Sports", "Outdoor", "Electronics"];

  const mockRequests = [
    {
      id: "1",
      itemName: "Electric Drill",
      startDate: "2025-11-25",
      endDate: "2025-11-30",
      status: "Waiting for lender response"
    }
  ];

  const mockItems = [
    {
      id: "1",
      title: "Electric Drill",
      description: "DeWalt 20V cordless drill, barely used",
      category: "Tools",
      imageUrl: "https://via.placeholder.com/60",
      pricePerDay: 15,
      isFree: false,
      ownerName: "James Wilson",
      ownerAvatar: "https://via.placeholder.com/30"
    },
    {
      id: "2",
      title: "Mountain Bike",
      description: "Trek X-Caliber full suspension, 29er",
      category: "Sports",
      imageUrl: "https://via.placeholder.com/60",
      pricePerDay: 25,
      isFree: false,
      ownerName: "You",
      ownerAvatar: "https://via.placeholder.com/30"
    },
    {
      id: "3",
      title: "Camping Tent",
      description: "Coleman 4-person tent, waterproof, includes stakes",
      category: "Outdoor",
      imageUrl: "https://via.placeholder.com/60",
      pricePerDay: 0,
      isFree: true,
      ownerName: "James Wilson",
      ownerAvatar: "https://via.placeholder.com/30"
    },
    {
      id: "4",
      title: "Ladder",
      description: "6-foot aluminum ladder, lightweight and stable",
      category: "Tools",
      imageUrl: "https://via.placeholder.com/60",
      pricePerDay: 8,
      isFree: false,
      ownerName: "James Wilson",
      ownerAvatar: "https://via.placeholder.com/30"
    },
    {
      id: "5",
      title: "DSLR Camera",
      description: "Canon EOS R50, 24.2MP with 18-45mm lens",
      category: "Electronics",
      imageUrl: "https://via.placeholder.com/60",
      pricePerDay: 35,
      isFree: false,
      ownerName: "You",
      ownerAvatar: "https://via.placeholder.com/30"
    }
  ];

  function handleCategoryPress(category: string) {
    setSelectedCategory(category);
  }

  function handleItemPress(itemId: string) {
    console.log("Item pressed:", itemId);
  }

  function renderBorrowerUI() {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Browse Items</Text>
          <Text style={styles.headerSubtitle}>Find and borrow items from your community</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
          {categories.map((category) => {
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryPill,
                  selectedCategory === category && styles.categoryPillActive
                ]}
                onPress={() => handleCategoryPress(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>My Requests</Text>
          {mockRequests.map((request) => {
            return (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestStatus}>Pending</Text>
                </View>
                <Text style={styles.requestItemName}>{request.itemName}</Text>
                <Text style={styles.requestDates}>
                  {request.startDate} to {request.endDate}
                </Text>
                <Text style={styles.requestStatusText}>{request.status}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Available Items ({mockItems.length})</Text>
          {mockItems.map((item) => {
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => handleItemPress(item.id)}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <View style={styles.itemFooter}>
                    <View style={styles.ownerInfo}>
                      <Image source={{ uri: item.ownerAvatar }} style={styles.ownerAvatar} />
                      <Text style={styles.ownerName}>{item.ownerName}</Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      {item.isFree ? "Free" : "$" + item.pricePerDay + "/day"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  if (user && user.userType === "borrower") {
    return renderBorrowerUI();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.placeholderText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#0d7c8a",
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  searchContainer: {
    padding: 15,
    backgroundColor: "#fff",
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  categoryContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  categoryPill: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: "#0d7c8a",
  },
  categoryText: {
    fontSize: 14,
    color: "#555",
  },
  categoryTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  requestsSection: {
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  requestCard: {
    backgroundColor: "#fff9e6",
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#ffa500",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  requestStatus: {
    fontSize: 12,
    color: "#ffa500",
    fontWeight: "bold",
  },
  requestItemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  requestDates: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  requestStatusText: {
    fontSize: 12,
    color: "#ffa500",
    fontStyle: "italic",
  },
  itemsSection: {
    padding: 15,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: "#e8d5e8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: "#8b5a8b",
  },
  itemDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  ownerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    marginRight: 6,
  },
  ownerName: {
    fontSize: 12,
    color: "#666",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0d7c8a",
  },
  placeholderText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
    color: "#666",
  },
});
