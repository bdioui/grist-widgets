declare const grist: {
    ready: (options?: { requiredAccess?: string }) => void
    onRecords: (callback: (records: unknown[]) => void) => void
    onRecord: (callback: (record: unknown) => void) => void
    getTable: (tableId: string) => unknown
    docApi: {
        getUserInfo: () => Promise<{ name: string; email: string; picture?: string }>
        fetchTable: (tableId: string) => Promise<Record<string, unknown[]>>
        applyUserActions: (actions: unknown[]) => Promise<unknown>
    }
}