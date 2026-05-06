declare const grist: {
    ready: (options?: { requiredAccess?: string }) => void
    onRecords: (callback: (records: unknown[]) => void) => void
    onRecord: (callback: (record: unknown) => void) => void
    getTable: (tableId: string) => unknown
}