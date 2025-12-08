import { Text, View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/auth-context';
import { auth } from '@/config/firebase';
import {
  subscribeToAvailableItems,
  subscribeToUserRequests,
  subscribeToUserItems,
  getLenderRequests,
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

  // Lender dashboard data
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [lenderRequests, setLenderRequests] = useState<BorrowRequest[]>([]);

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

  // Subscribe to user's items (for lenders)
  useEffect(() => {
    if (!auth.currentUser || user?.userType === 'borrower') return;

    const unsubscribe = subscribeToUserItems(auth.currentUser.uid, (items) => {
      setUserItems(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.userType]);

  // Fetch lender requests
  useEffect(() => {
    if (!auth.currentUser || user?.userType === 'borrower') return;

    const fetchRequests = async () => {
      try {
        const requests = await getLenderRequests(auth.currentUser!.uid);
        setLenderRequests(requests);
      } catch (error) {
        console.error('Error fetching lender requests:', error);
      }
    };

    fetchRequests();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRequests, 30000);

    return () => clearInterval(interval);
  }, [user?.userType]);

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
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const approvedRequests = requests.filter(r => r.status === 'approved');
    const activeRequests = requests.filter(r => r.status === 'active');

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d7c8a" />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Borrower Dashboard</Text>
            <Text style={styles.headerSubtitle}>Browse and manage your borrowed items</Text>
          </View>

          {/* Statistics Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>📋</Text>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>My Requests</Text>
                <Text style={styles.statValue}>{requests.length}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>⏳</Text>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statValue}>{pendingRequests.length}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>✅</Text>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Approved</Text>
                <Text style={styles.statValue}>{approvedRequests.length}</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.viewRequestsButton}
              onPress={() => router.push('/(tabs)/requests')}
            >
              <Text style={styles.viewRequestsButtonText}>📋 View My Requests</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Requests */}
          {requests.length > 0 && (
            <View style={styles.recentItemsSection}>
              <View style={styles.recentItemsHeader}>
                <Text style={styles.recentItemsTitle}>Recent Requests</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/requests')}>
                  <Text style={styles.viewAllLink}>View All</Text>
                </TouchableOpacity>
              </View>

              {requests.slice(0, 3).map((request) => {
                const statusColor = getStatusColor(request.status);
                return (
                  <TouchableOpacity
                    key={request.id}
                    style={styles.recentItemCard}
                    onPress={() => router.push('/(tabs)/requests')}
                  >
                    <View style={styles.recentItemInfo}>
                      <Text style={styles.recentItemName}>{request.itemName}</Text>
                      <Text style={styles.recentItemCategory}>{request.startDate} - {request.endDate}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.statusBadgeTextWhite}>{request.status.toUpperCase()}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Browse Items Section Header */}
          <View style={styles.browseItemsHeader}>
            <Text style={styles.browseItemsTitle}>Browse Available Items</Text>
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

          <View style={styles.itemsSection}>
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
                          {item.isFree ? "Free" : `€${item.price}/${item.pricingType}`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  function renderLenderUI() {
    const pendingRequests = lenderRequests.filter(r => r.status === 'pending');
    const activeLoans = lenderRequests.filter(r => r.status === 'approved' || r.status === 'active');

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d7c8a" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollContent}>
          <View style={styles.lenderHeader}>
            <Text style={styles.lenderHeaderTitle}>Your Lending Dashboard</Text>
            <Text style={styles.lenderHeaderSubtitle}>Manage your items and requests</Text>
          </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>📦</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Listed Items</Text>
              <Text style={styles.statValue}>{userItems.length}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>🕐</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Pending Requests</Text>
              <Text style={styles.statValue}>{pendingRequests.length}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>✅</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Active Loans</Text>
              <Text style={styles.statValue}>{activeLoans.length}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.addItemButton}
            onPress={() => router.push('/(tabs)/add-item')}
          >
            <Text style={styles.addItemButtonText}>+ Add New Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewRequestsButton}
            onPress={() => router.push('/(tabs)/requests')}
          >
            <Text style={styles.viewRequestsButtonText}>🕐 View Requests ({pendingRequests.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.activeLoansButton}
            onPress={() => router.push('/(tabs)/requests')}
          >
            <Text style={styles.activeLoansButtonText}>✅ Active Loans ({activeLoans.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Items */}
        <View style={styles.recentItemsSection}>
          <View style={styles.recentItemsHeader}>
            <Text style={styles.recentItemsTitle}>Your Recent Items</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/my-items')}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {userItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No items listed yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap "Add New Item" to get started</Text>
            </View>
          ) : (
            userItems.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentItemCard}
                onPress={() => router.push('/(tabs)/my-items')}
              >
                <View style={styles.recentItemInfo}>
                  <Text style={styles.recentItemName}>{item.title}</Text>
                  <Text style={styles.recentItemCategory}>{item.category}</Text>
                </View>
                <View style={item.available ? styles.availableBadge : styles.borrowedBadge}>
                  <Text style={item.available ? styles.availableBadgeText : styles.borrowedBadgeText}>
                    {item.available ? 'Available' : 'Borrowed'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (user?.userType === "borrower") {
    return renderBorrowerUI();
  }

  if (user?.userType === "lender" || user?.userType === "both") {
    return renderLenderUI();
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
  scrollContent: {
    flex: 1,
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
    paddingTop: Platform.OS === 'ios' ? 10 : 60,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
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
  browseItemsHeader: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: "#fff",
  },
  browseItemsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
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
    paddingBottom: 15,
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeTextWhite: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemsSection: {
    padding: 15,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
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
  // Lender Dashboard Styles
  lenderHeader: {
    backgroundColor: "#0d7c8a",
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 60,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  lenderHeaderTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  lenderHeaderSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  statsContainer: {
    padding: 15,
    gap: 12,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: Platform.OS === 'ios' ? 14 : 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statIconContainer: {
    marginRight: 15,
  },
  statIcon: {
    fontSize: 32,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  quickActionsSection: {
    padding: 15,
    paddingTop: 5,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  addItemButton: {
    backgroundColor: "#0d7c8a",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  addItemButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  viewRequestsButton: {
    backgroundColor: "#ff8c00",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  viewRequestsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  activeLoansButton: {
    backgroundColor: "#00c853",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  activeLoansButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  recentItemsSection: {
    padding: 15,
    paddingTop: 5,
  },
  recentItemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  recentItemsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  viewAllLink: {
    fontSize: 14,
    color: "#0d7c8a",
    fontWeight: "600",
  },
  recentItemCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  recentItemInfo: {
    flex: 1,
  },
  recentItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  recentItemCategory: {
    fontSize: 13,
    color: "#666",
  },
  availableBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  availableBadgeText: {
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "600",
  },
  borrowedBadge: {
    backgroundColor: "#fff3e0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  borrowedBadgeText: {
    fontSize: 12,
    color: "#e65100",
    fontWeight: "600",
  },
});
