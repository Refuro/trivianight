export interface Question {
  q: string;
  a: string;
}

export interface Category {
  name: string;
  emoji: string;
  questions: Question[];
}

export const CATEGORIES: Category[] = [
  {
    name: "Geography",
    emoji: "🌍",
    questions: [
      { q: "What is the capital of Australia?", a: "Canberra" },
      { q: "Which is the longest river in the world?", a: "The Nile" },
      { q: "What country has the most natural lakes?", a: "Canada" },
      { q: "What is the smallest country in the world?", a: "Vatican City" },
      { q: "Which ocean is the largest?", a: "The Pacific Ocean" },
    ],
  },
  {
    name: "History",
    emoji: "📜",
    questions: [
      { q: "In what year did World War II end?", a: "1945" },
      { q: "Who was the first President of the United States?", a: "George Washington" },
      { q: "In what year did the Berlin Wall fall?", a: "1989" },
      { q: "Who discovered penicillin?", a: "Alexander Fleming" },
      { q: "What empire built the Colosseum?", a: "The Roman Empire" },
    ],
  },
  {
    name: "Science",
    emoji: "🔬",
    questions: [
      { q: "What is the chemical symbol for gold?", a: "Au" },
      { q: "How many bones are in the adult human body?", a: "206" },
      { q: "What is the most abundant gas in Earth's atmosphere?", a: "Nitrogen" },
      { q: "What planet is known as the Red Planet?", a: "Mars" },
      { q: "What is the powerhouse of the cell?", a: "The mitochondria" },
    ],
  },
  {
    name: "Sports",
    emoji: "⚽",
    questions: [
      { q: "How many players from one team are on a basketball court at a time?", a: "5" },
      { q: "In what country did the Olympic Games originate?", a: "Greece" },
      { q: "How many Grand Slam tournaments are there in tennis?", a: "4" },
      { q: "How many holes are in a standard round of golf?", a: "18" },
      { q: "What sport is played at Wimbledon?", a: "Tennis" },
    ],
  },
  {
    name: "Movies & TV",
    emoji: "🎬",
    questions: [
      { q: "Who directed Jurassic Park?", a: "Steven Spielberg" },
      { q: "Which TV show is set at the Dunder Mifflin paper company?", a: "The Office" },
      { q: "What movie features the line 'I'll be back'?", a: "The Terminator" },
      { q: "Who played Iron Man in the Marvel Cinematic Universe?", a: "Robert Downey Jr." },
      { q: "What animated film features a rat who wants to be a chef?", a: "Ratatouille" },
    ],
  },
  {
    name: "Music",
    emoji: "🎵",
    questions: [
      { q: "Which band recorded Bohemian Rhapsody?", a: "Queen" },
      { q: "Who is known as the King of Pop?", a: "Michael Jackson" },
      { q: "How many keys does a standard piano have?", a: "88" },
      { q: "In what year did The Beatles officially break up?", a: "1970" },
      { q: "What singer's real name is Stefani Joanne Angelina Germanotta?", a: "Lady Gaga" },
    ],
  },
  {
    name: "Food & Drink",
    emoji: "🍕",
    questions: [
      { q: "What country does sushi originate from?", a: "Japan" },
      { q: "What is the main ingredient in guacamole?", a: "Avocado" },
      { q: "Which city is deep dish pizza most associated with?", a: "Chicago" },
      { q: "What nut is used to make marzipan?", a: "Almonds" },
      { q: "What is the world's most consumed alcoholic drink?", a: "Beer" },
    ],
  },
  {
    name: "Pop Culture",
    emoji: "✨",
    questions: [
      { q: "Who wrote the Harry Potter series?", a: "J.K. Rowling" },
      { q: "What is the name of Thor's hammer?", a: "Mjolnir" },
      { q: "Which video game features enemies called Creepers?", a: "Minecraft" },
      { q: "What is the name of the kingdom in Frozen?", a: "Arendelle" },
      { q: "Who plays Barbie in the 2023 Barbie movie?", a: "Margot Robbie" },
    ],
  },
];
