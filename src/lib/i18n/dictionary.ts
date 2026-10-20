import type { Locale } from "@/lib/i18n/locale";

export type Dictionary = {
  common: { all: string; saved: string; history: string; ask: string; settings: string; logout: string };
  sidebar: { tagline: string };
  home: {
    title: string;
    titleSaved: string;
    titleHistory: string;
    subtitleDefault: string;
    subtitleHistory: string;
  };
  search: { placeholder: string };
  sourceFilter: { allSources: string };
  stats: { heading: string; newToday: string; mustRead: string; pendingClassification: string };
  topPicks: { heading: string; subtitle: (n: number) => string };
  priority: {
    tier5: { label: string; description: string };
    tier4: { label: string; description: string };
    tier3: { label: string; description: string };
    tier2: { label: string; description: string };
    tier1: { label: string; description: string };
    unclassified: { label: string; description: string };
  };
  emptyState: {
    all: { title: string; body: string };
    saved: { title: string; body: string };
    history: { title: string; body: string };
    search: { title: string; body: (query: string) => string };
  };
  article: { notClassified: string; maybeFluff: string; thread: string };
  refreshButton: { idle: string; loading: string; error: string };
  dailyBrief: { heading: string };
  catchUp: { welcomeBack: string; away: string };
  ask: {
    title: string;
    subtitle: string;
    reachHeading: string;
    reachBody: (count: number) => string;
    suggestionsHeading: string;
    inputPlaceholder: string;
    submit: string;
    searching: string;
    emptyHint: string;
    suggestions: string[];
    connectionError: string;
    genericError: string;
    focusBadge: string;
    clearFocus: string;
    focusSuggestions: string[];
  };
  thread: { back: string; heading: (count: number) => string; subtitle: string };
  categories: {
    AI: string;
    Gaming: string;
    Tech: string;
    Business: string;
    Science: string;
    Entertainment: string;
    Inne: string;
  };
  login: {
    subtitle: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    submit: string;
    submitting: string;
    invalidCredentials: string;
    noAccount: string;
    signupLink: string;
  };
  signup: {
    subtitle: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    submit: string;
    submitting: string;
    invalidEmail: string;
    passwordTooShort: string;
    passwordMismatch: string;
    emailTaken: string;
    haveAccount: string;
    loginLink: string;
  };
  settings: {
    title: string;
    subtitle: string;
    categoriesHeading: string;
  };
  categoryToast: {
    hidden: (label: string) => string;
    undo: string;
  };
  errors: {
    invalidRequest: string;
    emptyQuestion: string;
    articleNotFound: string;
    missingApiKey: string;
    askFailed: (msg: string) => string;
  };
  time: {
    justNow: string;
    minutesAgo: (n: number) => string;
    hoursAgo: (n: number) => string;
    daysAgo: (n: number) => string;
    noDate: string;
    sinceHour: string;
    sinceHours: (n: number) => string;
    sinceDay: string;
    sinceDays: (n: number) => string;
  };
  sources: { count: (n: number) => string };
  a11y: {
    save: string;
    unsave: string;
    dismiss: string;
    dismissTitle: string;
    discuss: string;
    hideCategory: string;
    hideCategoryTitle: string;
  };
};

