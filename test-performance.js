// Test script to debug performance calculations
import { mockFirestore } from './client/lib/firebase-mock.js';

console.log('Testing performance calculations...');

// Get data
const animals = mockFirestore.getData().animals;
const weightRecords = mockFirestore.getData().weightRecords;

console.log('Animals:', animals.filter(a => a.category === 'male').map(a => ({
  id: a.id,
  earTagId: a.earTagId,
  category: a.category
})));

console.log('Weight Records for males:', weightRecords.filter(w => 
  animals.filter(a => a.category === 'male').some(male => male.id === w.animalId)
).map(w => ({
  animalId: w.animalId,
  weight: w.weight,
  date: w.date
})));
