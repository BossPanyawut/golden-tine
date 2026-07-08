import type { AdapterAccountType } from "next-auth/adapters";
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

// Kept for Auth.js Drizzle adapter typing completeness. Not written to at
// runtime: the Credentials provider forces the "jwt" session strategy, so
// sessions live in a signed cookie, not this table.
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

export const userProgress = pgTable("user_progress", {
  userId: uuid("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  totalExp: integer("total_exp").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentHp: integer("current_hp").notNull().default(100),
  maxHp: integer("max_hp").notNull().default(100),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// --- Tasks & Projects ---

export const projectTypeEnum = pgEnum("project_type", ["work", "personal"]);
export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "review",
  "approved",
  "done",
]);
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

export const projects = pgTable("project", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: projectTypeEnum("type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  // Kanban column — only meaningful for type "work"; personal projects just
  // group tasks and ignore this.
  status: projectStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const tasks = pgTable("task", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("projectId").references(() => projects.id, {
    onDelete: "cascade",
  }),
  parentTaskId: uuid("parentTaskId").references(
    (): AnyPgColumn => tasks.id,
    { onDelete: "cascade" }
  ),
  title: text("title").notNull(),
  dueDate: date("due_date", { mode: "string" }),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const taggableTypeEnum = pgEnum("taggable_type", [
  "task",
  "vault_item",
]);

export const tags = pgTable(
  "tag",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.userId, table.name)]
);

export const taggables = pgTable(
  "taggable",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tagId: uuid("tagId")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    entityType: taggableTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
  },
  (table) => [unique().on(table.tagId, table.entityType, table.entityId)]
);

// --- Habits & Routines ---

export const habitRecurrenceEnum = pgEnum("habit_recurrence", [
  "daily",
  "weekly",
  "monthly",
]);

export const habits = pgTable("habit", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  recurrence: habitRecurrenceEnum("recurrence").notNull().default("daily"),
  // "weekly": which weekdays (0=Sun..6=Sat) it's scheduled on.
  daysOfWeek: integer("days_of_week").array(),
  // "monthly": which day of the month (1-31) it's scheduled on.
  dayOfMonth: integer("day_of_month"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const habitLogs = pgTable(
  "habit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    habitId: uuid("habitId")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Calendar day the check-in is for, as a plain date (no time/timezone).
    date: date("date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.habitId, table.date)]
);

// --- Relations (for db.query.*.findMany({ with: ... })) ---

export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  subtasks: many(tasks, { relationName: "subtasks" }),
}));

export const habitsRelations = relations(habits, ({ many }) => ({
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, { fields: [habitLogs.habitId], references: [habits.id] }),
}));

// --- Finance ---

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
]);

export const transactions = pgTable("transaction", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  // Money stored as numeric(12,2) — never float. Read/written as string via
  // drizzle to preserve exact decimal precision.
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category"),
  note: text("note"),
  date: date("date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Savings pot tied to a personal project — a target amount to fund it, plus
// the running saved total. Progress = saved / target.
export const goalFundings = pgTable("goal_funding", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("projectId").references(() => projects.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  savedAmount: numeric("saved_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const billingCycleEnum = pgEnum("billing_cycle", [
  "monthly",
  "yearly",
]);

export const subscriptions = pgTable("subscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  cycle: billingCycleEnum("cycle").notNull().default("monthly"),
  // Next date the card gets charged.
  nextBillingDate: date("next_billing_date", { mode: "string" }).notNull(),
  reminderDaysBefore: integer("reminder_days_before").notNull().default(3),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// --- Gamification ---

export const expSourceEnum = pgEnum("exp_source", ["task", "habit"]);

// Append-only ledger — every EXP award is a row. totalExp in user_progress is
// a derived cache kept in sync, but this is the source of truth.
export const expLedger = pgTable("exp_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: expSourceEnum("source").notNull(),
  amount: integer("amount").notNull(),
  // Origin row id (task or habit-log) so we never double-award and can
  // reverse an award if the action is undone.
  sourceRefId: uuid("source_ref_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const rewards = pgTable("reward", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cost: integer("cost").notNull(),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const rewardRedemptions = pgTable("reward_redemption", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rewardId: uuid("rewardId")
    .notNull()
    .references(() => rewards.id, { onDelete: "cascade" }),
  cost: integer("cost").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
