


export interface UserOutput {
    id: string
    discordID: string
    username: string
    displayName: string
    permissions: string[]
    roles: ('ADMIN' | 'MODERATOR' | 'PREMIUM' | 'MEMBER')[]
    createdAt: Date
    editedAt: Date
}