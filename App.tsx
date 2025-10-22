import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Button,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();
const logoImg = require('./assets/67.jpg');

// --- Home Screen ---
function HomeScreen({ navigation }) {
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
function MenuScreen({ menuItems }) { // AI-assisted: menuItems passed as prop from App
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

// --- Owner Screen ---
function OwnerScreen({ menuItems, setMenuItems }) { // AI-assisted: receive shared state from App
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
    // AI-assisted: added dish to shared menuItems state so MenuScreen updates automatically
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
  // AI-assisted: added shared state to pass menu items between Owner and Menu screens
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
          {props => <MenuScreen {...props} menuItems={menuItems} />} {/*this was ai-assisted */}
        </Stack.Screen>
        <Stack.Screen name="Owner">
          {props => <OwnerScreen {...props} menuItems={menuItems} setMenuItems={setMenuItems} />} {/* AI-assisted */}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#020202',
    paddingTop: 60,
    alignItems: 'center',
    paddingBottom: 60,
  },
  text: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  Sub: {
    color: '#f5f3f8',
    fontSize: 16,
    textAlign: 'center',
    margin: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#f5f3f8ff',
    padding: 10,
    borderRadius: 5,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111',
    paddingVertical: 10,
    width: '90%',
    borderRadius: 10,
    marginTop: 20,
  },
  NavButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  NavButtonActive: {
    backgroundColor: '#f5f3f8',
  },
  NavButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  NavButtonTextActive: {
    color: '#000',
  },
  input: {
    width: '85%',
    backgroundColor: '#111',
    color: '#fff',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  imagePicker: {
    width: 250,
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  previewImage: {
    width: 250,
    height: 150,
    borderRadius: 10,
  },
});
