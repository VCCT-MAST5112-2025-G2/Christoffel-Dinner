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

const T = {  // Theme colors for the application 
  background: '#020202',
  panel: '#111',
  text: '#ffffff',
  muted: '#bdb9b0',
  accent: '#ffffff',
  buttonBg: '#f5f3f8',
  buttonText: '#000',
};

const STORAGE_KEY = '@menu_items_v1'; // this is the key used to store menu items in AsyncStorage

// to help save dishes that the owner of the app adds, ( helped by Ai)
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

// to help save dishes that the owner of the app adds, ( helped by Ai)
async function saveItems(items) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('saveItems error', e);
  }
}

// The Home Screen of the Application 
function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.app} contentContainerStyle={styles.centerScroll}>
      <StatusBar style="light" />
      <Image source={logoImg} style={styles.logo} />
      <Text style={styles.title}>Christoffel Dinner</Text>
      <Text style={styles.hint}>Welcome</Text>

      // Navigate to Menu Screen
<TouchableOpacity style={styles.bigButton} onPress={() => navigation.navigate('Menu')}>
        <Text style={styles.bigButtonText}>Menu</Text>
      </TouchableOpacity>

      // Navigate to Owner Screen
<TouchableOpacity style={styles.bigButton} onPress={() => navigation.navigate('Owner')}>
        <Text style={styles.bigButtonText}>Owner</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

