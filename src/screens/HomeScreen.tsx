import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';

type User = {
  id: number;
  name: string;
  createdAt: string;
};

export default function HomeScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://10.0.2.2:8080/users')
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => setError('Error: ' + err.message));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {error ? (
        <Text>{error}</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{ margin: 10 }}>
              <Text>User: {item.name}</Text>
              <Text>Created At: {item.createdAt}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
