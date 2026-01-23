// utils/pseudonym.js
function generatePseudonym() {
  const adjectives = ["Swift", "Brave", "Silent", "Clever", "Wild", "Shadow", "Mighty", "Fierce"];
  const animals = ["Tiger", "Eagle", "Wolf", "Panther", "Shark", "Falcon", "Lion", "Fox"];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj}${animal}${Math.floor(1000 + Math.random() * 9000)}`;
}

// 👇 export function correctly
module.exports = generatePseudonym;
