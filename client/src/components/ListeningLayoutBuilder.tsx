"use client";

import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import AdminSelect from "@/components/AdminSelect";
import RichLayoutEditor from "@/components/RichLayoutEditor";
import InstructionInput from "@/components/InstructionInput";
import {
  layoutBoxNumbers,
  splitLayoutGroups,
  type LayoutGroup,
} from "@/lib/listeningLayout";
import {
  LISTENING_QUESTION_TYPES,
  LISTENING_TYPE_INSTRUCTIONS,
  QUESTION_TYPE_LABELS,
  choiceSelectionCount,
  isCompletionType,
  type MockQuestionType,
} from "@shared/mock";

/** A question of the part or passage, in order, with its editors. */
export type BuilderQuestion = {
  key: string;
  type: MockQuestionType;
  number: number;
  instruction: string;
  /** Editor for a choice, matching or labeling question (null inside a group). */
  editor: ReactNode;
  /** Accepted-answer input for a completion box. */
  answerKey: ReactNode;
};

type Props = {
  /** The section's layout: one rich-text layout per completion group. */
  value: string;
  /** Called with every group, so the boxes can be synced with the questions. */
  onChange: (groups: LayoutGroup[]) => void;
  questions: BuilderQuestion[];
  existingQuestionCount: number;
  /** Adds choice, matching or labeling questions. */
  onCreateQuestions: (
    type: MockQuestionType,
    count: number,
    instruction: string
  ) => void;
  labelingMedia?: ReactNode;
  /** Types the picker offers (Listening or Reading). */
  types?: readonly MockQuestionType[];
  /** Default instruction for each type. */
  typeInstructions?: Partial<Record<MockQuestionType, string>>;
  /** Most questions this part may hold (10 per Listening part). */
  maxQuestions?: number;
  /** "part" or "passage", for the hints. */
  sectionWord?: string;
};

const LABELING_TYPES: MockQuestionType[] = [
  "map_labeling",
  "plan_labeling",
  "visual_labeling",
  "diagram_labeling",
];

