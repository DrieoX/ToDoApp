import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newDeadline, setNewDeadline] = useState(new Date());
  const [filter, setFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editCompleted, setEditCompleted] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);


  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('https://pit4.onrender.com/api/todos/');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const addTask = async () => {
    if (!newTask || !newDeadline) {
      alert('Please enter both task name and deadline.');
      return;
    }
    const task = {
      title: newTask,
      description: '',
      completed: false,
      deadline: newDeadline.toISOString(),
    };
    try {
      const response = await axios.post('https://pit4.onrender.com/api/todos/', task);
      setTasks([...tasks, response.data]);
      setNewTask('');
      setNewDeadline(new Date());
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (id) => {
    const taskToUpdate = tasks.find((t) => t.id === id);
    if (!taskToUpdate) return;
    const updatedTask = { ...taskToUpdate, completed: !taskToUpdate.completed };
    try {
      await axios.put(`https://pit4.onrender.com/api/todos/${id}/`, updatedTask);
      setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`https://pit4.onrender.com/api/todos/${id}/`);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const editTask = (task) => {
    setIsEditing(true);
    setCurrentTask(task);
    setNewTask(task.title);
    setNewDeadline(new Date(task.deadline));
    setEditCompleted(task.completed);
    setEditModalVisible(true);
  };

  const saveEditedTask = async () => {
    if (!newTask || !newDeadline) {
      alert('Please enter both task name and deadline.');
      return;
    }
    const updatedTask = {
      ...currentTask,
      title: newTask,
      deadline: newDeadline.toISOString(),
      completed: editCompleted,
    };
    try {
      await axios.put(`https://pit4.onrender.com/api/todos/${currentTask.id}/`, updatedTask);
      setTasks(tasks.map((t) => (t.id === currentTask.id ? updatedTask : t)));
      setIsEditing(false);
      setEditModalVisible(false);
      setCurrentTask(null);
      setNewTask('');
      setNewDeadline(new Date());
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    return true;
  });

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event?.type === 'dismissed' || !selectedDate) return;

    const newDate = new Date(selectedDate);
    setNewDeadline(newDate);
    if (Platform.OS === 'android') setShowTimePicker(true);
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (event?.type === 'dismissed' || !selectedTime) return;

    const newDateTime = new Date(newDeadline);
    newDateTime.setHours(selectedTime.getHours());
    newDateTime.setMinutes(selectedTime.getMinutes());
    setNewDeadline(newDateTime);
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Text style={[styles.header, darkMode && styles.darkText]}>To-Do List</Text>

      <View style={styles.switchContainer}>
        <Text style={[styles.switchLabel, darkMode && styles.darkText]}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={(val) => setDarkMode(val)} />
      </View>

      <View style={styles.inputSection}>
        <TextInput
          style={[styles.input, darkMode && styles.darkInput]}
          placeholder="Task Title"
          placeholderTextColor={darkMode ? '#ccc' : '#888'}
          value={newTask}
          onChangeText={setNewTask}
        />

        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.dateText, darkMode && styles.darkText]}>
            {newDeadline.toLocaleString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={newDeadline}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={newDeadline}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}

        <Button title="Add Task" onPress={addTask} />
      </View>

      <View style={styles.filterContainer}>
        <Button title="All" onPress={() => setFilter('all')} />
        <Button title="Completed" onPress={() => setFilter('completed')} />
        <Button title="Pending" onPress={() => setFilter('pending')} />
      </View>

      <View style={styles.helpButtonContainer}>
        <TouchableOpacity onPress={() => setHelpModalVisible(true)} style={styles.helpButton}>
        <Text style={styles.helpButtonText}>?</Text>
        </TouchableOpacity>
      </View>


      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity onPress={() => toggleTask(item.id)} style={{ flex: 1 }}>
              <Text
                style={[
                  styles.taskText,
                  item.completed && styles.completedText,
                  darkMode && styles.darkText,
                ]}
              >
                {item.title} — {new Date(item.deadline).toLocaleString()}
              </Text>
            </TouchableOpacity>
            <Button title="Edit" onPress={() => editTask(item)} />
            <Button title="Delete" onPress={() => deleteTask(item.id)} />
          </View>
        )}
      />

      {/* Help Modal */}
    <Modal visible={helpModalVisible} animationType="slide" transparent={true}>
    <View style={[styles.modalContainer, darkMode && styles.darkContainer]}>
      <View style={styles.modalContent}>
        <Text style={[styles.header, darkMode && styles.darkText]}>Help</Text>
        <Text style={[styles.helpText, darkMode && styles.darkText]}>
          • To create a task: Enter the task title and select a deadline, then press "Add Task".
        </Text>
        <Text style={[styles.helpText, darkMode && styles.darkText]}>
          • To edit a task: Press the "Edit" button next to the task.
        </Text>
        <Text style={[styles.helpText, darkMode && styles.darkText]}>
          • To delete a task: Press the "Delete" button next to the task.
        </Text>
        <Text style={[styles.helpText, darkMode && styles.darkText]}>
          • To set a deadline: Tap on the date to open the date and time picker.
        </Text>
        <Text style={[styles.helpText, darkMode && styles.darkText]}>
          • To toggle completion: Tap on the task title to mark it as completed or not.
        </Text>
        <Button title="Close" onPress={() => setHelpModalVisible(false)} />
      </View>
    </View>
  </Modal>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={[styles.modalContainer, darkMode && styles.darkContainer]}>
          <View style={styles.modalContent}>
            <Text style={[styles.header, darkMode && styles.darkText]}>Edit Task</Text>
            <TextInput
              style={[styles.input, darkMode && styles.darkInput]}
              placeholder="Task Title"
              placeholderTextColor={darkMode ? '#ccc' : '#888'}
              value={newTask}
              onChangeText={setNewTask}
            />
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.dateText, darkMode && styles.darkText]}>
                {newDeadline.toLocaleString()}
              </Text>
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, darkMode && styles.darkText]}>
                Completed
              </Text>
              <Switch value={editCompleted} onValueChange={setEditCompleted} />
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={newDeadline}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={newDeadline}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            <Button title="Save Changes" onPress={saveEditedTask} />
            <Button title="Cancel" onPress={() => setEditModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#333',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  inputSection: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    color: '#000',
  },
  darkInput: {
    backgroundColor: '#555',
    color: '#fff',
  },
  dateText: {
    fontSize: 16,
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskText: {
    fontSize: 16,
    flex: 1,
    color: '#000',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },

  helpButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  helpButton: {
    backgroundColor: '#007AFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#000',
  },
  
});
