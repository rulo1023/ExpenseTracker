import Ionicons from '@expo/vector-icons/Ionicons';
import { isRunningInExpoGo } from 'expo';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PagerView from 'react-native-pager-view';

import AddExpenseScreen from './screens/add-expense-screen';
import AddIncomeScreen from './screens/add-income-screen';
import CategoriesScreen from './screens/categories-screen';
import HomeScreen from './screens/home-screen';
import PlanningScreen from './screens/planning-screen';
import SettingsScreen from './screens/settings-screen';
import TransactionsScreen from './screens/transactions-screen';
import { useAppSettings } from '../context/app-settings-context';
import { useAppStyles } from '../lib/themed-styles';

export type E5Status =
  | 'expo-go'
  | 'preparing'
  | 'ready'
  | 'error';

export default function MainPager() {
  const styles = useAppStyles(lightStyles);
  const { isDark } = useAppSettings();
  const tabIconColor = isDark ? '#F9FAFB' : '#111827';
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [e5Status, setE5Status] =
    useState<E5Status>('preparing');
  const [addMode, setAddMode] = useState<'expense' | 'income'>('expense');
  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    // Expo Go no contiene ONNX Runtime.
    if (isRunningInExpoGo()) {
      setE5Status('expo-go');
      return;
    }

    void import(
      '../lib/expense-intelligence/e5-engine'
    )
      .then(({ initializeE5 }) =>
        initializeE5()
      )
      .then(() => {
        setE5Status('ready');

        if (__DEV__) {
          console.log(
            '[E5] tokenizer y sesión preparados para inferencia'
          );
        }
      })
      .catch((error) => {
        setE5Status('error');

        console.warn(
          '[E5] no se pudo preparar el modelo',
          error
        );
      });
  }, []);

  function goToPage(page: number) {
    pagerRef.current?.setPage(page);
  }

  function openComposer(mode: 'expense' | 'income') {
    setAddMode(mode);
    goToPage(2);
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
          collapsable={false}
        >
          <HomeScreen
            onAddExpense={() => openComposer('expense')}
            onOpenSettings={() => setSettingsVisible(true)}
          />
        </View>

        <View
          key="transactions"
          style={styles.page}
          collapsable={false}
        >
        <TransactionsScreen onOpenSettings={() => setSettingsVisible(true)} />
        </View>

        <View
          key="add"
          style={styles.page}
          collapsable={false}
        >
          {addMode === 'expense' ? (
            <AddExpenseScreen
              onSwitchIncome={() => setAddMode('income')}
              onOpenSettings={() => setSettingsVisible(true)}
            />
          ) : (
            <AddIncomeScreen
              onSwitchExpense={() => setAddMode('expense')}
              onOpenSettings={() => setSettingsVisible(true)}
            />
          )}
        </View>

        <View
          key="planning"
          style={styles.page}
          collapsable={false}
        >
          <PlanningScreen
            onAddIncome={() => openComposer('income')}
            onOpenSettings={() => setSettingsVisible(true)}
          />
        </View>

        <View
          key="categories"
          style={styles.page}
          collapsable={false}
        >
          <CategoriesScreen onOpenSettings={() => setSettingsVisible(true)} />
        </View>
      </PagerView>

      <View style={styles.tabBar}>
        <Pressable
          style={styles.tab}
          onPress={() =>
            goToPage(0)
          }
        >
          <Ionicons
            name={
              currentPage === 0
                ? 'home'
                : 'home-outline'
            }
            size={23}
            color={
              currentPage === 0
                ? tabIconColor
                : '#9CA3AF'
            }
          />

          <Text
            style={[
              styles.tabLabel,
              currentPage === 0 &&
                styles.tabLabelActive,
            ]}
          >
            Resumen
          </Text>
        </Pressable>

        <Pressable
          style={styles.tab}
          onPress={() =>
            goToPage(1)
          }
        >
          <Ionicons
            name={
              currentPage === 1
                ? 'receipt'
                : 'receipt-outline'
            }
            size={23}
            color={
              currentPage === 1
                ? tabIconColor
                : '#9CA3AF'
            }
          />

          <Text
            style={[
              styles.tabLabel,
              currentPage === 1 &&
                styles.tabLabelActive,
            ]}
          >
            Movimientos
          </Text>
        </Pressable>

        <View style={styles.addTab}>
          <Pressable
            style={[
              styles.addButton,
              currentPage === 2 &&
                styles.addButtonActive,
            ]}
            onPress={() => openComposer('expense')}
          >
            <Ionicons
              name="add"
              size={33}
              color="#FFFFFF"
            />
          </Pressable>

          <Text
            style={[
              styles.addLabel,
              currentPage === 2 &&
                styles.addLabelActive,
            ]}
          >
            Añadir
          </Text>
        </View>

        <Pressable
          style={styles.tab}
          onPress={() =>
            goToPage(3)
          }
        >
          <Ionicons
            name={
              currentPage === 3
                ? 'calendar'
                : 'calendar-outline'
            }
            size={23}
            color={
              currentPage === 3
                ? tabIconColor
                : '#9CA3AF'
            }
          />

          <Text
            style={[
              styles.tabLabel,
              currentPage === 3 &&
                styles.tabLabelActive,
            ]}
          >
            Planificación
          </Text>
        </Pressable>

        <Pressable
          style={styles.tab}
          onPress={() =>
            goToPage(4)
          }
        >
          <Ionicons
            name={
              currentPage === 4
                ? 'grid'
                : 'grid-outline'
            }
            size={23}
            color={
              currentPage === 4
                ? tabIconColor
                : '#9CA3AF'
            }
          />

          <Text
            style={[
              styles.tabLabel,
              currentPage === 4 &&
                styles.tabLabelActive,
            ]}
          >
            Categorías
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <SettingsScreen e5Status={e5Status} onClose={() => setSettingsVisible(false)} />
      </Modal>
    </View>
  );
}

const lightStyles = StyleSheet.create({
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
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 7,
    paddingBottom: 9,
  },

  tab: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabLabel: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  tabLabelActive: {
    color: '#111827',
    fontWeight: '700',
  },

  addTab: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  addButton: {
    position: 'absolute',
    top: -30,
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 8,
  },

  addButtonActive: {
    backgroundColor: '#4F46E5',
  },

  addLabel: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  addLabelActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
});
