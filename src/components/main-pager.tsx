import { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import PagerView from '@expo/ui/community/pager-view';

import HomeScreen from './screens/home-screen';
import TransactionsScreen from './screens/transactions-screen';
import AddExpenseScreen from './screens/add-expense-screen';
import CategoriesScreen from './screens/categories-screen';

const tabs = [
  {
    label: 'Resumen',
    icon: '⌂',
  },
  {
    label: 'Movimientos',
    icon: '↕',
  },
  {
    label: 'Añadir',
    icon: '＋',
  },
  {
    label: 'Categorías',
    icon: '▦',
  },
];

export default function MainPager() {
  const pagerRef = useRef<any>(null);

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
          setCurrentPage(
            event.nativeEvent.position
          );
        }}
      >
        <View
          key="home"
          style={styles.page}
        >
          <HomeScreen
            onAddExpense={() => goToPage(2)}
          />
        </View>

        <View
          key="transactions"
          style={styles.page}
        >
          <TransactionsScreen />
        </View>

        <View
          key="add"
          style={styles.page}
        >
          <AddExpenseScreen />
        </View>

        <View
          key="categories"
          style={styles.page}
        >
          <CategoriesScreen />
        </View>
      </PagerView>

      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const active =
            currentPage === index;

          return (
            <Pressable
              key={tab.label}
              style={styles.tab}
              onPress={() =>
                goToPage(index)
              }
            >
              <Text
                style={[
                  styles.tabIcon,
                  active &&
                    styles.tabIconActive,
                ]}
              >
                {tab.icon}
              </Text>

              <Text
                style={[
                  styles.tabLabel,
                  active &&
                    styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>

              <View
                style={[
                  styles.indicator,
                  active &&
                    styles.indicatorActive,
                ]}
              />
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
    paddingBottom: 10,
    paddingTop: 7,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },

  tabIcon: {
    fontSize: 20,
    color: '#9CA3AF',
  },

  tabIconActive: {
    color: '#111827',
  },

  tabLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  tabLabelActive: {
    color: '#111827',
    fontWeight: '700',
  },

  indicator: {
    position: 'absolute',
    top: -7,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },

  indicatorActive: {
    backgroundColor: '#111827',
  },
});
