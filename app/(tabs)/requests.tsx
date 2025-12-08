import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/auth-context';
import {
  subscribeToUserRequests,
  getLenderRequests,
  updateRequestStatus,
  BorrowRequest
} from '@/services/firebase-service';

export default function RequestsScreen() {
  const { user } = useAuth();
  const [borrowerRequests, setBorrowerRequests] = useState<BorrowRequest[]>([]);
  const [lenderRequests, setLenderRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  const isLender = user?.userType === 'lender' || user?.userType === 'both';
  const isBorrower = user?.userType === 'borrower' || user?.userType === 'both';

  // Subscribe to borrower requests (requests I made)
  useEffect(() => {
    if (!user?.uid || !isBorrower) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserRequests(user.uid, (requests) => {
      setBorrowerRequests(requests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, isBorrower]);

  // Fetch lender requests (requests for my items)
  useEffect(() => {
    if (!user?.uid || !isLender) {
      setLoading(false);
      return;
    }

    const fetchLenderRequests = async () => {
      try {
        const requests = await getLenderRequests(user.uid);
        setLenderRequests(requests);
      } catch (error) {
        console.error('Error fetching lender requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLenderRequests();
    // Refresh every 10 seconds
    const interval = setInterval(fetchLenderRequests, 10000);

    return () => clearInterval(interval);
  }, [user?.uid, isLender]);

  const handleUpdateRequestStatus = async (
    requestId: string,
    status: BorrowRequest['status']
  ) => {
    const actionText = status === 'approved' ? 'approve' : 'reject';

    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Request`,
      `Are you sure you want to ${actionText} this request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          style: status === 'approved' ? 'default' : 'destructive',
          onPress: async () => {
            setUpdatingRequestId(requestId);
            try {
              await updateRequestStatus(requestId, status);
              // Refresh lender requests
              if (user?.uid) {
                const requests = await getLenderRequests(user.uid);
                setLenderRequests(requests);
              }
              Alert.alert('Success', `Request ${status} successfully`);
            } catch (error) {
              console.error('Error updating request:', error);
              Alert.alert('Error', 'Failed to update request');
            } finally {
              setUpdatingRequestId(null);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'approved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      case 'active':
        return '#2196f3';
      case 'completed':
        return '#9e9e9e';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const renderBorrowerRequest = ({ item }: { item: BorrowRequest }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <View style={[styles.requestCard, { borderLeftColor: statusColor }]}>
        <View style={styles.requestHeader}>
          <Text style={styles.requestItemName}>{item.itemName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.requestInfo}>
          <Text style={styles.requestLabel}>Dates:</Text>
          <Text style={styles.requestValue}>
            {item.startDate} - {item.endDate}
          </Text>
        </View>

        <View style={styles.requestInfo}>
          <Text style={styles.requestLabel}>Requested:</Text>
          <Text style={styles.requestValue}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {item.status === 'pending' && (
          <Text style={styles.pendingNote}>Waiting for lender response...</Text>
        )}
        {item.status === 'approved' && (
          <Text style={styles.approvedNote}>Ready to pick up!</Text>
        )}
        {item.status === 'rejected' && (
          <Text style={styles.rejectedNote}>Request was declined</Text>
        )}
      </View>
    );
  };

  const renderLenderRequest = ({ item }: { item: BorrowRequest }) => {
    const statusColor = getStatusColor(item.status);
    const isUpdating = updatingRequestId === item.id;

    return (
      <View style={[styles.requestCard, { borderLeftColor: statusColor }]}>
        <View style={styles.requestHeader}>
          <Text style={styles.requestItemName}>{item.itemName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.requestInfo}>
          <Text style={styles.requestLabel}>Borrower:</Text>
          <Text style={styles.requestValue}>{item.borrowerName}</Text>
        </View>

        <View style={styles.requestInfo}>
          <Text style={styles.requestLabel}>Dates:</Text>
          <Text style={styles.requestValue}>
            {item.startDate} - {item.endDate}
          </Text>
        </View>

        <View style={styles.requestInfo}>
          <Text style={styles.requestLabel}>Requested:</Text>
          <Text style={styles.requestValue}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.approveButton, isUpdating && styles.buttonDisabled]}
              onPress={() => handleUpdateRequestStatus(item.id, 'approved')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.approveButtonText}>Approve</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rejectButton, isUpdating && styles.buttonDisabled]}
              onPress={() => handleUpdateRequestStatus(item.id, 'rejected')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.rejectButtonText}>Reject</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0d7c8a" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Requests</Text>
        <Text style={styles.headerSubtitle}>
          {isLender && isBorrower
            ? 'Manage your requests'
            : isLender
            ? 'Incoming requests for your items'
            : 'Your borrow requests'}
        </Text>
      </View>

      {/* For users who are both borrower and lender */}
      {isLender && isBorrower ? (
        <View style={styles.tabsContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Incoming Requests ({lenderRequests.length})
            </Text>
            {lenderRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No incoming requests</Text>
                <Text style={styles.emptySubtext}>
                  Requests for your items will appear here
                </Text>
              </View>
            ) : (
              <FlatList
                data={lenderRequests}
                renderItem={renderLenderRequest}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          <View style={[styles.section, styles.sectionBorder]}>
            <Text style={styles.sectionTitle}>
              My Requests ({borrowerRequests.length})
            </Text>
            {borrowerRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No requests yet</Text>
                <Text style={styles.emptySubtext}>
                  Your borrow requests will appear here
                </Text>
              </View>
            ) : (
              <FlatList
                data={borrowerRequests}
                renderItem={renderBorrowerRequest}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      ) : isLender ? (
        /* Lender only */
        <View style={styles.fullSection}>
          {lenderRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No incoming requests</Text>
              <Text style={styles.emptySubtext}>
                Requests for your items will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={lenderRequests}
              renderItem={renderLenderRequest}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        /* Borrower only */
        <View style={styles.fullSection}>
          {borrowerRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No requests yet</Text>
              <Text style={styles.emptySubtext}>
                Your borrow requests will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={borrowerRequests}
              renderItem={renderBorrowerRequest}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#0d7c8a',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  tabsContainer: {
    flex: 1,
  },
  section: {
    flex: 1,
    padding: 16,
  },
  sectionBorder: {
    borderTopWidth: 8,
    borderTopColor: '#e0e0e0',
  },
  fullSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  requestLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  requestValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  pendingNote: {
    fontSize: 13,
    color: '#ff9800',
    fontStyle: 'italic',
    marginTop: 8,
  },
  approvedNote: {
    fontSize: 13,
    color: '#4caf50',
    fontWeight: '600',
    marginTop: 8,
  },
  rejectedNote: {
    fontSize: 13,
    color: '#f44336',
    fontStyle: 'italic',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
