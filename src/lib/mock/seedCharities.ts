import type { Charity } from "@/types/domain";

export const seedCharities: Charity[] = [
  {
    id: "charity-1",
    name: "Green Fairways Foundation",
    description: "Supporting environmental projects through golf community initiatives.",
    longDescription: "Green Fairways Foundation focuses on reforestation and water conservation across local golf courses. We believe that the sport we love can be a force for environmental restoration.",
    featured: true,
    upcomingEvents: [
      { id: 'ev1', name: "Eco-Golf Day 2024", dateISO: "2024-06-15", location: "St. Andrews Links", description: "Join us for a day of golf and environmental awareness." }
    ]
  },
  {
    id: "charity-2",
    name: "Hope on the Course Trust",
    description: "Fundraising for education and youth programs in local communities.",
    longDescription: "Hope on the Course provides scholarships and mentorship for underprivileged youth, using golf as a medium to teach discipline and perseverance.",
    featured: true,
    upcomingEvents: [
      { id: 'ev2', name: "Youth Masters Clinic", dateISO: "2024-07-10", location: "Royal St George's", description: "Professional coaching clinic for aspiring young golfers." }
    ]
  },
  {
    id: "charity-3",
    name: "Community Swing Relief",
    description: "Helping families with emergency relief and long-term support plans.",
    longDescription: "Our relief programs provide immediate aid to families facing financial crisis, with a special focus on those in rural golf-playing districts.",
    featured: false,
  },
];

