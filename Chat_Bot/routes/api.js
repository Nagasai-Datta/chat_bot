const express = require('express');
const router = express.Router();
const natural = require('natural');
const fs = require('fs');
const path = require('path');

// Load questions data
let questionsData = {};
try {
  const dataPath = path.join(__dirname, '../data/questions.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  questionsData = JSON.parse(rawData);
  console.log('Questions data loaded successfully');
} catch (error) {
  console.error('Error loading questions data:', error);
  // Fallback data in case of file loading issues
  questionsData = {
    questions: [
      {
        question: "What is the process for obtaining a bonafide certificate?",
        answer: "To obtain a bonafide certificate, log in to the VTOP portal, navigate to the 'Student Services' section, and request the certificate. It can be collected from the academic office after processing."
      }
    ],
    greetings: [
      {
        input: "hi",
        response: "Hello! How can I assist you today?"
      }
    ]
  };
}

// Initialize tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Preprocess questions for better matching
const preprocessQuestions = () => {
  if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
    console.error('Questions data is not in expected format');
    return [];
  }
  
  return questionsData.questions.map(q => {
    const tokens = tokenizer.tokenize(q.question.toLowerCase());
    const stems = tokens.map(token => stemmer.stem(token));
    return {
      original: q.question,
      answer: q.answer,
      tokens: stems
    };
  });
};

const processedQuestions = preprocessQuestions();

// Preprocess greetings
const preprocessGreetings = () => {
  if (!questionsData.greetings || !Array.isArray(questionsData.greetings)) {
    console.error('Greetings data is not in expected format');
    return [];
  }
  
  return questionsData.greetings.map(g => {
    const tokens = tokenizer.tokenize(g.input.toLowerCase());
    const stems = tokens.map(token => stemmer.stem(token));
    return {
      input: g.input,
      response: g.response,
      tokens: stems
    };
  });
};

const processedGreetings = preprocessGreetings();

// Calculate similarity between two sets of tokens
const calculateSimilarity = (tokens1, tokens2) => {
  if (!tokens1.length || !tokens2.length) return 0;
  
  const intersection = tokens1.filter(token => tokens2.includes(token));
  return intersection.length / Math.max(tokens1.length, tokens2.length);
};

// Find best match for user input
const findBestMatch = (userInput) => {
  const userTokens = tokenizer.tokenize(userInput.toLowerCase());
  const userStems = userTokens.map(token => stemmer.stem(token));
  
  // Check greetings first
  for (let greeting of processedGreetings) {
    const similarity = calculateSimilarity(userStems, greeting.tokens);
    if (similarity > 0.7) {
      return { type: 'greeting', response: greeting.response, similarity };
    }
  }
  
  // Check questions
  let bestMatch = null;
  let highestSimilarity = 0;
  
  for (let question of processedQuestions) {
    const similarity = calculateSimilarity(userStems, question.tokens);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = question;
    }
  }
  
  if (highestSimilarity > 0.4 && bestMatch) { // Threshold for matching
    return { type: 'question', response: bestMatch.answer, similarity: highestSimilarity };
  }
  
  return { type: 'unknown', response: "Sorry, I don't understand that. Could you please rephrase?", similarity: 0 };
};

// API endpoint for chatbot
router.post('/chat', (req, res) => {
  const userMessage = req.body.message;
  
  if (!userMessage || userMessage.trim() === '') {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const response = findBestMatch(userMessage);
  res.json({
    message: response.response,
    type: response.type,
    confidence: response.similarity
  });
});

module.exports = router;