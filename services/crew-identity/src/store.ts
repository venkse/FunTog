import type { CrewProfile, MemberRef } from "@funtog/contracts";

/** The durable root entity, partitioned by crewId. In-memory here; a crew-partitioned store slots in
 *  behind this same shape. Membership writes are idempotent — re-taps of a link never duplicate. */
export class CrewStore {
  private crews = new Map<string, CrewProfile>();

  create(crewId: string, name?: string): CrewProfile {
    let c = this.crews.get(crewId);
    if (!c) { c = { crewId, name, members: [] }; this.crews.set(crewId, c); }
    return c;
  }
  get(crewId: string): CrewProfile | undefined { return this.crews.get(crewId); }

  addMember(crewId: string, m: MemberRef): MemberRef {
    const c = this.create(crewId);
    if (!c.members.some((x) => x.memberId === m.memberId)) c.members.push(m); // idempotent by memberId
    return m;
  }
  get size(): number { return this.crews.size; }
}
