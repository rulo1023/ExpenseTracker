import { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import Ionicons from '@expo/vector-icons/Ionicons';

import HomeScreen from './screens/home-screen';
import TransactionsScreen from './screens/transactions-screen';
import AddExpenseScreen from './screens/add-expense-screen';
import CategoriesScreen from './screens/categories-screen';

const tabs = [
  {
    label: 'Resumen',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    label: 'Movimientos',
    icon: 'receipt-outline',
    activeIcon: 'receipt',
  },
  {
    label: 'Añadir',
    icon: 'add-circle-outline',
    activeIcon: 'add-circle',
  },
  {
    label: 'Categorías',
    icon: 'grid-outline',
    activeIcon: 'grid',
  },
] as const;

export default function MainPager() {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  function goToPage(page: number) {
    pagerRef.current?.setPage(page);
  }

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(event) => {
          setCurrentPage(event.nativeEvent.position);
        }}
      >
        <View
          key="home"
          style={styles.page}
          collapsable={false}
        >
          <HomeScreen
            onAddExpense={() => goToPage(2)}
          />
        </View>

        <View
          key="transactions"
          style={styles.page}
          collapsable={false}
        >
          <TransactionsScreen />
        </View>

        <View
          key="add"
          style={styles.page}
          collapsable={false}
        >
          <AddExpenseScreen />
        </View>

        <View
          key="categories"
          style={styles.page}
          collapsable={false}
        >
          <CategoriesScreen />
        </View>
      </PagerView>

      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const active = currentPage === index;

          return (
            <Pressable
              key={tab.label}
              style={styles.tab}
              onPress={() => goToPage(index)}
            >
              <Ionicons
                name={
                  active
                    ? tab.activeIcon
                    : tab.icon
                }
                size={23}
                color={
                  active
                    ? '#111827'
                    : '#9CA3AF'
                }
              />

              <Text
                style={[
                  styles.tabLabel,
                  active &&
                    styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  pager: {
    flex: 1,
  },

  page: {
    flex: 1,
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    paddingBottom: 10,
  },

  tab: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  tabLabelActive: {
    color: '#111827',
    fontWeight: '700',
  },
});