const pl: Dictionary = {
  common: {
    all: "Wszystkie",
    saved: "Zapisane",
    history: "Historia",
    ask: "Zapytaj AI",
    settings: "Ustawienia",
    logout: "Wyloguj",
  },
  sidebar: { tagline: "Mniej scrollowania, więcej sygnału." },
  home: {
    title: "Dzisiejsze newsy",
    titleSaved: "Zapisane",
    titleHistory: "Historia",
    subtitleDefault: "Wyselekcjonowane przez AI. Posortowane wg tego, co warto przeczytać.",
    subtitleHistory: "Wszystko, co otworzyłeś — niezależnie od tego, czy zostało zapisane.",
  },
  search: { placeholder: "Szukaj po tytule…" },
  sourceFilter: { allSources: "Wszystkie źródła" },
  stats: {
    heading: "W skrócie",
    newToday: "Nowe dzisiaj",
    mustRead: "Priorytet 5, do przeczytania",
    pendingClassification: "Czeka na klasyfikację",
  },
  topPicks: {
    heading: "Najważniejsze teraz",
    subtitle: (n) => `${n} nieprzeczytanych, priorytet 4-5 — reszta poczeka`,
  },
  priority: {
    tier5: { label: "Koniecznie", description: "Przełomowe albo bardzo istotne — nie przegap." },
    tier4: { label: "Ważne", description: "Warto wiedzieć, ma realny wpływ." },
    tier3: { label: "Warto", description: "Ciekawe, ale bez pośpiechu." },
    tier2: { label: "Mało istotne", description: "Przeczytaj, jeśli zostanie Ci czas." },
    tier1: { label: "Pomijalne", description: "Można spokojnie pominąć." },
    unclassified: { label: "Bez oceny", description: "Jeszcze nie sklasyfikowane przez AI." },
  },
  emptyState: {
    all: {
      title: "Lista jest jeszcze pusta",
      body: "Baza nie ma żadnych newsów. Kliknij „Pobierz nowe newsy” w panelu bocznym.",
    },
    saved: {
      title: "Nic jeszcze nie zapisałeś",
      body: "Kliknij ikonę zakładki przy newsie, żeby wrócić do niego później.",
    },
    history: {
      title: "Historia jest pusta",
      body: "Newsy, które otworzysz, pojawią się tutaj — nawet jeśli odznaczysz je jako zapisane.",
    },
    search: {
      title: "Brak wyników",
      body: (query) => `Nic nie pasuje do „${query}”. Spróbuj innego hasła.`,
    },
  },
  article: {
    notClassified: "Jeszcze nie ocenione przez AI.",
    maybeFluff: "Może być lanie wody",
    thread: "Wątek",
  },
  refreshButton: {
    idle: "Pobierz nowe newsy",
    loading: "Pobieranie…",
    error: "Błąd — spróbuj ponownie",
  },
  dailyBrief: { heading: "Przegląd dnia" },
  catchUp: { welcomeBack: "Witaj z powrotem", away: "Nie było Cię tu" },
  ask: {
    title: "Zapytaj AI",
    subtitle:
      "Odpowiada wyłącznie na podstawie newsów, które już masz w bazie — bez wychodzenia do internetu.",
    reachHeading: "Zasięg",
    reachBody: (count) =>
      `Ostatnie 14 dni, ${count} newsów w bazie. Pytania o starsze albo spoza tematyki AI/tech/gier zostaną uczciwie odrzucone.`,
    suggestionsHeading: "Podpowiedzi",
    inputPlaceholder: "Zapytaj o newsy…",
    submit: "Zapytaj",
    searching: "Szukam w bazie…",
    emptyHint:
      "Wybierz podpowiedź obok albo napisz własne pytanie — odpowiadam tylko na podstawie newsów z Twojej bazy.",
    suggestions: [
      "Co najważniejszego wydarzyło się dziś w AI?",
      "Podsumuj najciekawsze newsy o grach z tego tygodnia",
      "Czy było coś o nowych modelach open source?",
      "Co warto przeczytać, a co mogę spokojnie pominąć?",
    ],
    connectionError: "Nie udało się połączyć z serwerem.",
    genericError: "Coś poszło nie tak.",
    focusBadge: "Rozmawiasz o:",
    clearFocus: "Wyczyść",
    focusSuggestions: [
      "Wyjaśnij to prościej",
      "Jakie są tego konsekwencje?",
      "Co w tym budzi kontrowersje?",
      "Podsumuj w 3 zdaniach",
    ],
  },
  thread: {
    back: "← Wróć do listy",
    heading: (count) => `Wątek — ${count} aktualizacje`,
    subtitle: "Ta sama rozwijająca się historia, w kolejności chronologicznej.",
  },
  categories: {
    AI: "AI",
    Gaming: "Gry",
    Tech: "Tech",
    Business: "Biznes",
    Science: "Nauka",
    Entertainment: "Rozrywka",
    Inne: "Inne",
  },
  login: {
    subtitle: "Zaloguj się, żeby zobaczyć swoje newsy.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Hasło",
    submit: "Zaloguj",
    submitting: "Logowanie…",
    invalidCredentials: "Nieprawidłowy email lub hasło",
    noAccount: "Nie masz konta?",
    signupLink: "Zarejestruj się",
  },
  signup: {
    subtitle: "Załóż konto, żeby zacząć.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Hasło (min. 8 znaków)",
    confirmPasswordPlaceholder: "Powtórz hasło",
    submit: "Zarejestruj",
    submitting: "Rejestracja…",
    invalidEmail: "Podaj poprawny adres email",
    passwordTooShort: "Hasło musi mieć min. 8 znaków",
    passwordMismatch: "Hasła nie są identyczne",
    emailTaken: "Ten email jest już zarejestrowany",
    haveAccount: "Masz już konto?",
    loginLink: "Zaloguj się",
  },
  settings: {
    title: "Ustawienia",
    subtitle: "Dopasuj apkę do siebie.",
    categoriesHeading: "Widoczne kategorie — odznacz, czego nie chcesz widzieć",
  },
  categoryToast: {
    hidden: (label) => `Ukryto kategorię „${label}”`,
    undo: "Cofnij",
  },
  errors: {
    invalidRequest: "Nieprawidłowe zapytanie",
    emptyQuestion: "Puste pytanie",
    articleNotFound: "Nie znaleziono artykułu",
    missingApiKey: "Brak OPENAI_API_KEY w .env",
    askFailed: (msg) => `Nie udało się uzyskać odpowiedzi: ${msg}`,
  },
  time: {
    justNow: "przed chwilą",
    minutesAgo: (n) => `${n} min temu`,
    hoursAgo: (n) => `${n} godz. temu`,
    daysAgo: (n) => `${n} dni temu`,
    noDate: "brak daty",
    sinceHour: "od godziny",
    sinceHours: (n) => `od ${n} godzin`,
    sinceDay: "od dnia",
    sinceDays: (n) => `od ${n} dni`,
  },
  sources: {
    count: (n) => (n >= 2 && n <= 4 ? `${n} źródła` : `${n} źródeł`),
  },
  a11y: {
    save: "Zapisz na później",
    unsave: "Usuń z zapisanych",
    dismiss: "Oznacz jako nieistotne",
    dismissTitle: "Nieistotne — obniża priorytet podobnych newsów w przyszłości",
    discuss: "Przedyskutuj w czacie",
    hideCategory: "Ukryj tę kategorię",
    hideCategoryTitle: "Ukryj tę kategorię — możesz ją z powrotem włączyć w Ustawieniach",
  },
};

