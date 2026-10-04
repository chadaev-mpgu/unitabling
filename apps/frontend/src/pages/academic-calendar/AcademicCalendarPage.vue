<script setup lang="ts">
import { computed } from 'vue';

import { ConfirmDialog } from '@/components/confirm';
import {
  AcademicCalendarSettingsPanel,
  AcademicCalendarToolbar,
  AcademicCalendarWeekGrid,
  WeekOverrideDialog,
} from '@/pages/academic-calendar/components/academic-calendar-editor';
import { AcademicCalendarList } from '@/pages/academic-calendar/components/academic-calendar-list';
import { useAcademicCalendarEditor } from '@/pages/academic-calendar/useAcademicCalendarEditor.ts';

const {
  listItems,
  selectedKey,
  draft,
  draftStats,
  isNew,
  isDirty,
  canSave,
  canDelete,
  canDeleteHint,
  error,
  holidayError,
  confirm,
  weekViews,
  weekPatternOptions,
  selectedWeek,
  holidayRanges,
  settingsVisible,
  select,
  create,
  duplicate,
  revert,
  save,
  askRemove,
  confirmAction,
  cancelConfirm,
  openWeek,
  closeWeek,
  setWeekOverride,
  setName,
  setStartDate,
  setWeeks,
  setDefaultPattern,
  addHolidayRange,
  removeHolidays,
  toggleSettings,
} = useAcademicCalendarEditor();

/** Подпись шаблона по умолчанию для пункта «Как в календаре» в диалоге недели. */
const defaultPatternName = computed(
  () =>
    weekPatternOptions.value.find((option) => option.id === draft.value.defaultPatternId)?.name ??
    'шаблон не выбран',
);

/** Применяет выбранный шаблон к неделе и закрывает диалог. */
function applyWeekOverride(patternId: string | null): void {
  const week = selectedWeek.value;
  if (!week) return;
  setWeekOverride(week.index, patternId);
  closeWeek();
}
</script>

<template>
  <ConfirmDialog
    v-if="confirm"
    :open="true"
    :title="confirm.title"
    :description="confirm.description"
    :confirm-label="confirm.confirmLabel"
    :destructive="confirm.destructive"
    :blocked="confirm.blocked"
    @confirm="confirmAction"
    @cancel="cancelConfirm"
  />

  <WeekOverrideDialog
    :open="selectedWeek !== null"
    :week="selectedWeek"
    :pattern-options="weekPatternOptions"
    :default-pattern-name="defaultPatternName"
    @apply="applyWeekOverride"
    @cancel="closeWeek"
  />

  <div data-slot="academic-calendar-page" class="flex min-h-0 w-full flex-1 flex-row gap-3">
    <div class="w-[300px] shrink-0">
      <AcademicCalendarList
        :rows="listItems"
        :selected-key="selectedKey"
        @select="select"
        @create="create"
      />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <AcademicCalendarToolbar
        :title="draft.name.trim() || 'Новый календарь'"
        :stats="draftStats"
        :is-new="isNew"
        :is-dirty="isDirty"
        :can-save="canSave && isDirty"
        :can-delete="canDelete"
        :can-delete-hint="canDeleteHint"
        :settings-visible="settingsVisible"
        :error="error"
        @save="save"
        @revert="revert"
        @duplicate="duplicate"
        @remove="askRemove"
        @toggle-settings="toggleSettings"
      />

      <AcademicCalendarWeekGrid
        :weeks="weekViews"
        :selected-index="selectedWeek?.index ?? null"
        @open="openWeek"
      />
    </div>

    <div class="w-[300px] shrink-0">
      <AcademicCalendarSettingsPanel
        v-if="settingsVisible"
        :name="draft.name"
        :start-date="draft.startDate"
        :weeks="draft.weeks"
        :default-pattern-id="draft.defaultPatternId"
        :pattern-options="weekPatternOptions"
        :holidays="holidayRanges"
        :holiday-error="holidayError"
        @update:name="setName"
        @update:start-date="setStartDate"
        @update:weeks="setWeeks"
        @update:default-pattern="setDefaultPattern"
        @add:holiday-range="addHolidayRange"
        @remove:holiday="removeHolidays"
        @close="toggleSettings"
      />
    </div>
  </div>
</template>
