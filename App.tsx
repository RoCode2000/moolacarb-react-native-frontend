import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import axios from 'axios';

type User = {
  id: number;
  name: string;
  createdAt: string;
};

const App = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get<User[]>('http://10.0.2.2:8080/users')
      .then(res => setUsers(res.data))
      .catch(err => setError('Error: ' + err.message));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {error ? (
        <Text>{error}</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id.toString()}
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
};

export default App;
