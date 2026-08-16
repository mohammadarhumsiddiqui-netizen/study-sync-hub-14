import { STORAGE_KEYS, readStored, todayKey, uid, writeStored } from "./storage";
import type { Exam, RoutineItem, Subject, Task } from "./types";

/** Give a brand-new student a useful starting workspace (runs once). */
export function seedIfEmpty() {
  if (readStored<Task[]>(STORAGE_KEYS.tasks, []).length === 0) {
    const tasks: Task[] = [
      { id: uid(), title: "Physics worksheet — kinematics", subject: "Physics", due: todayKey(), minutes: 40, done: false, createdAt: todayKey() },
      { id: uid(), title: "Read Chemistry Ch. 4", subject: "Chemistry", due: todayKey(), minutes: 30, done: false, createdAt: todayKey() },
      { id: uid(), title: "Maths past paper Q1–Q10", subject: "Maths", due: todayKey(), minutes: 45, done: true, createdAt: todayKey() },
    ];
    writeStored(STORAGE_KEYS.tasks, tasks);
  }

  if (readStored<Subject[]>(STORAGE_KEYS.subjects, []).length === 0) {
    const subjects: Subject[] = [
      {
        id: uid(),
        name: "Physics",
        color: "#6ce0ff",
        allocatedMinutes: 300,
        topics: [
          { id: uid(), title: "Motion & kinematics", done: true },
          { id: uid(), title: "Newton's laws", done: true },
          { id: uid(), title: "Work, energy & power", done: false },
          { id: uid(), title: "Waves", done: false },
        ],
      },
      {
        id: uid(),
        name: "Maths",
        color: "#2f7bff",
        allocatedMinutes: 420,
        topics: [
          { id: uid(), title: "Quadratic equations", done: true },
          { id: uid(), title: "Trigonometry", done: false },
          { id: uid(), title: "Differentiation", done: false },
        ],
      },
    ];
    writeStored(STORAGE_KEYS.subjects, subjects);
  }

  if (readStored<Exam[]>(STORAGE_KEYS.exams, []).length === 0) {
    const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
    const exams: Exam[] = [
      { id: uid(), subject: "Physics", date: inDays(6), note: "Unit 1 + 2, calculator allowed" },
      { id: uid(), subject: "Maths", date: inDays(12), note: "Full syllabus mock" },
    ];
    writeStored(STORAGE_KEYS.exams, exams);
  }

  if (readStored<RoutineItem[]>(STORAGE_KEYS.routine, []).length === 0) {
    const routine: RoutineItem[] = [
      { id: uid(), title: "Fajr prayer", kind: "prayer", time: "05:10", doneOn: [] },
      { id: uid(), title: "Dhuhr prayer", kind: "prayer", time: "13:15", doneOn: [] },
      { id: uid(), title: "Asr prayer", kind: "prayer", time: "16:45", doneOn: [] },
      { id: uid(), title: "Maghrib prayer", kind: "prayer", time: "19:05", doneOn: [] },
      { id: uid(), title: "Isha prayer", kind: "prayer", time: "20:30", doneOn: [] },
      { id: uid(), title: "30 push-ups challenge", kind: "exercise", time: "07:00", doneOn: [] },
      { id: uid(), title: "Drink 2L water", kind: "health", time: "12:00", doneOn: [] },
      { id: uid(), title: "Sleep by 11 PM", kind: "health", time: "23:00", doneOn: [] },
    ];
    writeStored(STORAGE_KEYS.routine, routine);
  }
}
