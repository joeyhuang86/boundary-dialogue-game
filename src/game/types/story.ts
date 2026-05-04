export type StatKey =
  | "clarity"
  | "pressure"
  | "boundary"
  | "linDependency"
  | "xuAmbiguity"
  | "heControl"
  | "chenTrust";

export type Stats = Record<StatKey, number>;

export type Effect = Partial<Record<StatKey, number>>;

export type DialogueLine = {
  speaker: "程墨" | "陈婷" | "贺骁" | "林叙" | "许晚" | "旁白";
  text: string;
  mood?: "cold" | "tired" | "sharp" | "soft" | "message" | "inner";
};

export type Condition = {
  stat: StatKey;
  min?: number;
  max?: number;
};

export type Choice = {
  id: string;
  text: string;
  next: string;
  effects: Effect;
  hint: string;
  condition?: Condition;
  skill?: "deepBreath";
  insight?: string;
};

export type StoryNode = {
  id: string;
  title: string;
  scene: string;
  lines: DialogueLine[];
  choices?: Choice[];
  ending?: string;
  finalResult?: {
    title: string;
    comment: string;
  };
};
