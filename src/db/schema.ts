import {
  pgTable,
  uuid,
  text,
  integer,
  doublePrecision,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

/**
 * A single audited artifact: a campus poster or a UI screenshot that was
 * submitted to the accessibility-auditing pipeline.
 */
export const audits = pgTable(
  "audits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    kind: text("kind").notNull(), // 'poster' | 'ui_screenshot'
    // Public path (seeded samples) or null when bytes are stored inline.
    imagePath: text("image_path"),
    // Base64-encoded image bytes for uploaded artifacts.
    imageData: text("image_data"),
    mime: text("mime").notNull().default("image/jpeg"),
    width: integer("width"),
    height: integer("height"),
    // Which analyzer produced the model findings: 'qwen-vl' | 'heuristic' | 'seeded-demo'
    analyzer: text("analyzer").notNull().default("heuristic"),
    // Measured low-level image statistics used as audit evidence.
    stats: jsonb("stats"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("audits_created_at_idx").on(t.createdAt)],
);

/**
 * One candidate accessibility finding produced by the VLM / heuristic engine
 * (source = 'model') or a missed issue reported by a human reviewer
 * (source = 'human', i.e. a false negative used for recall evaluation).
 */
export const findings = pgTable(
  "findings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    source: text("source").notNull().default("model"), // 'model' | 'human'
    category: text("category").notNull(), // see CATEGORY_LABELS in lib/analysis
    severity: text("severity").notNull().default("major"), // 'critical' | 'major' | 'minor'
    title: text("title").notNull(),
    explanation: text("explanation").notNull(),
    suggestion: text("suggestion").notNull(),
    wcag: text("wcag"), // e.g. '1.4.3 Contrast (Minimum)'
    // Model self-reported / engine-derived confidence, 0..1.
    confidence: doublePrecision("confidence"),
    // Normalized bounding box on the audited image (0..1 fractions).
    bboxX: doublePrecision("bbox_x"),
    bboxY: doublePrecision("bbox_y"),
    bboxW: doublePrecision("bbox_w"),
    bboxH: doublePrecision("bbox_h"),
    // Human verification state: 'pending' | 'confirmed' | 'rejected' | 'uncertain'
    status: text("status").notNull().default("pending"),
    verifiedBy: text("verified_by"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("findings_audit_idx").on(t.auditId),
    index("findings_status_idx").on(t.status),
  ],
);

export type Audit = typeof audits.$inferSelect;
export type NewAudit = typeof audits.$inferInsert;
export type Finding = typeof findings.$inferSelect;
export type NewFinding = typeof findings.$inferInsert;
