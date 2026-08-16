export type StudentProfile = {
  name: string;
  email: string;
  picture?: string;
  school: string;
  grade: string;
  goalHours: number;
  provider: "google" | "manual";
  signedInAt: string;
};

export type Task = {
  id: string;
  title: string;
  subject: string;
  due: string;
  minutes: number;
  done: boolean;
  createdAt: string;
};

export type Topic = {
  id: string;
  title: string;
  done: boolean;
};

export type Subject = {
  id: string;
  name: string;
  color: string;
  allocatedMinutes: number;
  topics: Topic[];
};

export type Exam = {
  id: string;
  subject: string;
  date: string;
  note: string;
};

export type RoutineItem = {
  id: string;
  title: string;
  kind: "prayer" | "exercise" | "health" | "custom";
  time: string;
  doneOn: string[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "tutor";
  text: string;
};
