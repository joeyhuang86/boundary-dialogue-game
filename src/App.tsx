import { Heart, List, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { chapter01, initialStats, statLabels } from "./game/data/chapter01";
import { chapter02 } from "./game/data/chapter02";
import { chapter03 } from "./game/data/chapter03";
import { chapter04 } from "./game/data/chapter04";
import { chapter05 } from "./game/data/chapter05";
import { chapter06 } from "./game/data/chapter06";
import type { Choice, DialogueLine, Effect, StatKey, Stats, StoryNode } from "./game/types/story";

const mainStats: StatKey[] = ["clarity", "pressure", "boundary"];
const hiddenStats: StatKey[] = ["chenTrust", "heControl", "linDependency", "xuAmbiguity"];
const breakdownPressure = 100;
const awakePressureCap = 88;
const awakeClarity = 96;
const awakeBoundary = 94;
const chapter01Cast = [
  {
    name: "程墨",
    role: "主角",
    description: "害怕冲突，习惯把不舒服解释成自己太敏感。",
  },
  {
    name: "陈婷",
    role: "女友",
    description: "想要沟通，却常用攻击性的方式确认关系还在不在。",
  },
];

const chapter02Cast = [
  {
    name: "程墨",
    role: "主角",
    description: "经历争吵后变得疲惫，急需一个不用解释的地方。",
  },
  {
    name: "贺骁",
    role: "死党",
    description: "护短、直接、讨厌陈婷，会用兄弟立场替程墨判断这段关系。",
  },
];

const chapter03Cast = [
  {
    name: "程墨",
    role: "主角",
    description: "和陈婷再次吵崩后情绪失控，去了酒吧，既想逃开又不想一个人待着。",
  },
  {
    name: "林叙",
    role: "Gay 朋友",
    description: "温柔、克制、会照顾人。暧昧不强迫，却让程墨在抗拒里感到放松。",
  },
];

const chapter04Cast = [
  {
    name: "程墨",
    role: "主角",
    description: "被陈婷约出来谈谈，却没想到现场还有另一个人。",
  },
  {
    name: "陈婷",
    role: "女友",
    description: "不想再把谈话变成争吵，于是带来了她信任的人。",
  },
  {
    name: "许晚",
    role: "心理咨询师",
    description: "陈婷的闺蜜，也是心理咨询师。她说自己只是来帮他们把话说慢一点。",
  },
];

const chapter05Cast = [
  {
    name: "程墨",
    role: "主角",
    description: "被邀请参加贺骁的生日局，却发现今晚到场的人比想象中复杂。",
  },
  {
    name: "贺骁",
    role: "死党",
    description: "生日局的主人，嘴上说只是热闹一下，却始终掌控着现场节奏。",
  },
  {
    name: "林叙",
    role: "朋友",
    description: "出现在贺骁的生日局里，态度温和，却让程墨感到说不出的不对劲。",
  },
  {
    name: "许晚",
    role: "陈婷的闺蜜",
    description: "因为陈婷联系不上程墨而赶来，她的出现让局面变得更难判断。",
  },
];

const chapters = {
  1: {
    number: 1,
    title: "第一章·裂缝",
    summary: "深夜回家后，程墨和陈婷的争吵被一条来自贺骁的消息打断。",
    entryLabel: "进入第一章",
    nodes: chapter01,
    cast: chapter01Cast,
  },
  2: {
    number: 2,
    title: "第二章·兄弟局",
    summary: "争吵结束后，贺骁把程墨带去吃夜宵。兄弟之间的话，说得直接，也说得很重。",
    entryLabel: "进入第二章",
    nodes: chapter02,
    cast: chapter02Cast,
  },
  3: {
    number: 3,
    title: "第三章·酒吧偶遇",
    summary: "和陈婷再次吵崩后，程墨去了酒吧，遇见林叙。暧昧、抵触和被安抚的舒服感同时出现。",
    entryLabel: "进入第三章",
    nodes: chapter03,
    cast: chapter03Cast,
  },
  4: {
    number: 4,
    title: "第四章·旁听者",
    summary: "陈婷带来许晚，想让谈话不再失控。许晚看似中立，却说中了程墨没有告诉过陈婷的旧伤。",
    entryLabel: "进入第四章",
    nodes: chapter04,
    cast: chapter04Cast,
  },
  5: {
    number: 5,
    title: "第五章·庆生宴",
    summary: "贺骁的生日局上，程墨见到了几个本不该同时出现的人。那晚的每一句话，都让他越来越不安。",
    entryLabel: "进入第五章",
    nodes: chapter05,
    cast: chapter05Cast,
  },
  6: {
    number: 6,
    title: "第六章·逃出生天",
    summary: "",
    entryLabel: "进入第六章",
    nodes: chapter06,
    cast: [],
  },
} as const;

type ChapterNumber = keyof typeof chapters;
type ChapterStatsMap = Partial<Record<ChapterNumber, Stats>>;
const progressStorageKey = "intimate-trap-latest-chapter";
const chapterStatsStorageKey = "intimate-trap-chapter-end-stats";

function readLatestChapter(): ChapterNumber {
  const saved = Number(window.localStorage.getItem(progressStorageKey));
  return saved >= 1 && saved <= 6 ? (saved as ChapterNumber) : 1;
}

function saveLatestChapter(chapterNumber: ChapterNumber) {
  window.localStorage.setItem(progressStorageKey, String(chapterNumber));
}

function readChapterEndStats(): ChapterStatsMap {
  try {
    const raw = window.localStorage.getItem(chapterStatsStorageKey);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, Stats>;
    const records: ChapterStatsMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      const chapterKey = Number(key);
      if (chapterKey >= 1 && chapterKey <= 6) {
        records[chapterKey as ChapterNumber] = value;
      }
    }
    return records;
  } catch {
    return {};
  }
}

