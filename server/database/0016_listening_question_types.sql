ALTER TABLE `mock_questions` MODIFY COLUMN `type` enum(
  'mcq',
  'tfng',
  'ynng',
  'short_answer',
  'writing',
  'speaking',
  'one_choice',
  'two_choices',
  'three_choices',
  'four_choices',
  'five_choices',
  'matching',
  'map_labeling',
  'plan_labeling',
  'visual_labeling',
  'diagram_labeling',
  'form_completion',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'summary_completion',
  'sentence_completion',
  'short_answers'
) NOT NULL;
--> statement-breakpoint
ALTER TABLE `mock_sections` ADD `questionLayout` text;