//Menu screen 
function MenuScreen() {
  const [selected, setSelected] = useState('Starters');
  const [items, setItems] = useState([]);
// This is to assist in Collecting and displaying the menu items based on the selected category 
  useFocusEffect(
    useCallback(() => {
      const fetchItems = async () => {
        const fresh = await loadItems(); // Load saved dishes
        setItems(fresh);
      };
      fetchItems();
    }, [])
  );

  const filtered = items.filter((i) => // Filter items based on selected category
    selected === 'Starters'  
      ? i.category === 'Starter'
      : selected === 'Mains'
      ? i.category === 'Main'
      : selected === 'Desserts'
      ? i.category === 'Dessert'
      : false
  );

  return ( // This is the Menu screen Area ( assisted by AI)
    <ScrollView style={styles.app} contentContainerStyle={styles.centerScroll}>
      <StatusBar style="light" />
      <Text style={styles.title}>Menu</Text>

      <View style={styles.navBar}> // Navigation bar for categories 
        {['Starters', 'Mains', 'Desserts'].map((t) => (
          <TouchableOpacity
            key={t}
            style={selected === t ? styles.navItemActive : styles.navItem}
            onPress={() => setSelected(t)}
          >
            <Text style={selected === t ? styles.navTextActive : styles.navText}>{t}</Text>
          </TouchableOpacity> // End of navigation bar for categories
        ))}
      </View>

      {filtered.length === 0 && ( // No items message 
        <Text style={{ color: T.muted, marginTop: 16 }}>No items in this category yet.</Text>
      )}

      {filtered.map((it, idx) => (  // Display filtered menu items
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

//Owner Screen 
function OwnerScreen() {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Starter');
  const [image, setImage] = useState(null);
  const [items, setItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  useFocusEffect( // Load existing items when screen is focused
    useCallback(() => {
      const loadInitialItems = async () => {
        const saved = await loadItems();
        setItems(saved);
      }; 
      loadInitialItems();
    }, []) 
  );

  const resetForm = () => { // Reset form fields to initial state
    setName('');
    setDesc('');
    setPrice('');
    setCategory('Starter');
    setImage(null);
    setEditingIndex(null);
  };

  const pickImage = async () => {  // Pick image from gallery
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission required', 'Enable gallery access.');

    const res = await ImagePicker.launchImageLibraryAsync({ //Image Picker for gallery 
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.length > 0) setImage(res.assets[0].uri); // Set selected image
  };

  const saveDish = async () => {
    if (!name.trim() || !desc.trim() || !price.trim()) {
      return Alert.alert('Missing fields', 'Please fill all fields.'); // Validate form fields
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return Alert.alert('Invalid price', 'Enter a valid positive number.'); // Validate price field
    }

    const newDish = { // Create new dish object
      name: name.trim(),
      description: desc.trim(),
      price: parsedPrice.toFixed(2),
      category,
      image: image || null,
    };

    let next; // Determine if adding new or editing existing dish
    if (editingIndex !== null) {
      next = [...items];
      next[editingIndex] = newDish;
    } else {
      next = [...items, newDish];
    }

    setItems(next); // Update state with new or edited dish
    await saveItems(next);
    resetForm();
    Alert.alert('Success', 'Dish saved successfully!');
  };

  const deleteDish = async (index) => { // Delete dish at specified index
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    await saveItems(next);
    if (editingIndex === index) resetForm();
  };

  const startEdit = (it, idx) => { // Start editing a dish
    setName(it.name);
    setDesc(it.description);
    setPrice(it.price);
    setCategory(it.category);
    setImage(it.image);
    setEditingIndex(idx);
  };

  return ( // Owner screen UI
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

      <TextInput // Dish name input
        style={styles.input}
        placeholder="Dish name"
        placeholderTextColor={T.muted}
        value={name}
        onChangeText={setName}
      />
      <TextInput // Dish description input
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        placeholder="Description"
        placeholderTextColor={T.muted}
        multiline
        value={desc}
        onChangeText={setDesc}
      />
      <TextInput // Dish price input
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

      {editingIndex !== null && ( // editing cancel button
        <TouchableOpacity
          style={[styles.bigButton, { marginTop: 18, backgroundColor: T.muted }]}
          onPress={resetForm}
        >
          <Text style={styles.bigButtonText}>Cancel Edit</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.bigButton, { marginTop: 18 }]} onPress={saveDish}> // Save dish button helped by AI
        <Text style={styles.bigButtonText}>{editingIndex !== null ? 'Save Changes' : 'Add Dish'}</Text>
      </TouchableOpacity>

      <Text style={{ color: T.text, fontSize: 18, fontWeight: '700', marginTop: 30, marginBottom: 10 }}>
        Existing Dishes
      </Text>

      {items.length === 0 && <Text style={{ color: T.muted }}>No dishes found.</Text>}

      {items.map((it, idx) => (
        <View key={idx} style={[styles.card, { marginTop: 12 }]}> // Display existing dishes
          <Image source={it.image ? { uri: it.image } : logoImg} style={styles.dishImg} />
          <Text style={styles.dishTitle}>{it.name}</Text>
          <Text style={styles.dishDesc}>{it.description}</Text>
          <Text style={styles.price}>R{it.price}</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}> // Edit and Delete buttons for each dish
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

// App Component with Navigation
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

//Styles sheet 

//App styles 
const styles = StyleSheet.create({
  app: { flex: 1,
     backgroundColor: T.background }, // App background

  centerScroll: { alignItems: 'center',
     paddingTop: 40,
      paddingBottom: 60 }, //centered scroll view 

  logo: { width: 120,
     height: 120,
     borderRadius: 12,
      marginBottom: 18 }, //logo sytyle


  title: { color: T.text,
     fontSize: 22,
      fontWeight: '700',
       marginBottom: 6 }, //title style

  hint: { color: T.muted,
     fontSize: 14,
      marginBottom: 14, 
      textAlign: 'center',
       paddingHorizontal: 20 }, //hint text style

  bigButton: { width: '85%', 
    backgroundColor: T.buttonBg,
     paddingVertical: 12, 
     borderRadius: 10, 
     alignItems: 'center', 
     marginTop: 12 }, // home screen style


  bigButtonText: { color: T.buttonText,
     fontWeight: '700' }, // home screen button text style


  navBar: { flexDirection: 'row',
     justifyContent: 'space-around', 
     backgroundColor: T.panel,
      paddingVertical: 10, 
      width: '92%',
       borderRadius: 12,
        marginTop: 18 }, //menu screen nav bar style

  navItem: { paddingVertical: 8,
     paddingHorizontal: 12,
      borderRadius: 8 }, //menu screen nav item style
      
  navItemActive: { backgroundColor: T.accent,
     borderRadius: 8, 
     paddingVertical: 8,
      paddingHorizontal: 12 }, //menu screen active nav item style

  navText: { color: T.text,
     fontWeight: '700' }, //menu screen nav text style

  navTextActive: { color: '#000',
     fontWeight: '800' }, //menu screen active nav text style

  card: { width: '92%',
     backgroundColor: T.panel, 
     borderRadius: 12,
      padding: 14,
       marginTop: 16 }, //menu and owner screen card style

  dishImg: { width: '100%',
     height: 170,
      borderRadius: 10,
       marginBottom: 10 }, //dish image style 
      

  dishTitle: { color: T.text, 
    fontSize: 18, 
    fontWeight: '700' }, //dish title style

  dishDesc: { color: T.muted,
     marginTop: 6,
      marginBottom: 8 }, //dish description style

  price: { color: T.accent,
     fontWeight: '800' }, //price style
     
  input: { width: '92%',
     backgroundColor: T.panel,
      color: T.text,
       padding: 12,
        borderRadius: 10, 
        alignSelf: 'center',
         marginTop: 12 }, // input field style

  imagePicker: { width: '92%',
     height: 160,
      backgroundColor: T.panel, 
      borderRadius: 12, 
      alignSelf: 'center', 
      marginTop: 12, 
      justifyContent: 'center', 
      alignItems: 'center',
       borderWidth: 1,
        borderColor: '#222' }, //image picker style

  editButton: { backgroundColor: '#4caf50',
     padding: 8, 
     borderRadius: 8, 
     flex: 1, 
     alignItems: 'center',
      marginRight: 6 }, //edit button style
       
  deleteButton: { backgroundColor: '#f44336', 
    padding: 8, 
    borderRadius: 8,
     flex: 1,
      alignItems: 'center' }, //delete button style
});
