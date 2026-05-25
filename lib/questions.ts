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
    name: 'Minecraft',
    emoji: '⛏️',
    questions: [
      { q: 'What happens if lightning strikes a creeper?' ,a:'It becomes a charged creeper.' },
      { q:'What item lets you look directly at Endermen without angering them?' ,a: 'A pumpkin head'},
      { q: 'What armor piece stops piglins from attacking you on sight?' ,a: 'Any gold armor'},
      { q: 'What does naming a sheep jeb_ do?' ,a: 'Makes its wool cycle rainbow colors' },
      { q: 'What does a mooshroom turn into when struck by lightning?' ,a: 'The opposite type of mooshroom: red becomes brown, brown becomes red.' },
      { q: 'What food item cannot stack, unlike most foods?',a: 'Mushroom stew, rabbit stew, beetroot soup, and suspicious stew.'},
      { q: 'What block do villagers use to become clerics?', a: 'A brewing stand.'},
      { q: 'What animal scares creepers', a: 'Cats and ocelots'},
      { q: 'What was Minecraft originally called before it became “Minecraft”?' ,a: 'Cave Game' },
      { q: 'What year was the first public version of Minecraft released?' ,a: '2009' },
      { q: 'At what event was Minecraft 1.0 officially released?' ,a: 'Minecon 2011' },
      { q: 'What was MineCon later renamed/replaced by as a livestream event?' ,a: 'Minecraft Live' },
      { q: 'What potion effect cures a zombie villager when combined with a golden apple?' ,a: 'Weakness' },
      { q: 'How many music discs are there as ofs 2026' ,a: '21' },
      {q: 'Name at least 3 music discs', a: '13, cat, blocks, chirp, far, mall, mellohi, stal, strad, ward, 11, wait, Pigstep, otherside, 5, Relic, Creator, Creator (Music Box), Precipice, Tears, Lava Chicken'}
    ],
  },{
    name: 'TableTop Games',
    emoji: '🎲',
    questions: [
      //coup first
    { q: 'In Coup, How many coins does a coup cost?', a: '7'},
    { q: 'In Coup, Which two characters can block stealing?', a: 'Ambassador or Captain.'},
    { q: 'In Coup, How many copies of each character are in the base deck?', a: '3'},
    //Lovecraft letter next
    { q: 'What makes a player “Insane” in Lovecraft Letter?', a: 'Having a sanity card in their discard pile'},
    { q: 'In Lovecraft Letter, how many tokens are needed to win the overall game: sane wins vs insane wins?', a: '2 Sanity Tokens or 3 Insanity Tokens'},
    //munchkin
    { q: 'In Munchkin, Can you switch equipped items during combat?', a: 'No'},
    //diplomacy
    { q: 'How many supply centers are needed to win standard Diplomacy?', a: '18'},
    { q: 'What is the only element of chance in standard Diplomacy setup?', a: 'Which power you are assigned'},
    { q: 'In Diplomacy, after which season are builds and disbands resolved?', a: 'After Falls'},
    { q: 'In Diplomacy, how many powers are there to start?', a: '7'},
    ]
  },
  {
    name: "Geography",
    emoji: "🌍",
    questions: [
      // General
      { q: "What is the capital of Australia?", a: "Canberra" },
      { q: "Which is the longest river in the world?", a: "The Nile" },
      { q: "What country has the most natural lakes?", a: "Canada" },
      { q: "What is the smallest country in the world?", a: "Vatican City" },
      { q: "Which ocean is the largest?", a: "The Pacific Ocean" },
      // Europe
      { q: "Which river flows through Vienna, Bratislava, Budapest, and Belgrade?", a: "The Danube" },
      { q: "Liechtenstein is surrounded by only two countries. Which?", a: "Switzerland and Austria" },
      { q: "The Turkish Straits connect the Black Sea to which sea?", a: "The Mediterranean (through the Sea of Marmara and the Aegean)" },
      { q: "Which European country lies directly north of the Strait of Gibraltar?", a: "Spain" },
      { q: "The Apennine Mountains run the length of which country?", a: "Italy" },
      { q: "Which European capital is built on 14 islands connected by bridges?", a: "Stockholm" },
      { q: "Mount Elbrus, the highest peak in Europe, is located in which country?", a: "Russia" },
      { q: "Which peninsula contains Spain and Portugal but not France?", a: "The Iberian Peninsula" },
      // Asia
      { q: "Iran is the only country bordering both the Caspian Sea and which other major body of water?", a: "The Persian Gulf" },
      { q: "What is the world's largest freshwater lake by volume?", a: "Lake Baikal" },
      { q: "Diversion of the Amu Darya and Syr Darya rivers caused the collapse of which lake?", a: "The Aral Sea" },
      { q: "Which Asian capital was known as Edo until 1868?", a: "Tokyo" },
      { q: "Which Asian country has the most active volcanoes within its borders?", a: "Indonesia" },
      { q: "Which strait separates the Japanese islands of Honshu and Hokkaido?", a: "The Tsugaru Strait" },
      { q: "What is the world's largest landlocked country?", a: "Kazakhstan" },
      { q: "Name three countries the Mekong flows through.", a: "Any three of: China, Myanmar, Laos, Thailand, Cambodia, Vietnam" },
      // North America
      { q: "Which Great Lake lies entirely within the United States?", a: "Lake Michigan" },
      { q: "Great Slave Lake, the deepest in North America, is in which Canadian territory?", a: "Northwest Territories" },
      { q: "Which is the only Central American country with no Caribbean coastline?", a: "El Salvador" },
      { q: "The Mackenzie River is the longest river system found entirely within which country?", a: "Canada" },
      { q: "Denali is the highest peak in which US mountain range?", a: "The Alaska Range" },
      { q: "Which Canadian province contains both the national capital and the most populous city?", a: "Ontario" },
      { q: "What river forms part of the border between Mexico and the United States?", a: "The Rio Grande (Río Bravo del Norte)" },
      { q: "At which US city do the Mississippi and Missouri Rivers meet?", a: "St. Louis" },
    ],
  },
  {
    name: "History",
    emoji: "📜",
    questions: [
      // Easy starters
      { q: "In what year did World War II end?", a: "1945" },
      { q: "Who was the first President of the United States?", a: "George Washington" },
      { q: "In what year did the Berlin Wall fall?", a: "1989" },
      { q: "Who discovered penicillin?", a: "Alexander Fleming" },
      { q: "What empire built the Colosseum?", a: "The Roman Empire" },
      // Ancient & Classical
      { q: "Which Babylonian king is known for his stone law code?", a: "Hammurabi" },
      { q: "The Peloponnesian War was fought mainly between which two sides?", a: "Athens (Delian League) vs Sparta (Peloponnesian League)" },
      { q: "In what year did Alexander the Great die?", a: "323 BC" },
      { q: "Capital of the Byzantine Empire (same spot as Istanbul today)?", a: "Constantinople (Byzantium is fine for earlier history)" },
      { q: "What Carthaginian general famously crossed the Alps with war elephants?", a: "Hannibal" },
      // Medieval & Early Modern
      { q: "Which treaties, signed in 1648, broadly ended the Thirty Years' War in Europe?", a: "Peace of Westphalia" },
      { q: "What 1215 charter forced King John of England to accept limits on royal authority?", a: "Magna Carta" },
      { q: "Under which Byzantine emperor was Hagia Sophia finished?", a: "Justinian I (Justinian the Great)" },
      { q: "Which rival English houses fought the Wars of the Roses?", a: "Lancaster and York" },
      { q: "Which Mongol emperor's realm split after his death in 1227?", a: "Genghis Khan (Temüjin)" },
      // Nineteenth century
      { q: "In what year did the U.S. Civil War begin with Fort Sumter?", a: "1861" },
      { q: "Who commanded the allies at Waterloo (with Blücher's Prussians helping)?", a: "Arthur Wellesley, Duke of Wellington" },
      { q: "Which 1803 U.S. buy roughly doubled national territory?", a: "Louisiana Purchase" },
      { q: "The Congress of Vienna (1814-1815) put Europe back together after beating whom?", a: "Napoleon" },
      { q: "Which war forced more Chinese trade concessions after British wins in the 1800s?", a: "First Opium War (Nanking treaty and such; 'Opium Wars' passes)" },
      { q: "What German cable nudged the U.S. into WWI?", a: "Zimmermann Telegram" },
      // Twentieth century: wars & politics
      { q: "Which international organization was founded by the Treaty of Versailles in 1919?", a: "League of Nations" },
      { q: "Name the Allied 'Big Three' leaders who met at the Yalta Conference in February 1945.", a: "Joseph Stalin, Franklin D. Roosevelt, Winston Churchill" },
      { q: "Cuban Missile Crisis year?", a: "1962" },
      { q: "The UK fought Argentina over which islands in 1982?", a: "Falklands / Malvinas" },
      // Modern history
      { q: "Who became South Africa's first Black president after apartheid?", a: "Nelson Mandela" },
      { q: "The EU treaty paving the way to the euro: what year (Maastricht)?", a: "1992" },
      { q: "1884 European carve-up conference for Africa?", a: "Berlin Conference (alias Congo Conference is fine)" },
    ],
  },
  {
    name: "Science",
    emoji: "🔬",
    questions: [
      // Easy starters
      { q: "What is the chemical symbol for gold?", a: "Au" },
      { q: "How many bones are in the adult human body?", a: "206" },
      { q: "What is the most abundant gas in Earth's atmosphere?", a: "Nitrogen" },
      { q: "What planet is known as the Red Planet?", a: "Mars" },
      { q: "What is the powerhouse of the cell?", a: "The mitochondria" },
      // Chemistry
      { q: "What particle carries the strong force between quarks?", a: "Gluons" },
      { q: "Avogadro's constant, two sig figs (scientific notation)?", a: "About 6.0 x 10^23 per mole (6.022... is textbook)" },
      { q: "Which non-covalent interaction holds complementary DNA strands together?", a: "Hydrogen bonds" },
      { q: "Most natural amino acids share which chirality?", a: "L-configuration (mirror-image enantiomer stuff is fine)" },
      { q: "Ideal gas law in one equation?", a: "PV = nRT" },
      // Biology / anatomy / medicine
      { q: "Which organelle is the cell's main digestive recycler?", a: "Lysosome" },
      { q: "The citric acid cycle is nicknamed whose cycle?", a: "Krebs (TCA okay too)" },
      { q: "Mammals' oxygen-carrying blood cells?", a: "Red blood cells (erythrocytes)" },
      { q: "Your retina uses mainly which cell type at night?", a: "Rods" },
      { q: "CRISPR immunity in bacteria evolved to recognize what?", a: "Foreign DNA (from viruses/phages mostly)" },
      { q: "Which way along a DNA strand does DNA polymerase tack on bases?", a: "5′ to 3′" },
      // Physics
      { q: "What theory says gravity is curved spacetime?", a: "General relativity" },
      { q: "Entropy in SI divides energy by what?", a: "Temperature (J/K)" },
      { q: "Schrödinger's cat illustrates what before you measure?", a: "Quantum superposition" },
      { q: "Heisenberg pairs uncertain position with uncertain what?", a: "Momentum" },
      { q: "Hypothesized messenger for gravity?", a: "Graviton (still hypothetical)" },
      { q: "1919 eclipse that bent starlight and bolstered Einstein?", a: "Light bending past the Sun / gravitational lensing" },
      // Earth, space & math / computing
      { q: "Why isn't Earth's inner core liquid even though it's roasting?", a: "Huge pressure locks the iron solid" },
      { q: "The Moon keeps one face toward us. What's that called?", a: "Tidal locking" },
      { q: "Who dreamed up the abstract tape-machine computer?", a: "Alan Turing" },
      { q: "Gödel incompleteness hits systems strong enough to encode what arithmetic?", a: "Peano arithmetic / ordinary integer arithmetic" },
    ],
  },
  {
    name: "Sports",
    emoji: "⚽",
    questions: [
      // Easy starters
      { q: "How many players from one team are on a basketball court at a time?", a: "5" },
      { q: "In what country did the Olympic Games originate?", a: "Greece" },
      { q: "How many Grand Slam tournaments are there in tennis?", a: "4" },
      { q: "How many holes are in a standard round of golf?", a: "18" },
      { q: "What sport is played at Wimbledon?", a: "Tennis" },
      // Football / soccer
      { q: "What card sends an association football player off?", a: "Red card (second yellow also)" },
      { q: "Which men's national team has the most men's World Cups?", a: "Brazil (5)" },
      { q: "'The Beautiful Game' got tied to whom in marketing folklore?", a: "Pelé (o jogo bonito)" },
      { q: "Knockout still tied after regulation and extra time. What happens?", a: "Penalty shootout" },
      { q: "Offside compares an attacker to the second-last defender and what else?", a: "The ball" },
      // Tennis, golf & combat sports
      { q: "Which Slam is famously on red clay?", a: "French Open (Roland Garros)" },
      { q: "Tennis score for zero?", a: "Love" },
      { q: "One under par?", a: "Birdie" },
      { q: "Cassius Clay became?", a: "Muhammad Ali" },
      // Olympics & athletics
      { q: "Who pushed the Olympics back as a modern event?", a: "Baron Pierre de Coubertin" },
      { q: "Modern Olympics motto (Latin)?", a: "Citius, Altius, Fortius" },
      { q: "The 42-ish km marathon got locked in partly after which city's 1908 Games route?", a: "London (1908)" },
      { q: "How many parts in an Olympic men's decathlon?", a: "Ten events" },
      // US leagues and other sports
      { q: "NFL touchdown before the kick?", a: "6 points" },
      { q: "MLB best-of-seven final?", a: "World Series" },
      { q: "The NBA Finals trophy is named after whom?", a: "Larry O'Brien" },
      { q: "NHL playoff MVP trophy?", a: "Conn Smythe" },
      { q: "Late QB hit flags often get debated as what foul?", a: "Roughing the passer" },
      { q: "Curling circles on the sheet are called?", a: "House" },
      { q: "F1 team points race?", a: "Constructors' Championship" },
      { q: "Rugby XV at kickoff: how many forwards, how many backs?", a: "8 forwards, 7 backs" },
      { q: "Indoor volleyball player in a different shirt who mostly plays defense in the back row?", a: "Libero" },
    ],
  },
  {
    name: "Movies & TV",
    emoji: "🎬",
    questions: [
      // Easy starters
      { q: "Who directed Jurassic Park?", a: "Steven Spielberg" },
      { q: "Which TV show is set at the Dunder Mifflin paper company?", a: "The Office (U.S.)" },
      { q: "What movie features the line 'I'll be back'?", a: "The Terminator" },
      { q: "Who played Iron Man in the Marvel Cinematic Universe?", a: "Robert Downey Jr." },
      { q: "What animated film features a rat who wants to be a chef?", a: "Ratatouille" },
      // Auteurs & prestige film
      { q: "Who directed Parasite (Oscar BP 2020)?", a: "Bong Joon-ho" },
      { q: "The Coens directed Fargo and Lebowski. First names?", a: "Joel and Ethan Coen" },
      { q: "Who directed Eternal Sunshine of the Spotless Mind?", a: "Michel Gondry" },
      { q: "Murnau's 1922 vampire silent classic?", a: "Nosferatu" },
      { q: "Cornetto trilogy director (British)?", a: "Edgar Wright" },
      // Genre & blockbuster craft
      { q: "Which 1999 film made bullet time fights a thing?", a: "The Matrix" },
      { q: "Memento: Leonard can't form what kind of memories?", a: "New long-term memories (anterograde amnesia)" },
      { q: "'Story of Your Life': who wrote the novella filmed as Arrival?", a: "Ted Chiang" },
      // Prestige TV
      { q: "Sopranos finale diner. What's Journey playing?", a: "Don't Stop Believin'" },
      { q: "Mad Men: Sterling Cooper fraud who was really Dick Whitman?", a: "Don Draper" },
      { q: "Succession conglomerate shorthand?", a: "Waystar Royco" },
      { q: "Better Call Saul: Jimmy McGill's legal birth name?", a: "James Morgan McGill" },
      { q: "Who narrates Arrested Development?", a: "Ron Howard (himself)" },
      // Cult & comedy TV
      { q: "What tiny Ontario-ish town hosts Letterkenny?", a: "Letterkenny" },
      { q: "Community's big campus paintball arcs are mostly season?", a: "Season two" },
      { q: "Twin Peaks Red Room: backward-talking dude with the jig?", a: "The Man from Another Place (actor Michael J. Anderson)" },
      { q: "Rick rigs a box that binge-watches insane shows from infinite Earths?", a: "Interdimensional Cable" },
      { q: "Scott Pilgrim fights which evil ex first?", a: "Matthew Patel" },
      { q: "Tobias thinks he's allergic to nakedness jokes how?", a: "He's a never-nude" },
      { q: "Gus Fring fronts which chicken chain?", a: "Los Pollos Hermanos" },
      { q: "Breaking Bad guy everyone calls Gus. First name?", a: "Gustavo Fring (Gus)" },
      { q: "Honey Bunny's stickup buddy in Pulp Fiction?", a: "Pumpkin (Tim Roth; they're Ringo/Yolanda to each other)" },
      { q: "P&R: richer town Leslie loves to hate?", a: "Eagleton" },
      { q: "P&R's pony-sized festival legend?", a: "Li'l Sebastian" },
      { q: "The Bear: nickname for Carmy's beef shop?", a: "The Beef (Original Beef of Chicagoland covers it)" },
    ],
  },
  {
    name: "Music",
    emoji: "🎵",
    questions: [
      // Easy starters
      { q: "Which band recorded Bohemian Rhapsody?", a: "Queen" },
      { q: "Who is known as the King of Pop?", a: "Michael Jackson" },
      { q: "How many keys does a standard piano have?", a: "88" },
      { q: "In what year did The Beatles officially break up?", a: "1970" },
      { q: "What singer's real name is Stefani Joanne Angelina Germanotta?", a: "Lady Gaga" },
      // Rock / alt / nerd stuff
      { q: "'Smells Like Teen Spirit' kicks off what album?", a: "Nevermind" },
      { q: "'Wall of Sound' dense 1960s pop layering: who engineered it?", a: "Phil Spector" },
      { q: "My Bloody Valentine's 1991 shoegaze totem?", a: "Loveless" },
      { q: "'Creep' sits on Radiohead's debut?", a: "Pablo Honey" },
      { q: "Paul's Boutique sampled everything. Duo behind the decks?", a: "The Dust Brothers" },
      { q: "Illmatic landed what year?", a: "1994" },
      { q: "'36 Chambers': full album title slang?", a: "Enter the Wu-Tang (36 Chambers)" },
      { q: "Metal mask, rhymes Doom. Stage name?", a: "MF DOOM (Metal Face Doom; Viktor Vaughn alts okay)" },
      { q: "Kendrick's DAMN won a Pulitzer for what?", a: "Music (pop first, 2018)" },
      { q: "Björk's old Icelandic band?", a: "The Sugarcubes" },
      { q: "Aphex Twin ambient comp Vol 1 covering sketches from 85-92-ish?", a: "Selected Ambient Works 85-92" },
      { q: "Eno's ambient series starter with airport lounge vibes?", a: "Ambient 1: Music for Airports" },
      { q: "Glass marathon opera staged with Wilson about Einstein?", a: "Einstein on the Beach" },
      { q: "Coltrane's dizzying thirds workout album?", a: "Giant Steps" },
      { q: "Miles modal classic with Evans on piano?", a: "Kind of Blue (1959)" },
      { q: "Mozart Requiem: who usually gets credit for patching the end?", a: "Franz Xaver Süßmayr / Süssmayr (spell either)" },
      { q: "Kate Bush TikTok resurgence anthem from Stranger Things?", a: "Running Up That Hill (Deal With God subtitle optional)" },
      { q: "Frank Ocean leaked mixtape before Channel Orange?", a: "Nostalgia Ultra" },
      { q: "Tool album spelled Æ?", a: "Ænima" },
      { q: "Stones bassist quit in '93?", a: "Bill Wyman" },
      { q: "Fleetwood gossip-trap opus?", a: "Rumours" },
      { q: "Daft Punk farewell studio LP?", a: "Random Access Memories" },
      { q: "'In the Aeroplane Over the Sea' band?", a: "Neutral Milk Hotel" },
    ],
  },
  {
    name: "Food & Drink",
    emoji: "🍕",
    questions: [
      // Easy starters
      { q: "What country does sushi originate from?", a: "Japan" },
      { q: "What is the main ingredient in guacamole?", a: "Avocado" },
      { q: "Which city is deep dish pizza most associated with?", a: "Chicago" },
      { q: "What nut is used to make marzipan?", a: "Almonds" },
      { q: "What is the world's most consumed alcoholic drink?", a: "Beer" },
      // Cocktails / spirits / wine
      { q: "Negroni bitters third besides gin & sweet vermouth?", a: "Campari" },
      { q: "Cheap champagne trivia: bubbles from fermentation where?", a: "Second ferment in bottle" },
      { q: "Sherry aging ladder of barrels is a…?", a: "Solera" },
      { q: "Wine louse wrecked nineteenth-century vines until American roots saved Europe?", a: "Phylloxera" },
      { q: "Sherry hometown region near Jerez?", a: "Marco de Jerez triangle (fine: Jerez sherry lands)" },
      // Technique / science
      { q: "Browning meat without enzymes: reactions name?", a: "Maillard" },
      { q: "Mirepoix trio?", a: "Onion, carrot, celery" },
      { q: "Michelin stars started as marketing from which tires?", a: "Michelin" },
      { q: "Hollandaise on eggs Benny is which mother?", a: "Hollandaise" },
      { q: "Seal food in bags and dunk it low & slow?", a: "Sous vide" },
      { q: "Chickpea can juice people whip like egg whites?", a: "Aquafaba" },
      { q: "Koji fungus that breaks down rice/barley?", a: "Aspergillus oryzae" },
      { q: "Standard brewer's yeast species?", a: "Saccharomyces cerevisiae" },
      { q: "Parmigiano-Reggiano's main provinces beside Parma?", a: "Reggio Emilia and Modena (+ edge bits Bologna west / Mantova)" },
      { q: "Lime soak maize to make masa process?", a: "Nixtamalization" },
      { q: "Kimchi sours mainly because?", a: "Lactic acid bacteria" },
      { q: "Cloudy pork marrow ramen (not fried cutlet)", a: "Tonkotsu ramen" },
      { q: "Profiteroles / eclair boiled dough?", a: "Choux pastry" },
      { q: "Chocolate snap needs stable cocoa butter crystals nicknamed?", a: "Form V tempered (beta crystal talk)" },
      { q: "Chili heat numbering scale honors whom?", a: "Wilbur Scoville" },
      { q: "Fully oxidised tea westerners call?", a: "Black tea (China sometimes says red tea, same gist)" },
    ],
  },
  {
    name: "Pop Culture",
    emoji: "✨",
    questions: [
      // Easy starters
      { q: "Who wrote the Harry Potter series?", a: "J.K. Rowling" },
      { q: "What is the name of Thor's hammer?", a: "Mjolnir" },
      { q: "Which video game features enemies called Creepers?", a: "Minecraft" },
      { q: "What is the name of the kingdom in Frozen?", a: "Arendelle" },
      { q: "Who plays Barbie in the 2023 Barbie movie?", a: "Margot Robbie" },
      // Internet / memes
      { q: "Rickroll song?", a: "Rick Astley's Never Gonna Give You Up" },
      { q: "2015 viral dress fights: white-gold vs blue-black?", a: "#TheDress meme" },
      { q: "Dog in flames panel comic author?", a: "KC Green (Gunshow, 'This Is Fine')" },
      { q: "Rage comic smirk that's pure middle school?", a: "Trollface" },
      { q: "Forsen chat spam Omega emote caricatured?", a: "John 'TotalBiscuit' Bain laughing (OmegaLUL family)" },
      { q: "Ctrl+Alt+Del miscarriage melodrama summed up as meme?", a: "Loss (/ loss.jpg)" },
      { q: "Hot Ones host?", a: "Sean Evans" },
      // Games
      { q: "2018 Fortnite dance-lawsuit punching bag?", a: "Fortnite" },
      { q: "Niantic Pokémon AR summer 2016 hit?", a: "Pokémon GO" },
      { q: "Telltale's blocky morally gray Jessie pick-a-path spinoff?", a: "Minecraft: Story Mode" },
      { q: "Who made Undertale?", a: "Toby Fox" },
      { q: "Yacht Club's crowdfunded digging knight mascot?", a: "Shovel Knight" },
      // Anime-ish / metal cartoon
      { q: "Metalocalypse fake band?", a: "Dethklok" },
      { q: "JoJo meme poses traced to manga artist?", a: "Hirohiko Araki" },
      { q: "'Tank!' opens which anime?", a: "Cowboy Bebop" },
      { q: "Huge grey forest fluffball befriends Mei?", a: "Totoro" },
      { q: "Pepe the Frog's comic dad?", a: "Matt Furie" },
      { q: "2020 Twitch crewmate meme game?", a: "Among Us" },
      { q: "Gen Z punchline state for unhinged clips?", a: "Ohio" },
      { q: "TikTok sea shanty boom track January 2021?", a: "The Wellerman (Soon May the Wellerman Come)" },
    ],
  },
];
