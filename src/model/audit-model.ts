export interface AuditEvent {
  type: AuditEventType;
  entityType: EntityType;
  entityId: number;
  username: string;
  timestamp?: number;
  oldValue?: any;
  newValue?: any;
}

export type AuditEventType =
  | "contact.created"
  | "contact.updated"
  | "contact.deleted"
  | "address.created"
  | "address.updated"
  | "address.deleted";

export type EntityType = "contact" | "address";

export interface ContactAuditData {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  username: string;
}

export interface AddressAuditData {
  id: number;
  street: string | null;
  city: string | null;
  province: string | null;
  country: string;
  postal_code: string;
  contact_id: number;
}

export function createContactAuditEvent(
  type: "contact.created" | "contact.updated" | "contact.deleted",
  entityId: number,
  username: string,
  oldValue?: ContactAuditData,
  newValue?: ContactAuditData
): AuditEvent {
  return {
    type,
    entityType: "contact",
    entityId,
    username,
    timestamp: Date.now(),
    oldValue,
    newValue,
  };
}

export function createAddressAuditEvent(
  type: "address.created" | "address.updated" | "address.deleted",
  entityId: number,
  username: string,
  oldValue?: AddressAuditData,
  newValue?: AddressAuditData
): AuditEvent {
  return {
    type,
    entityType: "address",
    entityId,
    username,
    timestamp: Date.now(),
    oldValue,
    newValue,
  };
}
