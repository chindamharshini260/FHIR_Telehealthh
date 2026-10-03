export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
};

export const patients: Patient[] = [
  {
    id: "patient-001",
    name: "Demo Patient",
    age: 45,
    gender: "Female",
  },
  {
    id: "patient-002",
    name: "Rahul Kumar",
    age: 52,
    gender: "Male",
  },
  {
    id: "patient-003",
    name: "Ananya Reddy",
    age: 38,
    gender: "Female",
  },
];