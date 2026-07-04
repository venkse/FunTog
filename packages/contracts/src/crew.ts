export interface MemberRef { memberId: string; displayName: string; }
export interface CrewProfile { crewId: string; name?: string; members: MemberRef[]; }
