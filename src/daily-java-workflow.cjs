const JAVA_TOPIC_IDEAS = [
  "How Java HashMap handles collisions",
  "Why equals() and hashCode() must agree",
  "ArrayList vs LinkedList: when to use each",
  "How ConcurrentHashMap stays thread-safe",
  "Stack vs heap in the Java JVM",
  "What garbage collection actually does",
  "Java String pool explained",
  "Why immutable objects are useful",
  "Why Java streams can be lazy",
  "When to use Optional in Java",
  "Checked vs unchecked exceptions",
  "How try-with-resources works",
  "Race conditions in Java",
  "synchronized vs volatile",
  "ExecutorService and thread pools",
  "CompletableFuture in simple terms",
  "Java interface default methods",
  "Type erasure and Java generics",
  "== vs equals() for Java objects",
  "Fail-fast iterators explained",
  "When HashMap buckets become trees",
  "How ArrayList grows its backing array",
  "Java class loaders explained",
  "Java records: concise data carriers",
  "Sealed classes and permitted subtypes",
  "The difference between final and effectively final",
  "How Java enums can hold behavior",
  "Why BigDecimal is safer for money",
  "Java synchronized blocks vs methods",
  "What happens when a Java program starts",
];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function topicIndexForDate(dateKey = localDateKey()) {
  const start = new Date(2024, 0, 1);
  const current = new Date(`${dateKey}T12:00:00`);
  const days = Math.floor((current.getTime() - start.getTime()) / 86_400_000);
  return ((days % JAVA_TOPIC_IDEAS.length) + JAVA_TOPIC_IDEAS.length) % JAVA_TOPIC_IDEAS.length;
}

function dateOffset(dateKey, offset) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
}

function calculateStreak(completedDates, today = localDateKey()) {
  const completed = new Set(completedDates);
  let date = completed.has(today) ? today : dateOffset(today, -1);
  let streak = 0;
  while (completed.has(date)) {
    streak += 1;
    date = dateOffset(date, -1);
  }
  return streak;
}

function formatShortDate(dateKey) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${dateKey}T12:00:00`));
}

module.exports = {
  JAVA_TOPIC_IDEAS,
  calculateStreak,
  dateOffset,
  formatShortDate,
  localDateKey,
  topicIndexForDate,
};
