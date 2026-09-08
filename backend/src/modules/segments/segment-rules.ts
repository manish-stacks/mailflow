/**
 * Whitelisted segment fields and operators.
 * Nothing here comes from user input except literal *values*, which are always bound parameters.
 */
export type SegmentOperator =
  | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with'
  | 'is_set' | 'is_not_set' | 'before' | 'after' | 'in_list' | 'not_in_list'
  | 'opened_campaign' | 'clicked_campaign' | 'not_opened_campaign';

export interface SegmentRule {
  field: string;
  operator: SegmentOperator;
  value?: any;
}

type FieldKind = 'string' | 'boolean' | 'date' | 'enum' | 'json' | 'relation';

export const FIELD_MAP: Record<string, { column: string; kind: FieldKind }> = {
  email: { column: 'email', kind: 'string' },
  first_name: { column: 'first_name', kind: 'string' },
  last_name: { column: 'last_name', kind: 'string' },
  phone: { column: 'phone', kind: 'string' },
  status: { column: 'status', kind: 'enum' },
  subscribed: { column: 'subscribed', kind: 'boolean' },
  source: { column: 'source', kind: 'string' },
  created_at: { column: 'created_at', kind: 'date' },
  last_engaged_at: { column: 'last_engaged_at', kind: 'date' },
  // custom_attributes.<key> is resolved dynamically against the JSON column
  list: { column: '', kind: 'relation' },
  campaign: { column: '', kind: 'relation' },
};

export const OPERATORS_BY_KIND: Record<FieldKind, SegmentOperator[]> = {
  string: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'is_set', 'is_not_set'],
  enum: ['equals', 'not_equals'],
  boolean: ['equals'],
  date: ['before', 'after'],
  json: ['equals', 'not_equals', 'contains', 'is_set', 'is_not_set'],
  relation: ['in_list', 'not_in_list', 'opened_campaign', 'clicked_campaign', 'not_opened_campaign'],
};

const SAFE_KEY = /^[a-zA-Z0-9_]{1,64}$/;

export function resolveField(field: string): { sql: string; kind: FieldKind; jsonKey?: string } | null {
  if (field.startsWith('custom_attributes.')) {
    const key = field.slice('custom_attributes.'.length);
    if (!SAFE_KEY.test(key)) return null;
    return { sql: `JSON_UNQUOTE(JSON_EXTRACT({alias}.custom_attributes, '$.${key}'))`, kind: 'json', jsonKey: key };
  }
  const meta = FIELD_MAP[field];
  if (!meta) return null;
  if (meta.kind === 'relation') return { sql: '', kind: 'relation' };
  return { sql: `{alias}.${meta.column}`, kind: meta.kind };
}
