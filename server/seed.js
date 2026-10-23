/**
 * Demo enrichment data, keyed by username (the part of the email before "@").
 *
 * This is only applied the first time the live store is built from the CSV, to
 * make the demo interesting. About two thirds of the 35 people are pre-filled
 * (with varied completeness); the rest are intentionally left blank so you can
 * see the "incomplete profile" nudges. When you load a real HR export, these
 * people simply start empty and fill in their own profiles.
 */

const ENRICHMENT = {
  'elena.fontana': {
    whatIDo: 'I set the company vision and strategy and keep the whole team pointed in the same direction.',
    whatIDont: "I don't get involved in day-to-day feature decisions — trust the teams for that.",
    skills: 'company strategy, fundraising, leadership, vision, board relations',
    currentlyWorkingOn: 'Preparing our Series B story and the three-year company plan.',
    happyToHelp: 'Thinking through big strategic bets and company-level priorities.',
  },
  'marco.bianchi': {
    whatIDo: 'I lead the Product org and own the product roadmap and strategy.',
    whatIDont: "I don't manage engineering sprints — that's the Engineering managers.",
    skills: 'product strategy, roadmapping, prioritisation, discovery, metrics, stakeholder management',
    currentlyWorkingOn: 'Shaping the roadmap for our new analytics module.',
    happyToHelp: 'Pressure-testing a product idea or prioritisation call.',
  },
  'sofia.greco': {
    whatIDo: 'I lead Engineering across backend, frontend and platform.',
    whatIDont: "I'm not the right person for individual code reviews — ask the team leads.",
    skills: 'engineering leadership, system architecture, scaling, hiring, technical strategy',
    currentlyWorkingOn: 'Planning our platform re-architecture and the hiring plan for Q1.',
    happyToHelp: 'High-level technical trade-offs and architecture direction.',
  },
  'luca.romano': {
    whatIDo: 'I lead Design and own our design system and overall product craft.',
    whatIDont: "I don't run user research studies myself — Sara leads that.",
    skills: 'design leadership, design systems, visual design, brand, critique',
    currentlyWorkingOn: 'Refreshing the design system and our brand guidelines.',
    happyToHelp: 'Design direction, critique, and anything design-system related.',
  },
  'giulia.costa': {
    whatIDo: 'I run Operations, overseeing finance, people and internal processes.',
    whatIDont: "I don't handle individual IT tickets — that's Emanuele in IT Support.",
    skills: 'operations, finance oversight, budgeting, vendor management, planning, process design',
    currentlyWorkingOn: 'Rolling out our new quarterly planning process.',
    happyToHelp: 'Prioritising operational trade-offs and approving budgets.',
  },
  'davide.ferrari': {
    whatIDo: 'I lead Partnerships and all of our external alliances and channel deals.',
    whatIDont: "I don't set product pricing — Finance owns that.",
    skills: 'partnership strategy, business development, negotiation, stakeholder management',
    currentlyWorkingOn: 'Opening our first partnerships in the UK market.',
    happyToHelp: 'Deciding whether a partnership is worth pursuing and who should own it.',
  },
  'chiara.marino': {
    whatIDo: 'I keep the leadership team organised — planning, comms and cross-team coordination.',
    whatIDont: "I'm not the person for HR or payroll questions — talk to People Ops.",
    skills: 'program management, operations, internal communications, planning, coordination',
    currentlyWorkingOn: 'Coordinating the all-hands and the quarterly OKR process.',
    happyToHelp: 'Untangling cross-team dependencies and finding the right owner.',
  },
  'anna.rossi': {
    whatIDo: 'I own the discovery and delivery of our core product area end to end.',
    whatIDont: "I don't own pricing or billing — that sits with Finance.",
    skills: 'product management, user discovery, roadmapping, A/B testing, analytics, writing specs',
    currentlyWorkingOn: 'Launching the new onboarding flow and measuring activation.',
    happyToHelp: 'Framing a product problem, writing a spec, or setting success metrics.',
  },
  'paolo.conti': {
    skills: 'product management, integrations, API design, developer experience, documentation',
    currentlyWorkingOn: 'Building our public API and partner integration program.',
    happyToHelp: 'Questions about our API, integrations and developer-facing features.',
  },
  'francesca.galli': {
    whatIDo: 'I manage the growth product area — acquisition, activation and retention.',
    whatIDont: "I don't handle enterprise sales deals — that's the Partnerships team.",
    skills: 'growth, experimentation, funnels, retention, SEO, lifecycle marketing',
    currentlyWorkingOn: 'Running growth experiments on the signup funnel.',
    happyToHelp: 'Designing experiments and reading funnel and retention data.',
  },
  'alessandro.moretti': {
    whatIDo: 'I manage the backend/platform engineering team.',
    whatIDont: "I don't own frontend work — Giorgio's team covers that.",
    skills: 'backend, databases, APIs, system design, team leadership, performance',
    currentlyWorkingOn: 'Leading the move to event-driven services.',
    happyToHelp: 'Backend architecture, database design and service reliability.',
  },
  'giorgio.barbieri': {
    whatIDo: 'I manage the frontend, data and QA engineering team.',
    skills: 'frontend architecture, data pipelines, testing strategy, team leadership',
    currentlyWorkingOn: 'Standardising our frontend stack and test automation.',
    happyToHelp: 'Frontend architecture decisions and testing strategy.',
  },
  'simone.fabbri': {
    whatIDo: 'I build and maintain our core backend services and APIs.',
    whatIDont: "I don't do UI work — I'll point you to the frontend folks.",
    skills: 'node.js, postgresql, rest apis, microservices, caching, performance tuning',
    currentlyWorkingOn: 'Rewriting the billing service for reliability.',
    happyToHelp: 'Backend bugs, database queries and API design questions.',
  },
  'lorenzo.mariani': {
    skills: 'react, typescript, css, accessibility, component libraries',
    currentlyWorkingOn: 'Rebuilding the dashboard UI in React.',
    happyToHelp: 'Frontend bugs, React components and accessibility.',
  },
  'elisa.caruso': {
    whatIDo: 'I build complex frontend features and own our component library.',
    whatIDont: "I'm not the right person for backend or infrastructure issues.",
    skills: 'react, typescript, design systems, animation, performance, accessibility',
    currentlyWorkingOn: 'Shipping the new data-visualisation components.',
    happyToHelp: 'Tricky frontend work, animations and reusable components.',
  },
  'andrea.ferrara': {
    whatIDo: 'I keep our infrastructure and deployment pipelines healthy.',
    whatIDont: "I don't write product features — I support the teams that do.",
    skills: 'kubernetes, docker, ci/cd, aws, terraform, monitoring, deployments, security',
    currentlyWorkingOn: 'Migrating our services to Kubernetes.',
    happyToHelp: 'Debugging deployments, pipelines and infrastructure issues.',
  },
  'camilla.esposito': {
    whatIDo: 'I design end-to-end product experiences for our core flows.',
    whatIDont: "I don't run quantitative user research — Sara De Luca leads that.",
    skills: 'product design, interaction design, prototyping, figma, design systems, ux writing',
    currentlyWorkingOn: 'Designing the redesigned onboarding experience.',
    happyToHelp: 'Design feedback, prototyping and improving a confusing flow.',
  },
  'sara.deluca': {
    whatIDo: 'I plan and run user research — interviews, usability testing and surveys.',
    whatIDont: "I don't do visual or UI design — that's the product designers.",
    skills: 'user research, usability testing, interviews, surveys, synthesis, personas',
    currentlyWorkingOn: 'Running usability tests on the new onboarding flow.',
    happyToHelp: 'Designing a research plan, recruiting participants or analysing findings.',
  },
  'roberta.serra': {
    whatIDo: 'I run day-to-day operations, tooling and office logistics.',
    skills: 'operations, project coordination, tooling, procurement, logistics',
    currentlyWorkingOn: 'Consolidating our SaaS tools and vendor contracts.',
    happyToHelp: 'Getting access to a tool, vendor questions or operational blockers.',
  },
  'stefano.testa': {
    whatIDo: 'I lead People Ops — hiring, onboarding and everything employee-related.',
    whatIDont: "I don't manage the IT equipment setup — that's IT Support.",
    skills: 'recruiting, hiring, onboarding, people ops, performance reviews, culture',
    currentlyWorkingOn: 'Scaling our hiring process for the Q1 engineering roles.',
    happyToHelp: 'Hiring plans, interviews, onboarding and HR questions.',
  },
  'alice.monti': {
    whatIDo: 'I own financial planning, budgeting and forecasting for the company.',
    whatIDont: "I don't handle payroll or expense reimbursements — that's People Ops.",
    skills: 'budgeting, financial modeling, forecasting, cost analysis, spreadsheets, pricing',
    currentlyWorkingOn: 'Building the FY25 budget and the partnership cost model.',
    happyToHelp: 'Putting together budgets, business cases and ROI estimates.',
  },
  'laura.santoro': {
    whatIDo: 'I manage strategic partnerships end to end, from first contact to signed deal.',
    whatIDont: "I don't build integrations myself — I scope them with Product.",
    skills: 'partnerships, negotiation, contracts, partner onboarding, deal structuring',
    currentlyWorkingOn: 'Closing a co-marketing partnership with a fintech company.',
    happyToHelp: 'Scoping partnership opportunities and preparing deal proposals.',
  },
  'riccardo.longo': {
    skills: 'business development, lead generation, sales, market research, deal pipelines',
    currentlyWorkingOn: 'Building the outbound pipeline for new partnership leads.',
    happyToHelp: 'Qualifying new business opportunities and partnership leads.',
  },
  // Intentionally left blank for the demo (incomplete profiles):
  // matteo.ricci, valentina.rizzo, martina.gatti, federico.rinaldi,
  // giacomo.lombardi, beatrice.colombo, tommaso.bruno, nicolo.villa,
  // emanuele.gentile, silvia.marchetti, antonio.desantis, claudia.ferretti
};

module.exports = { ENRICHMENT };
