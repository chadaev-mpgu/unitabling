<script setup lang="ts">
import type { DayPatternItem } from '@/domain/day-pattern.ts';
import { ConfirmDialog } from '@/components/confirm';
import {
  DayPatternSettingsPanel,
  DayPatternSlotPanel,
  DayPatternTable,
  DayPatternToolbar,
} from '@/pages/day-patterns/components/day-pattern-editor';
import { DayPatternList } from '@/pages/day-patterns/components/day-pattern-list';
import { useDayPatternEditor } from '@/pages/day-patterns/useDayPatternEditor.ts';

const {
  listItems,
  selectedKey,
  draft,
  draftStats,
  isNew,
  isDirty,
  canSave,
  canDelete,
  error,
  confirm,
  issues,
  selectedItem,
  selectedItemIssue,
  settingsVisible,
  select,
  create,
  duplicate,
  revert,
  save,
  askRemove,
  confirmAction,
  cancelConfirm,
  addItem,
  selectItem,
  updateItem,
  removeItem,
  closeItem,
  toggleSettings,
  setName,
} = useDayPatternEditor();

/** Правка пары, выбранной в таблице: диалог/панель меняет только её. */
function updateSelectedItem(patch: Partial<DayPatternItem>): void {
  const current = selectedItem.value;
  if (current) updateItem(current.position, patch);
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

  <div data-slot="day-pattern-page" class="flex min-h-0 w-full flex-1 flex-row gap-3">
    <div class="w-[300px] shrink-0">
      <DayPatternList
        :rows="listItems"
        :selected-key="selectedKey"
        @select="select"
        @create="create"
      />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <DayPatternToolbar
        :title="draft.name.trim() || 'Новый шаблон'"
        :stats="draftStats"
        :is-new="isNew"
        :is-dirty="isDirty"
        :can-save="canSave && isDirty"
        :can-delete="canDelete"
        :settings-visible="settingsVisible"
        :error="error"
        @save="save"
        @revert="revert"
        @duplicate="duplicate"
        @remove="askRemove"
        @toggle-settings="toggleSettings"
      />

      <DayPatternTable
        :items="draft.items"
        :issues="issues"
        :selected-position="selectedItem?.position ?? null"
        @select="selectItem"
        @edit="selectItem"
        @remove="removeItem"
        @add="addItem"
      />
    </div>

    <div class="flex w-[300px] shrink-0 flex-col gap-3">
      <DayPatternSlotPanel
        v-if="selectedItem"
        :item="selectedItem.item"
        :issue="selectedItemIssue"
        @update="updateSelectedItem"
        @close="closeItem"
      />

      <DayPatternSettingsPanel
        v-if="settingsVisible"
        :name="draft.name"
        @update:name="setName"
        @close="toggleSettings"
      />
    </div>
  </div>
</template>
