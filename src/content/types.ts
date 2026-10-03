import type { FactId, SkillGroupId, TownId } from './ids';

export interface Fact {
  id: FactId;
  town: TownId;
  short: string;
  long?: string;
  tags?: SkillGroupId[];
}

export interface Job {
  id: TownId;
  company: string;
  role: string;
  start: string;
  end: string | 'now';
  location: string;
  facts: FactId[];
}

export interface SkillGroup {
  id: SkillGroupId;
  label: string;
  items: string[];
  gymBadge: string;
  // the town whose gym leader reads this group
  town: TownId;
}

export interface Project {
  id: FactId;
  name: string;
  role: string;
  url: string;
  stack: string[];
}

export interface Education {
  degree: string;
  school: string;
  start: string;
  end: string;
}

export interface Profile {
  name: string;
  title: string;
  email: string;
  github: string;
  linkedin: string;
}
