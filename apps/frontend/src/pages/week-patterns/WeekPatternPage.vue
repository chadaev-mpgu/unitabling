<script setup lang="ts">
import { ConfirmDialog } from '@/components/confirm';
import {
  WeekPatternSettingsPanel,
  WeekPatternTable,
  WeekPatternToolbar,
} from '@/pages/week-patterns/components/week-pattern-editor';
import { WeekPatternList } from '@/pages/week-patterns/components/week-pattern-list';
import { useWeekPatternEditor } from '@/pages/week-patterns/useWeekPatternEditor.ts';

const {
  listItems,
  selectedKey,
  draft,
  draftStats,
  isNew,
  isDirty,
  canSave,
  canDeleteHint,
  dayPatternOptions,
  error,
  confirm,
  issues,
  settingsVisible,
  select,
  create,
  duplicate,
  revert,
  save,
  askRemove,
  confirmAction,
  cancelConfirm,
  setDayTemplate,
  setName,
  setColor,
  toggleSettings,
} = useWeekPatternEditor();
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

  <div data-slot="week-pattern-page" class="flex min-h-0 w-full flex-1 flex-row gap-3">
    <div class="w-[300px] shrink-0">
      <WeekPatternList
        :rows="listItems"
        :selected-key="selectedKey"
        @select="select"
        @create="create"
      />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <WeekPatternToolbar
        :title="draft.name.trim() || 'Новый шаблон'"
        :stats="draftStats"
        :is-new="isNew"
        :is-dirty="isDirty"
        :can-save="canSave && isDirty"
        :can-delete-hint="canDeleteHint"
        :settings-visible="settingsVisible"
        :error="error"
        @save="save"
        @revert="revert"
        @duplicate="duplicate"
        @remove="askRemove"
        @toggle-settings="toggleSettings"
      />

      <div class="flex min-h-0 min-w-0 flex-1 flex-row gap-3">
        <div class="min-w-0 flex-1">
          <WeekPatternTable
            :days="draft.days"
            :options="dayPatternOptions"
            :issues="issues"
            @update-day="setDayTemplate"
          />
        </div>

        <div class="w-[300px] shrink-0">
          <WeekPatternSettingsPanel
            v-if="settingsVisible"
            :name="draft.name"
            :color="draft.color"
            @update:name="setName"
            @update:color="setColor"
            @close="toggleSettings"
          />
        </div>
      </div>
    </div>
  </div>
</template>
