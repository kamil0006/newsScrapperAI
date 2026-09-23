const MESSAGES = {
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
} as const;

export function EmptyState({
  variant = "all",
  query,
}: {
  variant?: keyof typeof MESSAGES | "search";
  query?: string;
}) {
  const { title, body } =
    variant === "search"
      ? {
          title: "Brak wyników",
          body: `Nic nie pasuje do „${query}”. Spróbuj innego hasła.`,
        }
      : MESSAGES[variant];

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
      <p className="font-serif text-2xl text-text mb-2">{title}</p>
      <p className="text-text-muted max-w-[50ch]">{body}</p>
    </div>
  );
}
