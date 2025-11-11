import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {StyleSheet,Text,View,TouchableOpacity,Button,TextInput,Image,ScrollView,} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();
const logoImg = require('./assets/67.jpg');

// --- Home Screen ---
function HomeScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.container}>
      <Image
        source={logoImg}
        style={{ width: 120, height: 120, borderRadius: 10, marginBottom: 20 }}
      />
      <Text style={styles.text}>Welcome to the Christoffel Dinner App!</Text>

      <View style={styles.button}>
        <Button title="View Menu" color="#000000" onPress={() => navigation.navigate('Menu')} />
      </View>

      <View style={styles.button}>
        <Button title="Owner" color="#000000" onPress={() => navigation.navigate('Owner')} />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

// --- Menu Screen ---
function MenuScreen({ menuItems }) {
  const [selectedTab, setSelectedTab] = useState('Starters');

  // Filter items by selected tab
  const filteredItems = menuItems.filter(item => {
    if (selectedTab === 'Starters') return item.category === 'Starter';
    if (selectedTab === 'Mains') return item.category === 'Main';
    if (selectedTab === 'Desserts') return item.category === 'Dessert';
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.navBar}>
        {['Starters', 'Mains', 'Desserts'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.NavButton, selectedTab === tab && styles.NavButtonActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.NavButtonText, selectedTab === tab && styles.NavButtonTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}>
        {filteredItems.length === 0 && <Text style={styles.Sub}>No items in this category yet</Text>}
        {filteredItems.map((item, index) => (
          <View key={index} style={{ marginBottom: 25, alignItems: 'center' }}>
            {item.image && (
              <Image
                source={{ uri: item.image }}
                style={{ width: 280, height: 180, borderRadius: 15, marginBottom: 10 }}
              />
            )}
            <Text style={styles.Sub}>{item.name}</Text>
            <Text style={styles.Sub}>{item.description}</Text>
            <Text style={styles.Sub}>R{item.price}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// --- Owner Screen  This was helped by AI
function OwnerScreen({ menuItems, setMenuItems }) {
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Starter');
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Permission is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const addDish = () => {
    if (!dishName || !description || !price) {
      alert('Please fill all fields');
      return;
    }
    const newDish = { name: dishName, description, price, category, image };
    setMenuItems([...menuItems, newDish]);
    alert('Dish added!');
    setDishName('');
    setDescription('');
    setPrice('');
    setImage(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.text}>Owner Page</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <Text style={styles.Sub}>Tap to select image</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Dish Name"
        placeholderTextColor="#aaa"
        value={dishName}
        onChangeText={setDishName}
      />

      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Description"
        placeholderTextColor="#aaa"
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <TextInput
        style={styles.input}
        placeholder="Price"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <View style={styles.navBar}>
        {['Starter', 'Main', 'Dessert'].map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.NavButton, category === type && styles.NavButtonActive]}
            onPress={() => setCategory(type)}
          >
            <Text style={[styles.NavButtonText, category === type && styles.NavButtonTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.button}>
        <Button title="Add Dish" color="#000000" onPress={addDish} />
      </View>
    </ScrollView>
  );
}

// --- Main App ---
export default function App() {
  const [menuItems, setMenuItems] = useState([]); // shared state

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#020202' },
          headerTintColor: '#fff',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Menu">
          {props => <MenuScreen {...props} menuItems={menuItems} />}
        </Stack.Screen>
        <Stack.Screen name="Owner">
          {props => <OwnerScreen {...props} menuItems={menuItems} setMenuItems={setMenuItems} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: T.background },
  centerScroll: { alignItems: 'center', paddingTop: 40, paddingBottom: 60 },
  logo: { width: 120, height: 120, borderRadius: 12, marginBottom: 18 },
  title: { color: T.text, fontSize: 22, fontWeight: '700', marginBottom: 6 },
  hint: {
    color: T.muted,
    fontSize: 14,
    marginBottom: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bigButton: {
    width: '85%',
    backgroundColor: T.buttonBg,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  bigButtonText: { color: T.buttonText, fontWeight: '700' },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: T.panel,
    paddingVertical: 10,
    width: '92%',
    borderRadius: 12,
    marginTop: 18,
  },
  navItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  navItemActive: {
    backgroundColor: T.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navText: { color: T.text, fontWeight: '700' },
  navTextActive: { color: '#000', fontWeight: '800' },
  card: {
    width: '92%',
    backgroundColor: T.panel,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  dishImg: { width: '100%', height: 170, borderRadius: 10, marginBottom: 10 },
  dishTitle: { color: T.text, fontSize: 18, fontWeight: '700' },
  dishDesc: { color: T.muted, marginTop: 6, marginBottom: 8 },
  price: { color: T.accent, fontWeight: '800' },
  input: {
    width: '92%',
    backgroundColor: T.panel,
    color: T.text,
    padding: 12,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 12,
  },
  imagePicker: {
    width: '92%',
    height: 160,
    backgroundColor: T.panel,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
});