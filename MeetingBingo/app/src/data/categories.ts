// src/data/categories.ts
// Three preset buzzword packs (Architecture "Buzzword Data"). No custom pack in MVP.
// Each pack holds well over 24 unique words so generateCard() can fill 24 slots
// without blanks (a ≥24-unique dev assertion is added in cardGenerator — plan L1).

import type { Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'agile',
    name: 'Agile & Scrum',
    description: 'Sprint planning, standups, and retrospectives',
    icon: '🏃',
    words: [
      'sprint', 'backlog', 'standup', 'retrospective', 'velocity',
      'blocker', 'story points', 'epic', 'user story', 'scrum master',
      'product owner', 'kanban', 'burndown', 'refinement', 'iteration',
      'acceptance criteria', 'definition of done', 'capacity', 'throughput',
      'cycle time', 'lead time', 'swimlane', 'ceremony', 'timeboxed',
      'increment', 'artifact', 'transparency', 'inspection', 'adaptation',
      'self-organizing', 'cross-functional', 'servant leader', 'impediment',
      'spike', 'technical debt', 'refactor', 'MVP', 'release', 'deployment',
      'continuous integration', 'CI/CD', 'demo', 'stakeholder', 'prioritize',
      'scope creep', 'sprint goal', 'daily scrum', 'planning poker',
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate Speak',
    description: 'Synergy, leverage, and circling back',
    icon: '💼',
    words: [
      'synergy', 'leverage', 'circle back', 'take offline', 'bandwidth',
      'low-hanging fruit', 'move the needle', 'deep dive', 'touch base',
      'action item', 'deliverable', 'stakeholder', 'alignment', 'visibility',
      'paradigm shift', 'best practice', 'value proposition', 'ROI',
      'bottom line', 'top of mind', 'streamline', 'optimize', 'scalable',
      'proactive', 'holistic', 'robust', 'ecosystem', 'pivot', 'disruption',
      'innovation', 'thought leader', 'core competency', 'mission critical',
      'game changer', 'win-win', 'net-net', 'helicopter view', 'granular',
      'drill down', 'boil the ocean', 'bleeding edge', 'north star',
      'parking lot', 'table this', 'unpack', 'double-click', 'socialize',
    ],
  },
  {
    id: 'tech',
    name: 'Tech & Engineering',
    description: 'APIs, cloud, and architecture discussions',
    icon: '💻',
    words: [
      'API', 'cloud', 'microservices', 'serverless', 'containerized',
      'kubernetes', 'docker', 'CI/CD', 'pipeline', 'deployment',
      'scalability', 'latency', 'throughput', 'database', 'schema',
      'migration', 'refactor', 'technical debt', 'architecture',
      'infrastructure', 'DevOps', 'observability', 'monitoring',
      'alerting', 'incident', 'postmortem', 'SLA', 'uptime',
      'performance', 'optimization', 'caching', 'load balancing',
      'security', 'authentication', 'authorization', 'encryption',
      'compliance', 'audit', 'code review', 'pull request', 'merge',
      'branch', 'release', 'rollback', 'feature flag', 'A/B test',
    ],
  },
];