export default function ListeningLayoutBuilder({
  value,
  onChange,
  questions,
  existingQuestionCount,
  onCreateQuestions,
  labelingMedia,
  types = LISTENING_QUESTION_TYPES,
  typeInstructions = LISTENING_TYPE_INSTRUCTIONS,
  maxQuestions = 10,
  sectionWord = "part",
}: Props) {
  const [selectedType, setSelectedType] = useState<MockQuestionType | "">("");
  const [count, setCount] = useState(1);
  const [instruction, setInstruction] = useState("");
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const questionSpan = selectedType
    ? Math.max(1, choiceSelectionCount(selectedType))
    : 1;
  const remainingQuestions = Math.max(0, maxQuestions - existingQuestionCount);
  const maxGroups = Math.floor(remainingQuestions / questionSpan);
  const allowedCount = Math.min(count, maxGroups);

  const byNumber = new Map(
    questions
      .filter(question => isCompletionType(question.type))
      .map(question => [question.number, question])
  );
  const groups = splitLayoutGroups(value).map(group => {
    const members = layoutBoxNumbers(group.html).flatMap(number => {
      const question = byNumber.get(number);
      return question ? [question] : [];
    });
    // A group's instruction lives on its first question once it has one.
    return {
      ...group,
      instruction: members[0]?.instruction || group.instruction,
      members,
    };
  });
  const plainGroups = (): LayoutGroup[] =>
    groups.map(({ type, instruction, html }) => ({ type, instruction, html }));
  const updateGroup = (index: number, patch: Partial<LayoutGroup>) =>
    onChange(
      plainGroups().map((group, groupIndex) =>
        groupIndex === index ? { ...group, ...patch } : group
      )
    );

  const closePicker = () => {
    setSelectedType("");
    setTypePickerOpen(false);
  };

  // Groups sit in question order, before the first question numbered after them.
  const blocks = [
    ...questions
      .filter(question => question.editor)
      .map(question => ({
        order: question.number,
        node: <div key={question.key}>{question.editor}</div>,
      })),
    ...groups.map((group, index) => {
      const numbers = group.members.map(member => member.number);
      const first = numbers.length ? Math.min(...numbers) : Infinity;
      const last = numbers.length ? Math.max(...numbers) : 0;
      const type =
        (group.type as MockQuestionType | null) ?? group.members.at(-1)?.type;
      return {
        order: first - 0.5,
        node: (
          <div
            key={`group-${index}`}
            className="space-y-4 rounded-[var(--radius-card)] border border-[var(--admin-border)] p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <p className="min-w-0 flex-1 text-sm font-semibold text-[#30363d]">
                {numbers.length
                  ? `Questions ${first}${last > first ? `–${last}` : ""}`
                  : "New group"}
                {type && (
                  <span className="font-normal text-[#747d87]">
                    {" "}
                    · {QUESTION_TYPE_LABELS[type]}
                  </span>
                )}
              </p>
              <button
                type="button"
                className="rounded p-1.5 hover:bg-red-50"
                aria-label="Remove this group"
                onClick={() =>
                  (!numbers.length ||
                    confirm("Remove this group and its questions?")) &&
                  onChange(
                    plainGroups().filter(
                      (_, groupIndex) => groupIndex !== index
                    )
                  )
                }
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-[#30363d]">
                Instructions for this group
              </span>
              <InstructionInput
                value={group.instruction}
                onChange={text => updateGroup(index, { instruction: text })}
              />
            </div>
            <p className="text-xs text-[#747d87]">
              Write the content like a document. Put the cursor anywhere — in a
              sentence, a list or a table cell — and use “+ Answer box” to drop
              in a numbered box. Boxes number themselves in order; delete a box
              to remove its question.
            </p>
            <RichLayoutEditor
              value={group.html}
              onChange={html => updateGroup(index, { html })}
              canCreate={remainingQuestions > 0}
              // The real number is given when the boxes are synced.
              onCreate={() => 0}
            />
            {group.members.length > 0 && (
              <div className="space-y-2 rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4">
                <p className="text-sm font-medium text-[#30363d]">Answer key</p>
                <p className="text-xs text-[#747d87]">
                  Separate alternative answers with “/”. Matching ignores
                  capitals and surrounding punctuation.
                </p>
                {group.members.map(member => (
                  <div key={member.key}>{member.answerKey}</div>
                ))}
              </div>
            )}
          </div>
        ),
      };
    }),
  ].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {blocks.map(block => block.node)}

      {typePickerOpen && (
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#30363d]">
            Question type
            <button
              type="button"
              className="text-xs font-medium text-[#747d87] hover:text-[#30363d]"
              onClick={closePicker}
            >
              Cancel
            </button>
          </span>
          <AdminSelect
            value={selectedType}
            onChange={event => {
              const nextType = event.target.value as MockQuestionType | "";
              const nextInstruction = nextType
                ? (typeInstructions[nextType] ?? "")
                : "";
              // A completion type starts its own layout; its boxes are added there.
              if (nextType && isCompletionType(nextType)) {
                onChange([
                  ...plainGroups(),
                  { type: nextType, instruction: nextInstruction, html: "" },
                ]);
                closePicker();
                return;
              }
              setSelectedType(nextType);
              setCount(1);
              setInstruction(nextInstruction);
            }}
          >
            <option value="">Select a question type…</option>
            {types.map(type => (
              <option key={type} value={type}>
                {QUESTION_TYPE_LABELS[type]}
              </option>
            ))}
          </AdminSelect>
        </label>
      )}

      {selectedType && (
        <div className="space-y-4 rounded-[var(--radius-card)] bg-[var(--admin-card)] p-4 sm:p-5">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-[#30363d]">
              Instructions for this group
            </span>
            <InstructionInput value={instruction} onChange={setInstruction} />
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_auto] sm:items-end">
            <label>
              <span className="mb-1.5 block text-xs font-medium text-[#30363d]">
                How many? · {remainingQuestions} of {maxQuestions} remaining
              </span>
              <AdminSelect
                value={allowedCount}
                onChange={event => setCount(Number(event.target.value))}
                disabled={!maxGroups}
              >
                {!maxGroups && (
                  <option value={0}>
                    {sectionWord === "passage"
                      ? "Test is full"
                      : "Part is full"}
                  </option>
                )}
                {Array.from({ length: maxGroups }, (_, index) => index + 1).map(
                  amount => (
                    <option key={amount} value={amount}>
                      {amount}
                    </option>
                  )
                )}
              </AdminSelect>
            </label>
            <button
              type="button"
              className="admin-button admin-button-secondary sm:justify-self-start"
              disabled={!allowedCount}
              onClick={() => {
                onCreateQuestions(selectedType, allowedCount, instruction);
                closePicker();
              }}
            >
              <Plus className="h-4 w-4" /> Add {allowedCount}{" "}
              {allowedCount === 1 ? "question" : "questions"}
            </button>
          </div>
        </div>
      )}

      {selectedType && LABELING_TYPES.includes(selectedType) && labelingMedia}

      {!typePickerOpen &&
        (remainingQuestions > 0 ? (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--admin-border)] px-5 py-8 text-sm font-medium text-[#30363d] transition-colors hover:border-[#c76f42] hover:text-[#c76f42]"
            onClick={() => {
              setSelectedType("");
              setInstruction("");
              setCount(1);
              setTypePickerOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {existingQuestionCount ? "Add more questions" : "Add question"}
            <span className="font-normal text-[#747d87]">
              · {remainingQuestions} of {maxQuestions} remaining
            </span>
          </button>
        ) : (
          <p className="rounded-[var(--radius-card)] bg-[var(--admin-card)] px-5 py-4 text-center text-sm text-[#747d87]">
            {sectionWord === "passage"
              ? "All 40 questions for this test have been added."
              : `All ${maxQuestions} questions for this part have been added.`}
          </p>
        ))}
    </div>
  );
}
