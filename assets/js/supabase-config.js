// =============================================
// SUPABASE CONFIGURATION
// =============================================
const SUPABASE_URL = "https://cqjeoslchevewbufpyzv.supabase.co";
const SUPABASE_KEY = "sb_publishable_PhMKOO9MpDZQIf5c624tiQ_AJPguAHp";

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================
// CONSTANTS AND CONFIGURATION
// =============================================
const DAYS_ACTIVE = 3;
const INACTIVE_THRESHOLD = 15;
const HIGH_RISK_MAX_DAYS = 15;
const RECENT_INACTIVE_MIN_DAYS = 3;
const RECENT_INACTIVE_MAX_DAYS = 5;
const PLAYERS_PER_PAGE = 50;
const AUTH_PIN = "8152";

// Page data with emojis - UPDATED WITH PROPER CASE NAMES
const PAGES = [
  { name: "Juwa Slots", emoji: "🎰" },
  { name: "Jackpot Casino", emoji: "💰" },
  { name: "Milk+T", emoji: "🥛" },
  { name: "Spin Royale", emoji: "👑" },
  { name: "Milky Treasure", emoji: "💎" },
  { name: "Legit Spin Casino", emoji: "♠️" },
  { name: "Wealth Casino", emoji: "💵" },
  { name: "Cash Vault", emoji: "🏦" },
  { name: "Game Vault Slots", emoji: "🎮" },
  { name: "Lucky Firekirin", emoji: "🐲" },
  { name: "Payout Day", emoji: "📅" },
  { name: "Ultra Panda", emoji: "🐼" },
  { name: "Dragons Destiny", emoji: "🐉" },
  { name: "Orion Star", emoji: "⭐" },
  { name: "Daily Freebies", emoji: "🎁" },
  { name: "Fortune Valley", emoji: "🏞️" },
  { name: "Grill Girl", emoji: "👧" },
  { name: "Earners Pick", emoji: "📌" },
  { name: "Juwa 2.0", emoji: "🎰" },
  { name: "Panda Master", emoji: "🐼" },
  { name: "Casino Royal", emoji: "♣️" },
  { name: "Diamond Riches", emoji: "💎" },
  { name: "Cash Machine", emoji: "🏧" },
  { name: "Win Star", emoji: "🌟" },
  { name: "Fire Kirin", emoji: "🔥" },
  { name: "Ruby Riches", emoji: "❤️" },
  { name: "Vegas Sweeps", emoji: "🎲" },
  { name: "Secret Spins", emoji: "🕵️" },
  { name: "Mega Money Machine", emoji: "💸" },
  { name: "Mystery Millions", emoji: "❓" },
  { name: "Mafia City", emoji: "🕶️" },
  { name: "VBlink", emoji: "🔗" },
  { name: "Lucky Lady", emoji: "🍀" },
  { name: "King of Pop", emoji: "👑" },
  { name: "Golden Treasure", emoji: "🏆" },
  { name: "River Sweeps", emoji: "🌊" },
  { name: "Game Room", emoji: "🎪" },
  { name: "Oyshee", emoji: "👻" },
  { name: "Moolah", emoji: "💲" },
  { name: "Mega Spin", emoji: "🌀" },
  { name: "Lucky Vegas Slots", emoji: "🎰" },
  { name: "Yolo Slots", emoji: "🔥" },
  { name: "Juwa", emoji: "🎯" },
  { name: "River Monster", emoji: "🐊" },
  { name: "E-Games", emoji: "🎮" },
  { name: "Big Winner", emoji: "🏆" }
];

// Page name normalization mapping
const PAGE_NAME_MAP = {
  "juwa slots": "Juwa Slots",
  "jackpot casino": "Jackpot Casino", 
  "milk+t": "Milk+T",
  "milk + t": "Milk+T",
  "spin royale": "Spin Royale",
  "milky treasure": "Milky Treasure",
  "legit spin casino": "Legit Spin Casino",
  "wealth casino": "Wealth Casino",
  "cash vault": "Cash Vault",
  "game vault slots": "Game Vault Slots",
  "lucky firekirin": "Lucky Firekirin",
  "payout day": "Payout Day",
  "ultra panda": "Ultra Panda",
  "dragons destiny": "Dragons Destiny",
  "orion star": "Orion Star",
  "daily freebies": "Daily Freebies",
  "fortune valley": "Fortune Valley",
  "grill girl": "Grill Girl",
  "earners pick": "Earners Pick",
  "juwa 2.0": "Juwa 2.0",
  "panda master": "Panda Master",
  "casino royal": "Casino Royal",
  "diamond riches": "Diamond Riches",
  "cash machine": "Cash Machine",
  "win star": "Win Star",
  "fire kirin": "Fire Kirin",
  "ruby riches": "Ruby Riches",
  "vegas sweeps": "Vegas Sweeps",
  "secret spins": "Secret Spins",
  "mega money machine": "Mega Money Machine",
  "mystery millions": "Mystery Millions",
  "mafia city": "Mafia City",
  "vblink": "VBlink",
  "lucky lady": "Lucky Lady",
  "king of pop": "King of Pop",
  "golden treasure": "Golden Treasure",
  "river sweeps": "River Sweeps",
  "game room": "Game Room",
  "oyshee": "Oyshee",
  "moolah": "Moolah",
  "mega spin": "Mega Spin",
  "lucky vegas slots": "Lucky Vegas Slots",
  "yolo slots": "Yolo Slots",
  "juwa": "Juwa",
  "river monster": "River Monster",
  "e-games": "E-Games",
  "e games": "E-Games",
  "egames": "E-Games",
  "big winner": "Big Winner"
};

// Global state
let selectedPage = null;
let currentPageData = null;
let currentPageObj = null;

// Table state
const tableState = {
    current: {
        type: null,
        page: 1,
        data: null,
        title: null
    },
    playerTables: {
        'Total': { page: 1, data: null },
        'Active': { page: 1, data: null },
        'Inactive': { page: 1, data: null },
        'RecentActive': { page: 1, data: null },
        'RecentInactive': { page: 1, data: null }
    },
    highRisk: { page: 1, data: null },
    history: { page: 1, data: null },
    deposits: { month: 0, data: null }
};

// Notes state
let currentNotesPlayer = null;
let currentNotesPlayerName = null;
let currentNotesButton = null;
