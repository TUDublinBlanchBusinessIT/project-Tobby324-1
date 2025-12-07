import { Text, View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/auth-context';
import { auth } from '@/config/firebase';
import {
  subscribeToAvailableItems,
  subscribeToUserRequests,
  searchItems,
  Item,
  BorrowRequest
} from '@/services/firebase-service';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [items, setItems] = useState<Item[]>([]);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const categories = ["All", "Tools", "Sports", "Outdoor", "Electronics"];

  // Subscribe to real-time items updates
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = subscribeToAvailableItems((newItems) => {
      setItems(newItems);
      setFilteredItems(newItems);
      setIsLoading(false);
    }, selectedCategory);

    return () => unsubscribe();
  }, [selectedCategory]);

  // Subscribe to user's requests
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = subscribeToUserRequests(auth.currentUser.uid, (newRequests) => {
      setRequests(newRequests);
    });

    return () => unsubscribe();
  }, []);

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setFilteredItems(items);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchItems(searchQuery);
        // Apply category filter if not "All"
        const filtered = selectedCategory === "All"
          ? results
          : results.filter(item => item.category === selectedCategory);
        setFilteredItems(filtered);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, items, selectedCategory]);

  function handleCategoryPress(category: string) {
    setSelectedCategory(category);
  }

  function handleItemPress(itemId: string) {
    router.push(`/item-details?id=${itemId}`);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return '#ffa500';
      case 'approved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      case 'active':
        return '#2196f3';
      case 'completed':
        return '#9e9e9e';
      default:
        return '#ffa500';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'pending':
        return 'Waiting for lender response';
      case 'approved':
        return 'Approved - Ready to pickup';
      case 'rejected':
        return 'Request declined';
      case 'active':
        return 'Currently borrowing';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  }

  function renderBorrowerUI() {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d7c8a" />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      );
    }

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
          {isSearching && (
            <ActivityIndicator size="small" color="#0d7c8a" style={styles.searchLoader} />
          )}
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

        {requests.length > 0 && (
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>My Requests ({requests.length})</Text>
            {requests.slice(0, 3).map((request) => {
              const statusColor = getStatusColor(request.status);
              return (
                <View key={request.id} style={[styles.requestCard, { borderLeftColor: statusColor }]}>
                  <View style={styles.requestHeader}>
                    <Text style={[styles.requestStatus, { color: statusColor }]}>
                      {request.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.requestItemName}>{request.itemName}</Text>
                  <Text style={styles.requestDates}>
                    {request.startDate} to {request.endDate}
                  </Text>
                  <Text style={[styles.requestStatusText, { color: statusColor }]}>
                    {getStatusText(request.status)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>
            Available Items ({filteredItems.length})
          </Text>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No items found matching your search' : 'No items available'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try a different search term' : 'Check back later for new items'}
              </Text>
            </View>
          ) : (
            filteredItems.map((item) => {
              const isOwnItem = item.ownerId === auth.currentUser?.uid;
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
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <View style={styles.itemFooter}>
                      <View style={styles.ownerInfo}>
                        <Image source={{ uri: item.ownerAvatar }} style={styles.ownerAvatar} />
                        <Text style={styles.ownerName}>
                          {isOwnItem ? 'You' : item.ownerName}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        {item.isFree ? "Free" : `$${item.pricePerDay}/day`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  searchLoader: {
    position: "absolute",
    right: 15,
    top: 27,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
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