const en: Dictionary = {
  common: {
    all: "All",
    saved: "Saved",
    history: "History",
    ask: "Ask AI",
    settings: "Settings",
    logout: "Log out",
  },
  sidebar: { tagline: "Less scrolling, more signal." },
  home: {
    title: "Today's news",
    titleSaved: "Saved",
    titleHistory: "History",
    subtitleDefault: "Curated by AI. Sorted by what's worth reading.",
    subtitleHistory: "Everything you've opened — whether you saved it or not.",
  },
  search: { placeholder: "Search by title…" },
  sourceFilter: { allSources: "All sources" },
  stats: {
    heading: "At a glance",
    newToday: "New today",
    mustRead: "Priority 5, unread",
    pendingClassification: "Waiting for classification",
  },
  topPicks: {
    heading: "Top picks right now",
    subtitle: (n) => `${n} unread, priority 4-5 — the rest can wait`,
  },
  priority: {
    tier5: { label: "Must read", description: "Breaking or highly important — don't miss it." },
    tier4: { label: "Important", description: "Worth knowing, has real impact." },
    tier3: { label: "Worth it", description: "Interesting, no rush." },
    tier2: { label: "Low priority", description: "Read it if you have time." },
    tier1: { label: "Skippable", description: "Safe to skip." },
    unclassified: { label: "Unrated", description: "Not classified by AI yet." },
  },
  emptyState: {
    all: {
      title: "The list is still empty",
      body: "There's nothing in the database yet. Click “Fetch new news” in the sidebar.",
    },
    saved: {
      title: "Nothing saved yet",
      body: "Click the bookmark icon on an article to come back to it later.",
    },
    history: {
      title: "History is empty",
      body: "Articles you open will show up here — even if you unmark them as saved.",
    },
    search: {
      title: "No results",
      body: (query) => `Nothing matches “${query}”. Try a different term.`,
    },
  },
  article: {
    notClassified: "Not rated by AI yet.",
    maybeFluff: "Might be fluff",
    thread: "Thread",
  },
  refreshButton: {
    idle: "Fetch new news",
    loading: "Fetching…",
    error: "Error — try again",
  },
  dailyBrief: { heading: "Daily brief" },
  catchUp: { welcomeBack: "Welcome back", away: "You've been away" },
  ask: {
    title: "Ask AI",
    subtitle: "Answers only from the news already in your database — no browsing the web.",
    reachHeading: "Reach",
    reachBody: (count) =>
      `Last 14 days, ${count} news items in the database. Questions about older news or outside AI/tech/gaming get an honest "no".`,
    suggestionsHeading: "Suggestions",
    inputPlaceholder: "Ask about the news…",
    submit: "Ask",
    searching: "Searching the database…",
    emptyHint:
      "Pick a suggestion on the side or write your own question — I only answer from the news in your database.",
    suggestions: [
      "What's the most important thing in AI today?",
      "Summarize the most interesting gaming news this week",
      "Was there anything about new open-source models?",
      "What's worth reading, and what can I safely skip?",
    ],
    connectionError: "Couldn't connect to the server.",
    genericError: "Something went wrong.",
    focusBadge: "Discussing:",
    clearFocus: "Clear",
    focusSuggestions: [
      "Explain it more simply",
      "What are the consequences?",
      "What's controversial about this?",
      "Summarize in 3 sentences",
    ],
  },
  thread: {
    back: "← Back to the list",
    heading: (count) => `Thread — ${count} updates`,
    subtitle: "The same unfolding story, in chronological order.",
  },
  categories: {
    AI: "AI",
    Gaming: "Gaming",
    Tech: "Tech",
    Business: "Business",
    Science: "Science",
    Entertainment: "Entertainment",
    Inne: "Other",
  },
  login: {
    subtitle: "Log in to see your news.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    submit: "Log in",
    submitting: "Logging in…",
    invalidCredentials: "Invalid email or password",
    noAccount: "Don't have an account?",
    signupLink: "Sign up",
  },
  signup: {
    subtitle: "Create an account to get started.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password (min. 8 characters)",
    confirmPasswordPlaceholder: "Confirm password",
    submit: "Sign up",
    submitting: "Signing up…",
    invalidEmail: "Enter a valid email address",
    passwordTooShort: "Password must be at least 8 characters",
    passwordMismatch: "Passwords don't match",
    emailTaken: "This email is already registered",
    haveAccount: "Already have an account?",
    loginLink: "Log in",
  },
  settings: {
    title: "Settings",
    subtitle: "Make the app yours.",
    categoriesHeading: "Visible categories — uncheck what you don't want to see",
  },
  categoryToast: {
    hidden: (label) => `Hid category "${label}"`,
    undo: "Undo",
  },
  errors: {
    invalidRequest: "Invalid request",
    emptyQuestion: "Empty question",
    articleNotFound: "Article not found",
    missingApiKey: "Missing OPENAI_API_KEY in .env",
    askFailed: (msg) => `Couldn't get an answer: ${msg}`,
  },
  time: {
    justNow: "just now",
    minutesAgo: (n) => `${n} min ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo: (n) => `${n}d ago`,
    noDate: "no date",
    sinceHour: "1 hour ago",
    sinceHours: (n) => `${n} hours ago`,
    sinceDay: "1 day ago",
    sinceDays: (n) => `${n} days ago`,
  },
  sources: {
    count: (n) => `${n} source${n === 1 ? "" : "s"}`,
  },
  a11y: {
    save: "Save for later",
    unsave: "Remove from saved",
    dismiss: "Mark as not interested",
    dismissTitle: "Not interested — lowers the priority of similar news going forward",
    discuss: "Discuss in chat",
    hideCategory: "Hide this category",
    hideCategoryTitle: "Hide this category — you can turn it back on in Settings",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { pl, en };
