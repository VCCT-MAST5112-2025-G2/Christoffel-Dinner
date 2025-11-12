import React, { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput,
  Image, ScrollView, Alert, Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();
const logoImg = require('./assets/67.jpg');

const T = {
  background: '#020202',
  panel: '#111',
  text: '#ffffff',
  muted: '#bdb9b0',
  accent: '#ffffff',
  buttonBg: '#f5f3f8',
  buttonText: '#000',
};

const STORAGE_KEY = '@menu_items_v1';

// Load saved dishes
async function loadItems() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('loadItems error', e);
    return [];
  }
}

// Save dishes
async function saveItems(items) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('saveItems error', e);
  }
}

// 🏠 Home Screen
function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.app} contentContainerStyle={styles.centerScroll}>
      <StatusBar style="light" />
      <Image source={logoImg} style={styles.logo} />
      <Text style={styles.title}>Christoffel Dinner</Text>
      <Text style={styles.hint}>Welcome</Text>

      <TouchableOpacity style={styles.bigButton} onPress={() => navigation.navigate('Menu')}>
        <Text style={styles.bigButtonText}>Menu</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bigButton} onPress={() => navigation.navigate('Owner')}>
        <Text style={styles.bigButtonText}>Owner</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// 🍽️ Menu Screen
function MenuScreen() {
  const [selected, setSelected] = useState('Starters');
  const [items, setItems] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchItems = async () => {
        const fresh = await loadItems();
        setItems(fresh);
      };
      fetchItems();
    }, [])
  );

  const filtered = items.filter((i) =>
    selected === 'Starters'
      ? i.category === 'Starter'
      : selected === 'Mains'
      ? i.category === 'Main'
      : selected === 'Desserts'
      ? i.category === 'Dessert'
      : false
  );

  return (
    <ScrollView style={styles.app} contentContainerStyle={styles.centerScroll}>
      <StatusBar style="light" />
      <Text style={styles.title}>Menu</Text>

      <View style={styles.navBar}>
        {['Starters', 'Mains', 'Desserts'].map((t) => (
          <TouchableOpacity
            key={t}
            style={selected === t ? styles.navItemActive : styles.navItem}
            onPress={() => setSelected(t)}
          >
            <Text style={selected === t ? styles.navTextActive : styles.navText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 && (
        <Text style={{ color: T.muted, marginTop: 16 }}>No items in this category yet.</Text>
      )}

      {filtered.map((it, idx) => (
        <View key={idx} style={styles.card}>
          <Image source={it.image ? { uri: it.image } : logoImg} style={styles.dishImg} />
          <Text style={styles.dishTitle}>{it.name}</Text>
          <Text style={styles.dishDesc}>{it.description}</Text>
          <Text style={styles.price}>R{Number(it.price).toFixed(2)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// 👨‍🍳 Owner Screen
function OwnerScreen() {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Starter');
  const [image, setImage] = useState(null);
  const [items, setItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const loadInitialItems = async () => {
        const saved = await loadItems();
        setItems(saved);
      };
      loadInitialItems();
    }, [])
  );

  const resetForm = () => {
    setName('');
    setDesc('');
    setPrice('');
    setCategory('Starter');
    setImage(null);
    setEditingIndex(null);
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission required', 'Enable gallery access.');

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.length > 0) setImage(res.assets[0].uri);
  };

  const saveDish = async () => {
    if (!name.trim() || !desc.trim() || !price.trim()) {
      return Alert.alert('Missing fields', 'Please fill all fields.');
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return Alert.alert('Invalid price', 'Enter a valid positive number.');
    }

    const newDish = {
      name: name.trim(),
      description: desc.trim(),
      price: parsedPrice.toFixed(2),
      category,
      image: image || null,
    };

    let next;
    if (editingIndex !== null) {
      next = [...items];
      next[editingIndex] = newDish;
    } else {
      next = [...items, newDish];
    }

    setItems(next);
    await saveItems(next);
    resetForm();
    Alert.alert('Success', 'Dish saved successfully!');
  };

  const deleteDish = async (index) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    await saveItems(next);
    if (editingIndex === index) resetForm();
  };

  const startEdit = (it, idx) => {
    setName(it.name);
    setDesc(it.description);
    setPrice(it.price);
    setCategory(it.category);
    setImage(it.image);
    setEditingIndex(idx);
  };

  return (
    <ScrollView style={styles.app} contentContainerStyle={styles.centerScroll}>
      <StatusBar style="light" />
      <Text style={styles.title}>Owner</Text>
      <Text style={styles.hint}>Add, edit, or delete dishes here.</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
        ) : (
          <Text style={{ color: T.muted }}>Tap to select image</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Dish name"
        placeholderTextColor={T.muted}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        placeholder="Description"
        placeholderTextColor={T.muted}
        multiline
        value={desc}
        onChangeText={setDesc}
      />
      <TextInput
        style={styles.input}
        placeholder="Price (e.g. 45.00)"
        placeholderTextColor={T.muted}
        keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
        value={price}
        onChangeText={setPrice}
      />

      <View style={{ width: '92%', flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
        {['Starter', 'Main', 'Dessert'].map((c) => (
          <TouchableOpacity
            key={c}
            style={{ padding: 8, borderRadius: 8, backgroundColor: category === c ? T.accent : T.panel }}
            onPress={() => setCategory(c)}
          >
            <Text style={{ color: category === c ? '#000' : T.text, fontWeight: '700' }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {editingIndex !== null && (
        <TouchableOpacity
          style={[styles.bigButton, { marginTop: 18, backgroundColor: T.muted }]}
          onPress={resetForm}
        >
          <Text style={styles.bigButtonText}>Cancel Edit</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.bigButton, { marginTop: 18 }]} onPress={saveDish}>
        <Text style={styles.bigButtonText}>{editingIndex !== null ? 'Save Changes' : 'Add Dish'}</Text>
      </TouchableOpacity>

      <Text style={{ color: T.text, fontSize: 18, fontWeight: '700', marginTop: 30, marginBottom: 10 }}>
        Existing Dishes
      </Text>

      {items.length === 0 && <Text style={{ color: T.muted }}>No dishes found.</Text>}

      {items.map((it, idx) => (
        <View key={idx} style={[styles.card, { marginTop: 12 }]}>
          <Image source={it.image ? { uri: it.image } : logoImg} style={styles.dishImg} />
          <Text style={styles.dishTitle}>{it.name}</Text>
          <Text style={styles.dishDesc}>{it.description}</Text>
          <Text style={styles.price}>R{it.price}</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <TouchableOpacity style={styles.editButton} onPress={() => startEdit(it, idx)}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteDish(idx)}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

//  App
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: T.background },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Owner" component={OwnerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

//  Styles
const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: T.background },
  centerScroll: { alignItems: 'center', paddingTop: 40, paddingBottom: 60 },
  logo: { width: 120, height: 120, borderRadius: 12, marginBottom: 18 },
  title: { color: T.text, fontSize: 22, fontWeight: '700', marginBottom: 6 },
  hint: { color: T.muted, fontSize: 14, marginBottom: 14, textAlign: 'center', paddingHorizontal: 20 },
  bigButton: { width: '85%', backgroundColor: T.buttonBg, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  bigButtonText: { color: T.buttonText, fontWeight: '700' },
  navBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: T.panel, paddingVertical: 10, width: '92%', borderRadius: 12, marginTop: 18 },
  navItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  navItemActive: { backgroundColor: T.accent, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  navText: { color: T.text, fontWeight: '700' },
  navTextActive: { color: '#000', fontWeight: '800' },
  card: { width: '92%', backgroundColor: T.panel, borderRadius: 12, padding: 14, marginTop: 16 },
  dishImg: { width: '100%', height: 170, borderRadius: 10, marginBottom: 10 },
  dishTitle: { color: T.text, fontSize: 18, fontWeight: '700' },
  dishDesc: { color: T.muted, marginTop: 6, marginBottom: 8 },
  price: { color: T.accent, fontWeight: '800' },
  input: { width: '92%', backgroundColor: T.panel, color: T.text, padding: 12, borderRadius: 10, alignSelf: 'center', marginTop: 12 },
  imagePicker: { width: '92%', height: 160, backgroundColor: T.panel, borderRadius: 12, alignSelf: 'center', marginTop: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  editButton: { backgroundColor: '#4caf50', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 6 },
  deleteButton: { backgroundColor: '#f44336', padding: 8, borderRadius: 8, flex: 1, alignItems: 'center' },
});