function saveChapterEndStats(records: ChapterStatsMap) {
  window.localStorage.setItem(chapterStatsStorageKey, JSON.stringify(records));
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function applyEffects(stats: Stats, effects: Effect): Stats {
  const next = { ...stats };
  for (const [key, delta] of Object.entries(effects) as [StatKey, number][]) {
    next[key] = clamp(next[key] + delta);
  }
  return next;
}

function isChoiceAvailable(choice: Choice, stats: Stats) {
  if (!choice.condition) {
    return true;
  }

  const value = stats[choice.condition.stat];
  if (choice.condition.min !== undefined && value < choice.condition.min) {
    return false;
  }
  if (choice.condition.max !== undefined && value > choice.condition.max) {
    return false;
  }
  return true;
}

function effectText(effects: Effect) {
  const entries = Object.entries(effects) as [StatKey, number][];
  if (entries.length === 0) {
    return "数值无变化";
  }

  return entries
    .map(([key, value]) => `${statLabels[key]} ${value > 0 ? "+" : ""}${value}`)
    .join(" / ");
}

function finalCommentLines(comment: string) {
  return comment.split("\n\n").flatMap((paragraph, paragraphIndex) => {
    const lines = paragraph.match(/[^。？！：，、；]+[。？！：，、；]?/g)?.map((line) => line.trim()).filter(Boolean) ?? [];
    return paragraphIndex === 0 ? lines : ["", ...lines];
  });
}

function choiceBubbleText(text: string) {
  if (text.includes("你刚才那句")) {
    return text.replace(/[。！？]$/, "");
  }

  const quoted = text.match(/[“"](.+?)[”"]/);
  if (quoted?.[1]) {
    return quoted[1];
  }

  return text
    .replace(/^(装作没听见，|低声说：|回应：|解释：|承认：|反问：|追问：|继续道歉：|压住火：|顶回去：|设限：|当着陈婷回复贺骁：)/, "")
    .replace(/^把手机扣下：/, "")
    .replace(/[。！？]$/, "");
}

function normalizeDialogueText(text: string) {
  return text.trim().replace(/[。！？!?，,]/g, "");
}

function isRepeatedLine(previous: DialogueLine | undefined, next: DialogueLine) {
  if (!previous || previous.speaker !== next.speaker) {
    return false;
  }

  const previousText = normalizeDialogueText(previous.text);
  const nextText = normalizeDialogueText(next.text);
  return previousText === nextText || previousText.includes(nextText) || nextText.includes(previousText);
}

function appendLine(lines: DialogueLine[], next: DialogueLine) {
  return isRepeatedLine(lines[lines.length - 1], next) ? lines : [...lines, next];
}

function findNode(chapterNumber: ChapterNumber, id: string): StoryNode {
  const node = chapters[chapterNumber].nodes.find((item) => item.id === id);
  if (!node) {
    throw new Error(`Missing story node: chapter ${chapterNumber}, ${id}`);
  }
  return node;
}

function chapter5Resolution(stats: Stats) {
  if (stats.pressure >= breakdownPressure) {
    return "reveal_breakdown";
  }

  if (stats.clarity >= awakeClarity && stats.boundary >= awakeBoundary && stats.pressure < awakePressureCap) {
    return "reveal_awake";
  }

  return relationRoutes(stats)[0].id;
}

function chapter5Revealer(stats: Stats) {
  if (stats.pressure >= breakdownPressure) {
    return "reveal_breakdown";
  }

  return relationRoutes(stats)[0].id;
}

function relationRoutes(stats: Stats) {
  const routes = [
    { id: "reveal_he", value: stats.heControl },
    { id: "reveal_lin", value: stats.linDependency + 18 },
    { id: "reveal_xu", value: stats.xuAmbiguity + 24 },
    { id: "reveal_chen", value: stats.chenTrust + 10 },
  ];
  return routes.sort((a, b) => b.value - a.value);
}

function chapter5Counter(stats: Stats) {
  return chapter5Resolution(stats).replace("reveal_", "he_counter_");
}

function chapter6Resolution(stats: Stats) {
  return chapter5Resolution(stats).replace("reveal_", "ending_");
}

function resolveNextNodeId(next: string, stats: Stats) {
  if (next === "__chapter5_resolution__") {
    return chapter5Resolution(stats);
  }
  if (next === "__chapter5_counter__") {
    return chapter5Counter(stats);
  }
  if (next === "__chapter6_resolution__") {
    return chapter6Resolution(stats);
  }

  return next;
}

function StatBar({ label, value, hidden }: { label: string; value: number; hidden?: boolean }) {
  return (
    <div className="stat-row">
      <div className="stat-label">
        <span>{label}</span>
        <strong>{hidden ? "??" : value}</strong>
      </div>
      <div className="stat-track">
        <span style={{ width: `${hidden ? Math.min(value, 88) : value}%` }} />
      </div>
    </div>
  );
}

function App() {
  const stageRef = useRef<HTMLElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isTransitioningRef = useRef(false);
  const [chapterNumber, setChapterNumber] = useState<ChapterNumber>(1);
  const [nodeId, setNodeId] = useState("start");
  const [lineIndex, setLineIndex] = useState(0);
  const [transcript, setTranscript] = useState<DialogueLine[]>([findNode(1, "start").lines[0]]);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [showStats, setShowStats] = useState(false);
  const [choiceEcho, setChoiceEcho] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [choiceToast, setChoiceToast] = useState("");
  const [deepBreathLeft, setDeepBreathLeft] = useState(2);
  const [deepBreathUsedNodes, setDeepBreathUsedNodes] = useState<string[]>([]);
  const [chapterEntryStats, setChapterEntryStats] = useState<Stats>(initialStats);
  const [chapterEndStats, setChapterEndStats] = useState<ChapterStatsMap>(() => readChapterEndStats());
  const [insightText, setInsightText] = useState("");
  const [finalResultOpen, setFinalResultOpen] = useState(false);
  const [noticePulse, setNoticePulse] = useState(0);
  const [screen, setScreen] = useState<"start" | "intro" | "game">("start");
  const [lastChange, setLastChange] = useState("等待你的第一次选择。");
  const [history, setHistory] = useState<string[]>([]);
  const [latestChapter, setLatestChapter] = useState<ChapterNumber>(() => readLatestChapter());
  const [showChapters, setShowChapters] = useState(false);

  const chapter = chapters[chapterNumber];
  const node = useMemo(() => findNode(chapterNumber, nodeId), [chapterNumber, nodeId]);
  const canChoose = lineIndex >= node.lines.length - 1;
  const progress = Math.round(((chapter.nodes.findIndex((item) => item.id === node.id) + 1) / chapter.nodes.length) * 100);

  useEffect(() => {
    if (!node.ending || !canChoose) {
      return;
    }
    setChapterEndStats((records) => {
      const next = { ...records, [chapterNumber]: stats };
      saveChapterEndStats(next);
      return next;
    });
  }, [canChoose, chapterNumber, node.ending, stats]);

  function resetChapterState(targetChapter: ChapterNumber = chapterNumber, statsSnapshot?: Stats, startNodeId = "start") {
    setNodeId(startNodeId);
    setLineIndex(0);
    setTranscript([findNode(targetChapter, startNodeId).lines[0]]);
    if (statsSnapshot) {
      setStats(statsSnapshot);
    }
    setLastChange("等待你的第一次选择。");
    setHistory([]);
    setShowStats(false);
    setShowChapters(false);
    setChoiceEcho(null);
    setChoiceToast("");
    setDeepBreathLeft(2);
    setDeepBreathUsedNodes([]);
    setInsightText("");
    setFinalResultOpen(false);
    isTransitioningRef.current = false;
    setIsTransitioning(false);
  }

  function restart() {
    setScreen("start");
    setChapterNumber(1);
    setChapterEntryStats(initialStats);
    resetChapterState(1, initialStats);
  }

  function startGame() {
    setLatestChapter(1);
    saveLatestChapter(1);
    setChapterEndStats({});
    saveChapterEndStats({});
    setChapterNumber(1);
    setScreen("intro");
    setChapterEntryStats(initialStats);
    resetChapterState(1, initialStats);
  }

  function continueGame() {
    const entryStats = getChapterEntryStats(latestChapter);
    setChapterNumber(latestChapter);
    setChapterEntryStats(entryStats);
    if (latestChapter === 6) {
      setScreen("game");
      resetChapterState(latestChapter, entryStats, chapter6Resolution(entryStats));
      return;
    }
    setScreen("intro");
    resetChapterState(latestChapter, entryStats);
  }

  function beginChapter() {
    const nextLatest = chapterNumber > latestChapter ? chapterNumber : latestChapter;
    setLatestChapter(nextLatest);
    saveLatestChapter(nextLatest);
    setScreen("game");
    resetChapterState(chapterNumber);
  }

  function replayChapter() {
    setScreen("game");
    setFinalResultOpen(false);
    if (chapterNumber === 6) {
      resetChapterState(chapterNumber, chapterEntryStats, nodeId);
      return;
    }
    resetChapterState(chapterNumber, chapterEntryStats);
  }

  function getChapterEntryStats(targetChapter: ChapterNumber) {
    if (targetChapter === 1) {
      return initialStats;
    }
    const previousChapter = (targetChapter - 1) as ChapterNumber;
    return chapterEndStats[previousChapter] ?? initialStats;
  }

  function openChapterRecord(targetChapter: ChapterNumber) {
    if (targetChapter > latestChapter) {
      return;
    }
    const entryStats = getChapterEntryStats(targetChapter);
    setChapterNumber(targetChapter);
    setChapterEntryStats(entryStats);
    setScreen("game");
    if (targetChapter === 6) {
      resetChapterState(targetChapter, entryStats, chapter6Resolution(entryStats));
      return;
    }
    resetChapterState(targetChapter, entryStats);
  }

  function goNextChapter() {
    if (chapterNumber >= 6) {
      setChoiceToast("下一章还在设计中");
      setNoticePulse((value) => value + 1);
      return;
    }

    const completedRecords = { ...chapterEndStats, [chapterNumber]: stats };
    setChapterEndStats(completedRecords);
    saveChapterEndStats(completedRecords);
    const nextChapter = (chapterNumber + 1) as ChapterNumber;
    setLatestChapter((current) => {
      const nextLatest = nextChapter > current ? nextChapter : current;
      saveLatestChapter(nextLatest);
      return nextLatest;
    });
    setChapterNumber(nextChapter);
    setChapterEntryStats(stats);
    if (nextChapter === 6) {
      setScreen("game");
      resetChapterState(nextChapter, undefined, chapter6Resolution(stats));
      return;
    }
    setScreen("intro");
    resetChapterState(nextChapter);
  }

  function advance() {
    if (isTransitioningRef.current || isTransitioning) {
      return;
    }

    if (canChoose && node.choices && !hasMeaningfulChoices) {
      choose(node.choices[0]);
      return;
    }

    if (lineIndex < node.lines.length - 1) {
      const nextIndex = lineIndex + 1;
      setLineIndex(nextIndex);
      setTranscript((lines) => appendLine(lines, node.lines[nextIndex]));
    }
  }

  function choose(choice: Choice) {
    if (choice.skill === "deepBreath") {
      useDeepBreath(choice);
      return;
    }

    if (isTransitioningRef.current || !isChoiceAvailable(choice, stats)) {
      return;
    }

    isTransitioningRef.current = true;
    const nextStats = applyEffects(stats, choice.effects);
    const selectedText = choiceBubbleText(choice.text);
    setStats(nextStats);
    setLastChange(effectText(choice.effects));
    setHistory((items) => [`${choice.text} ｜ ${effectText(choice.effects)}`, ...items].slice(0, 4));
    if (choice.id !== "continue") {
      const playerLine: DialogueLine = {
        speaker: "程墨",
        mood: "soft",
        text: selectedText,
      };
      setTranscript((lines) => appendLine(lines, playerLine));
      setChoiceEcho(playerLine.text);
    }
    setIsTransitioning(true);
    setChoiceToast("");

    window.setTimeout(() => {
      const resolvedChoiceNext = resolveNextNodeId(choice.next, nextStats);
      const nextNodeId =
        nextStats.pressure >= breakdownPressure && ["he_xiao", "humiliation", "phone"].includes(resolvedChoiceNext)
          ? "ending_break"
          : resolvedChoiceNext;
      const nextNode = findNode(chapterNumber, nextNodeId);
      const firstLineIndex = choice.id !== "continue" && isRepeatedLine(
        { speaker: "程墨", mood: "soft", text: selectedText },
        nextNode.lines[0],
      )
        ? 1
        : 0;
      const firstLine = nextNode.lines[firstLineIndex] ?? nextNode.lines[0];

      setNodeId(nextNodeId);
      setLineIndex(firstLineIndex);
      setTranscript((lines) => appendLine(lines, firstLine));
      setChoiceEcho(null);
      isTransitioningRef.current = false;
      setIsTransitioning(false);
    }, choice.id === "continue" ? 120 : 260);
  }

  function unavailableNotice(choice: Choice) {
    if (!choice.condition) {
      return "程墨现在还无法说出这句话";
    }

    const label = statLabels[choice.condition.stat];
    if (choice.condition.min !== undefined) {
      return `${label}不足，程墨现在还无法这样回应`;
    }
    if (choice.condition.max !== undefined) {
      return `${label}过高，程墨现在无法这样回应`;
    }
    return "程墨现在还无法说出这句话";
  }

  function handleChoiceClick(choice: Choice, available: boolean) {
    if (choice.skill === "deepBreath") {
      useDeepBreath(choice);
      return;
    }

    if (available) {
      choose(choice);
      return;
    }

    setChoiceToast(unavailableNotice(choice));
    setNoticePulse((value) => value + 1);
  }

  function useDeepBreath(choice: Choice) {
    if (isTransitioningRef.current) {
      return;
    }

    if (deepBreathUsedNodes.includes(nodeId)) {
      setChoiceToast("这次对话已经深呼吸过了");
      setNoticePulse((value) => value + 1);
      return;
    }

    if (deepBreathLeft <= 0) {
      setChoiceToast("本章深呼吸次数已经用完");
      setNoticePulse((value) => value + 1);
      return;
    }

    setDeepBreathLeft((value) => value - 1);
    setDeepBreathUsedNodes((nodes) => [...nodes, nodeId]);
    setInsightText(choice.insight ?? "先停一下。对方这句话里，可能同时有真实情绪和施压成分。");
  }

  useEffect(() => {
    if (!choiceToast) {
      return;
    }

    const timeout = window.setTimeout(() => setChoiceToast(""), 1100);
    return () => window.clearTimeout(timeout);
  }, [choiceToast, noticePulse]);

  const isEnding = Boolean(node.ending);
  const hasMeaningfulChoices = Boolean(
    canChoose && node.choices && (node.choices.length > 1 || node.choices[0]?.id !== "continue"),
  );

  useEffect(() => {
    if (!stageRef.current || !bottomRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [transcript.length, choiceEcho, hasMeaningfulChoices]);

  return (
    <main className="app-shell">
      <section className="desktop-gate">
        <div>
          <p>请使用手机竖屏试玩</p>
          <strong>《亲密陷阱》是一款为手机阅读节奏设计的对话游戏。</strong>
          <span>你也可以把浏览器窗口调窄到手机比例预览。</span>
        </div>
      </section>

      <section className="phone-frame" aria-label="亲密陷阱试玩">
        {screen === "start" ? (
          <section className="start-screen">
            <div className="start-backdrop" />
            <div className="start-content">
              <div className="title-block">
                <span>心理悬疑剧情游戏</span>
                <h1>亲密陷阱</h1>
                <p>
                  是亲密，还是危机？
                  <br />
                  你的每一次选择，
                  <br />
                  都将决定你的命运。
                </p>
              </div>

              <div className="start-actions">
                <button className="start-button" type="button" onClick={startGame}>
                  开始游戏
                </button>
                <button className="start-button continue-button" type="button" onClick={continueGame}>
                  继续游戏
                </button>
              </div>

              <p className="credits">游戏策划：Codex&nbsp;&nbsp;&nbsp;游戏设计：Codex</p>
            </div>
          </section>
        ) : null}

        {screen === "intro" ? (
          <section className="chapter-intro">
            <header className="intro-head">
              <button className="icon-button" type="button" onClick={restart} aria-label="返回开始界面">
                <RotateCcw size={18} />
              </button>
              <div />
              <span />
            </header>

            <div className="intro-content">
              <div className="intro-title">
                <strong>{chapter.title}</strong>
              </div>

              {chapterNumber === 5 ? (
                <p className="intro-summary">{chapter.summary}</p>
              ) : (
                <div className="cast-list">
                  {chapter.cast.map((person) => (
                    <article className="cast-card" key={person.name}>
                      <div className="cast-avatar">{person.name.slice(0, 1)}</div>
                      <div>
                        <div className="cast-name">
                          <strong>{person.name}</strong>
                          <span>{person.role}</span>
                        </div>
                        <p>{person.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <button className="start-button intro-button" type="button" onClick={beginChapter}>
                {chapter.entryLabel}
              </button>
            </div>
          </section>
        ) : null}

        {screen === "game" ? (
          <>
        <header className="topbar">
          <button className="icon-button" type="button" onClick={() => setShowChapters(true)} aria-label="章节记录">
            <List size={18} />
          </button>
          <div>
            <p>{node.scene}</p>
            <h1>{chapter.title}</h1>
          </div>
          <button className="icon-button" type="button" onClick={() => setShowStats(true)} aria-label="查看状态">
            <Heart size={21} />
          </button>
        </header>

        <div className="progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <section className="stage" onClick={advance} ref={stageRef}>
          <div className="room-light" />
          {chapterNumber !== 6 ? (
            <div className="chapter-card">
              <span>本章梗概</span>
              <strong>{chapter.summary}</strong>
            </div>
          ) : null}

          <div className="dialogue-list">
            {transcript.map((line, index) => (
              <article
                className={`bubble bubble-${line.speaker === "程墨" ? "self" : line.speaker === "旁白" ? "narrator" : "other"} speaker-${line.speaker} mood-${line.mood ?? "soft"}`}
                key={`${index}-${line.speaker}-${line.text}`}
              >
                {line.speaker !== "旁白" ? <span className="speaker">{line.speaker}</span> : null}
                <p>{line.text}</p>
              </article>
            ))}
            <div className="scroll-anchor" ref={bottomRef} />
          </div>
        </section>

        <footer className="choice-area">
          {!canChoose || (node.choices && !hasMeaningfulChoices) ? (
            <div className="tap-prompt">点击屏幕继续</div>
          ) : hasMeaningfulChoices ? (
            <div className="choice-prompt">需要你做出回应</div>
          ) : node.finalResult ? (
            <button className="final-reveal-button" type="button" onClick={() => setFinalResultOpen(true)}>
              查看结局
            </button>
          ) : (
            <div className="ending-card">
              <strong>{node.ending}</strong>
              <div className="ending-actions">
                <button className="secondary-action" type="button" onClick={replayChapter}>
                  重新来过
                </button>
                <button type="button" onClick={goNextChapter}>
                  {chapterNumber >= 6 ? "结束" : "下一章节"}
                </button>
              </div>
            </div>
          )}
        </footer>

        {hasMeaningfulChoices ? (
          <div className="choice-modal" role="dialog" aria-modal="true" aria-label="选择程墨的回应">
            <div className="choice-sheet">
              <div className="choice-sheet-head">
                <span>选择程墨的回应</span>
              </div>
              <div className="choices">
                {[...node.choices!]
                  .sort((a, b) => Number(a.skill === "deepBreath") - Number(b.skill === "deepBreath"))
                  .map((choice) => {
                  const deepBreathUnavailable =
                    choice.skill === "deepBreath" && (deepBreathLeft <= 0 || deepBreathUsedNodes.includes(nodeId));
                  const available = isChoiceAvailable(choice, stats) && !deepBreathUnavailable;
                  const label =
                    choice.skill === "deepBreath"
                      ? `深呼吸：识别隐藏策略（剩余 ${deepBreathLeft} 次）`
                      : choice.text;
                  return (
                    <button
                      className={`choice-button ${choice.skill === "deepBreath" ? "skill-choice" : ""}`}
                      type="button"
                      key={choice.id}
                      aria-disabled={!available || isTransitioning}
                      onClick={() => handleChoiceClick(choice, available && !isTransitioning)}
                    >
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {choiceToast ? (
              <div className="choice-toast" key={noticePulse}>
                {choiceToast}
              </div>
            ) : null}
            {insightText ? (
              <div className="insight-layer">
                <div className="insight-card">
                  <span>深呼吸</span>
                  <p>{insightText}</p>
                  <button type="button" onClick={() => setInsightText("")}>
                    知道了
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {node.finalResult && canChoose && finalResultOpen ? (
          <div className="final-layer" role="dialog" aria-modal="true" aria-label={node.finalResult.title}>
            <div className="final-card">
              <span>结局</span>
              <h2>{node.finalResult.title}</h2>
              <div className="final-lines">
                {finalCommentLines(node.finalResult.comment).map((line, index) =>
                  line ? (
                    <p
                      className="final-line"
                      style={{ animationDelay: `${0.55 + index * 0.46}s` }}
                      key={`${index}-${line}`}
                    >
                      {line}
                    </p>
                  ) : (
                    <div className="final-gap" key={`gap-${index}`} />
                  ),
                )}
              </div>
              <div
                className="final-actions"
                style={{ animationDelay: `${1 + finalCommentLines(node.finalResult.comment).length * 0.46}s` }}
              >
                <button className="secondary-action" type="button" onClick={replayChapter}>
                  重看结局
                </button>
                <button type="button" onClick={restart}>
                  回到首页
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <aside className={`stat-drawer chapter-drawer ${showChapters ? "open" : ""}`} aria-hidden={!showChapters}>
          <div className="drawer-panel">
            <div className="drawer-head">
              <div>
                <p>章节记录</p>
                <h2>重玩章节</h2>
              </div>
              <button className="icon-button dark" type="button" onClick={() => setShowChapters(false)} aria-label="关闭">
                <X size={18} />
              </button>
            </div>

            <div className="chapter-record-list">
              {Object.values(chapters).map((item) => {
                const targetChapter = item.number as ChapterNumber;
                const unlocked = targetChapter <= latestChapter;
                const recorded = Boolean(chapterEndStats[targetChapter]);
                return (
                  <button
                    className="chapter-record-button"
                    type="button"
                    disabled={!unlocked}
                    key={item.number}
                    onClick={() => openChapterRecord(targetChapter)}
                  >
                    <strong>{item.title}</strong>
                    <span>
                      {unlocked
                        ? targetChapter === 1
                          ? "从初始状态开始"
                          : "从上一章结束状态开始"
                        : "未解锁"}
                    </span>
                    {recorded ? <small>已记录本章结束数值</small> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <aside className={`stat-drawer ${showStats ? "open" : ""}`} aria-hidden={!showStats}>
          <div className="drawer-panel">
            <div className="drawer-head">
              <div>
                <p>程墨状态</p>
                <h2>选择反馈</h2>
              </div>
              <button className="icon-button dark" type="button" onClick={() => setShowStats(false)} aria-label="关闭">
                <X size={18} />
              </button>
            </div>

            <div className="stats-block">
              {mainStats.map((key) => (
                <StatBar key={key} label={statLabels[key]} value={stats[key]} />
              ))}
            </div>

            <div className="last-change">
              <span>最近变化</span>
              <p>{lastChange}</p>
            </div>

            <div className="hidden-block">
              <span>隐藏倾向</span>
              {hiddenStats.map((key) => (
                <StatBar key={key} label={statLabels[key]} value={stats[key]} hidden />
              ))}
            </div>

            <div className="history">
              <span>选择记录</span>
              {history.length === 0 ? <p>暂无记录</p> : history.map((item) => <p key={item}>{item}</p>)}
            </div>
          </div>
        </aside>
          </>
        ) : null}

      </section>
    </main>
  );
}

export default App;
